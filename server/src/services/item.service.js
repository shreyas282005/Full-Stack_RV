import prisma from '../db.js'
import { NotFoundError, ForbiddenError, ConflictError } from '../errors/AppError.js'
import { ItemStatus, BorrowStatus } from '@prisma/client'
import cacheService, {
  generateItemListKey,
  generateItemDetailKey
} from '../redis/cache.service.js'
import { config } from '../config/env.js'

export const listItems = async ({
  search,
  category,
  status,
  locality,
  page = 1,
  limit = 20
} = {}) => {
  // Check Redis Cache first
  const cacheKey = generateItemListKey({
    search,
    category,
    status: status || ItemStatus.AVAILABLE,
    locality,
    page,
    limit
  })

  const cached = await cacheService.get(cacheKey)
  if (cached) {
    return cached
  }

  // Fallback to PostgreSQL
  const where = {
    // If status is not provided, default to AVAILABLE for general browsing
    status: status ? status : ItemStatus.AVAILABLE,
    ...(category ? { category } : {}),
    ...(search
      ? {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } }
          ]
        }
      : {}),
    ...(locality
      ? {
          owner: {
            locality: { contains: locality, mode: 'insensitive' }
          }
        }
      : {})
  }

  const [items, total] = await Promise.all([
    prisma.item.findMany({
      where,
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            locality: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * limit,
      take: limit
    }),
    prisma.item.count({ where })
  ])

  const result = {
    items,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }

  // Populate Redis Cache
  await cacheService.set(cacheKey, result, config.redis.defaultTtl)

  return result
}

export const getItemById = async (itemId) => {
  // Check Redis Cache first
  const cacheKey = generateItemDetailKey(itemId)
  const cached = await cacheService.get(cacheKey)
  if (cached) {
    return cached
  }

  // Fallback to PostgreSQL
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          locality: true,
          createdAt: true
        }
      },
      // Include active/approved booking windows so borrowers know unavailable intervals
      borrowRequests: {
        where: {
          status: { in: [BorrowStatus.APPROVED, BorrowStatus.ACTIVE] },
          endDate: { gte: new Date() }
        },
        select: {
          id: true,
          startDate: true,
          endDate: true,
          status: true
        },
        orderBy: { startDate: 'asc' }
      }
    }
  })

  if (!item) {
    throw new NotFoundError(`Item with ID "${itemId}" not found.`)
  }

  // Populate Redis Cache
  await cacheService.set(cacheKey, item, config.redis.itemDetailTtl)

  return item
}

export const createItem = async (itemData, ownerId) => {
  const item = await prisma.item.create({
    data: {
      ...itemData,
      ownerId
    },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          locality: true
        }
      }
    }
  })

  // Invalidate Redis catalog lists
  await cacheService.invalidateItemCache()

  return item
}

export const updateItem = async (itemId, updateData, userId) => {
  const item = await prisma.item.findUnique({
    where: { id: itemId }
  })

  if (!item) {
    throw new NotFoundError(`Item with ID "${itemId}" not found.`)
  }

  if (item.ownerId !== userId) {
    throw new ForbiddenError('You can only update your own items.')
  }

  const updated = await prisma.item.update({
    where: { id: itemId },
    data: updateData,
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          locality: true
        }
      }
    }
  })

  // Invalidate specific item cache and catalog lists
  await cacheService.invalidateItemCache(itemId)

  return updated
}

export const deleteItem = async (itemId, userId) => {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      borrowRequests: {
        where: {
          status: { in: [BorrowStatus.APPROVED, BorrowStatus.ACTIVE] }
        }
      }
    }
  })

  if (!item) {
    throw new NotFoundError(`Item with ID "${itemId}" not found.`)
  }

  if (item.ownerId !== userId) {
    throw new ForbiddenError('You can only delete your own items.')
  }

  // Prevent deleting item with active or approved borrow requests in flight
  if (item.borrowRequests.length > 0) {
    throw new ConflictError(
      'Cannot delete item while it has approved or active borrowing requests in progress.'
    )
  }

  await prisma.item.delete({
    where: { id: itemId }
  })

  // Invalidate specific item cache and catalog lists
  await cacheService.invalidateItemCache(itemId)

  return { message: 'Item deleted successfully', id: itemId }
}
