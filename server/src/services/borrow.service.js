import prisma from '../db.js'
import {
  BadRequestError,
  NotFoundError,
  ForbiddenError,
  ConflictError
} from '../errors/AppError.js'
import { BorrowStatus, ItemStatus, NotificationType } from '@prisma/client'
import { emitToUser, broadcastEvent } from '../socket/index.js'
import cacheService from '../redis/cache.service.js'

/**
 * Creates a new borrow request.
 * Enforces:
 *  - Self-borrow prevention (cannot borrow own items)
 *  - Date sanity (startDate < endDate)
 *  - Item availability check (cannot be MAINTENANCE or UNAVAILABLE)
 *  - Overlap prevention (cannot conflict with APPROVED or ACTIVE bookings)
 *  - Duplicate pending request check
 */
export const createBorrowRequest = async ({ itemId, startDate, endDate }, borrowerId) => {
  const item = await prisma.item.findUnique({
    where: { id: itemId },
    include: {
      owner: {
        select: {
          id: true,
          name: true,
          email: true
        }
      }
    }
  })

  if (!item) {
    throw new NotFoundError(`Item with ID "${itemId}" not found.`)
  }

  // Business Rule 1: Cannot borrow own item
  if (item.ownerId === borrowerId) {
    throw new BadRequestError('You cannot create a borrow request for an item that you own.')
  }

  // Business Rule 2: Item status check
  if (item.status === ItemStatus.MAINTENANCE || item.status === ItemStatus.UNAVAILABLE) {
    throw new BadRequestError(`This item is currently ${item.status.toLowerCase()} and cannot be borrowed.`)
  }

  // Business Rule 3: Check overlapping approved or active bookings
  const overlappingApproved = await prisma.borrowRequest.findFirst({
    where: {
      itemId,
      status: { in: [BorrowStatus.APPROVED, BorrowStatus.ACTIVE] },
      startDate: { lte: endDate },
      endDate: { gte: startDate }
    }
  })

  if (overlappingApproved) {
    throw new ConflictError(
      'This item is already booked or currently active during the requested borrowing period.'
    )
  }

  // Business Rule 4: Prevent duplicate pending requests from same borrower
  const duplicatePending = await prisma.borrowRequest.findFirst({
    where: {
      itemId,
      borrowerId,
      status: BorrowStatus.PENDING,
      startDate: { lte: endDate },
      endDate: { gte: startDate }
    }
  })

  if (duplicatePending) {
    throw new ConflictError(
      'You already have an active pending borrow request for this item overlapping these dates.'
    )
  }

  // Execute database transaction
  const { borrowRequest, notification } = await prisma.$transaction(async (tx) => {
    const createdReq = await tx.borrowRequest.create({
      data: {
        itemId,
        borrowerId,
        ownerId: item.ownerId,
        startDate,
        endDate,
        status: BorrowStatus.PENDING
      },
      include: {
        item: {
          select: {
            id: true,
            title: true,
            category: true,
            imageUrl: true
          }
        },
        borrower: {
          select: {
            id: true,
            name: true,
            locality: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            locality: true
          }
        }
      }
    })

    // Create persistent notification for item owner
    const createdNotif = await tx.notification.create({
      data: {
        userId: item.ownerId,
        title: 'New Borrow Request',
        message: `${createdReq.borrower.name} requested to borrow your "${item.title}".`,
        type: NotificationType.BORROW_REQUEST
      }
    })

    return { borrowRequest: createdReq, notification: createdNotif }
  })

  // IMPORTANT: Emit socket events ONLY after transaction commits successfully
  emitToUser(item.ownerId, 'notification:new', notification)
  emitToUser(item.ownerId, 'borrow-request:created', { request: borrowRequest })

  return borrowRequest
}

/**
 * Approves a pending borrow request.
 * Concurrency Safe: Uses PostgreSQL interactive transaction to re-verify
 * overlap collision at commit time.
 */
export const approveBorrowRequest = async (requestId, ownerId) => {
  const { updated, notification } = await prisma.$transaction(async (tx) => {
    const request = await tx.borrowRequest.findUnique({
      where: { id: requestId },
      include: {
        item: true,
        borrower: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    })

    if (!request) {
      throw new NotFoundError(`Borrow request "${requestId}" not found.`)
    }

    // Permission check: only item owner can approve
    if (request.ownerId !== ownerId) {
      throw new ForbiddenError('Only the item owner can approve this borrow request.')
    }

    // Status check: only PENDING requests can be approved
    if (request.status !== BorrowStatus.PENDING) {
      throw new BadRequestError(`Cannot approve request with status "${request.status}". Only PENDING requests can be approved.`)
    }

    // Availability check
    if (request.item.status === ItemStatus.MAINTENANCE || request.item.status === ItemStatus.UNAVAILABLE) {
      throw new BadRequestError('Cannot approve request because item is currently under maintenance or unavailable.')
    }

    // Concurrency safe check: Re-verify no other request became APPROVED or ACTIVE for these dates
    const conflictingBooking = await tx.borrowRequest.findFirst({
      where: {
        itemId: request.itemId,
        id: { not: request.id },
        status: { in: [BorrowStatus.APPROVED, BorrowStatus.ACTIVE] },
        startDate: { lte: request.endDate },
        endDate: { gte: request.startDate }
      }
    })

    if (conflictingBooking) {
      throw new ConflictError(
        'Cannot approve request: another borrowing request for this item has already been approved for overlapping dates.'
      )
    }

    // Update status to APPROVED
    const updatedReq = await tx.borrowRequest.update({
      where: { id: requestId },
      data: { status: BorrowStatus.APPROVED },
      include: {
        item: true,
        borrower: {
          select: { id: true, name: true, locality: true }
        },
        owner: {
          select: { id: true, name: true, locality: true }
        }
      }
    })

    // Notify borrower
    const createdNotif = await tx.notification.create({
      data: {
        userId: request.borrowerId,
        title: 'Borrow Request Approved!',
        message: `Your request to borrow "${request.item.title}" has been approved! Prepare for handover.`,
        type: NotificationType.REQUEST_APPROVED
      }
    })

    return { updated: updatedReq, notification: createdNotif }
  })

  // Invalidate Redis item cache because booked intervals updated
  await cacheService.invalidateItemCache(updated.itemId)

  // Real-time Socket.IO emissions
  emitToUser(updated.borrowerId, 'notification:new', notification)
  emitToUser(updated.borrowerId, 'borrow-request:updated', { request: updated })
  emitToUser(updated.ownerId, 'borrow-request:updated', { request: updated })

  return updated
}

/**
 * Rejects a pending borrow request.
 */
export const rejectBorrowRequest = async (requestId, ownerId) => {
  const { updated, notification } = await prisma.$transaction(async (tx) => {
    const request = await tx.borrowRequest.findUnique({
      where: { id: requestId },
      include: { item: true }
    })

    if (!request) {
      throw new NotFoundError(`Borrow request "${requestId}" not found.`)
    }

    if (request.ownerId !== ownerId) {
      throw new ForbiddenError('Only the item owner can reject this borrow request.')
    }

    if (request.status !== BorrowStatus.PENDING) {
      throw new BadRequestError(`Cannot reject request with status "${request.status}". Only PENDING requests can be rejected.`)
    }

    const updatedReq = await tx.borrowRequest.update({
      where: { id: requestId },
      data: { status: BorrowStatus.REJECTED },
      include: {
        item: true,
        borrower: {
          select: { id: true, name: true, locality: true }
        },
        owner: {
          select: { id: true, name: true, locality: true }
        }
      }
    })

    // Notify borrower
    const createdNotif = await tx.notification.create({
      data: {
        userId: request.borrowerId,
        title: 'Borrow Request Declined',
        message: `Your request to borrow "${request.item.title}" was declined by the owner.`,
        type: NotificationType.REQUEST_REJECTED
      }
    })

    return { updated: updatedReq, notification: createdNotif }
  })

  // Real-time Socket.IO emissions
  emitToUser(updated.borrowerId, 'notification:new', notification)
  emitToUser(updated.borrowerId, 'borrow-request:updated', { request: updated })
  emitToUser(updated.ownerId, 'borrow-request:updated', { request: updated })

  return updated
}

/**
 * Cancels a borrow request (by borrower).
 */
export const cancelBorrowRequest = async (requestId, borrowerId) => {
  const { updated, notification } = await prisma.$transaction(async (tx) => {
    const request = await tx.borrowRequest.findUnique({
      where: { id: requestId },
      include: { item: true }
    })

    if (!request) {
      throw new NotFoundError(`Borrow request "${requestId}" not found.`)
    }

    if (request.borrowerId !== borrowerId) {
      throw new ForbiddenError('Only the borrower who initiated the request can cancel it.')
    }

    if (request.status !== BorrowStatus.PENDING && request.status !== BorrowStatus.APPROVED) {
      throw new BadRequestError(`Cannot cancel request with status "${request.status}". Only PENDING or APPROVED requests can be cancelled.`)
    }

    const updatedReq = await tx.borrowRequest.update({
      where: { id: requestId },
      data: { status: BorrowStatus.CANCELLED },
      include: {
        item: true,
        borrower: {
          select: { id: true, name: true, locality: true }
        },
        owner: {
          select: { id: true, name: true, locality: true }
        }
      }
    })

    // Notify owner
    const createdNotif = await tx.notification.create({
      data: {
        userId: request.ownerId,
        title: 'Borrow Request Cancelled',
        message: `The borrower cancelled their request for "${request.item.title}".`,
        type: NotificationType.REQUEST_CANCELLED
      }
    })

    return { updated: updatedReq, notification: createdNotif }
  })

  // Invalidate cache if item was previously approved
  await cacheService.invalidateItemCache(updated.itemId)

  // Real-time Socket.IO emissions
  emitToUser(updated.ownerId, 'notification:new', notification)
  emitToUser(updated.borrowerId, 'borrow-request:updated', { request: updated })
  emitToUser(updated.ownerId, 'borrow-request:updated', { request: updated })

  return updated
}

/**
 * Marks an approved request as ACTIVE (item handover/pickup).
 * Updates item status to BORROWED.
 */
export const activateBorrowRequest = async (requestId, userId) => {
  const { updated, notification, notifyUserId, itemId } = await prisma.$transaction(async (tx) => {
    const request = await tx.borrowRequest.findUnique({
      where: { id: requestId },
      include: { item: true }
    })

    if (!request) {
      throw new NotFoundError(`Borrow request "${requestId}" not found.`)
    }

    // Both owner or borrower can initiate handover activation
    if (request.ownerId !== userId && request.borrowerId !== userId) {
      throw new ForbiddenError('You are not authorized to activate this borrow request.')
    }

    if (request.status !== BorrowStatus.APPROVED) {
      throw new BadRequestError(`Cannot activate request with status "${request.status}". Request must be in APPROVED status.`)
    }

    // Update request to ACTIVE
    const updatedReq = await tx.borrowRequest.update({
      where: { id: requestId },
      data: { status: BorrowStatus.ACTIVE },
      include: {
        item: true,
        borrower: {
          select: { id: true, name: true, locality: true }
        },
        owner: {
          select: { id: true, name: true, locality: true }
        }
      }
    })

    // Update item status to BORROWED
    await tx.item.update({
      where: { id: request.itemId },
      data: { status: ItemStatus.BORROWED }
    })

    // Notify the other party
    const targetUserId = userId === request.ownerId ? request.borrowerId : request.ownerId
    const createdNotif = await tx.notification.create({
      data: {
        userId: targetUserId,
        title: 'Borrowing Period Active',
        message: `Item handover confirmed: "${request.item.title}" is now marked as actively borrowed.`,
        type: NotificationType.BORROW_ACTIVE
      }
    })

    return {
      updated: updatedReq,
      notification: createdNotif,
      notifyUserId: targetUserId,
      itemId: request.itemId
    }
  })

  // Invalidate Redis item cache and catalog list (item status changed to BORROWED)
  await cacheService.invalidateItemCache(itemId)

  // Real-time Socket.IO emissions
  emitToUser(notifyUserId, 'notification:new', notification)
  emitToUser(updated.borrowerId, 'borrow-request:updated', { request: updated })
  emitToUser(updated.ownerId, 'borrow-request:updated', { request: updated })
  broadcastEvent('item:availability-updated', { itemId, status: ItemStatus.BORROWED })

  return updated
}

/**
 * Marks an active request as RETURNED (item returned to owner).
 * Updates item status back to AVAILABLE.
 */
export const returnBorrowRequest = async (requestId, userId) => {
  const { updated, notification, notifyUserId, itemId } = await prisma.$transaction(async (tx) => {
    const request = await tx.borrowRequest.findUnique({
      where: { id: requestId },
      include: { item: true }
    })

    if (!request) {
      throw new NotFoundError(`Borrow request "${requestId}" not found.`)
    }

    // Both owner or borrower can mark return
    if (request.ownerId !== userId && request.borrowerId !== userId) {
      throw new ForbiddenError('You are not authorized to mark this borrow request as returned.')
    }

    if (request.status !== BorrowStatus.ACTIVE) {
      throw new BadRequestError(`Cannot return request with status "${request.status}". Request must be in ACTIVE status.`)
    }

    // Update request to RETURNED
    const updatedReq = await tx.borrowRequest.update({
      where: { id: requestId },
      data: { status: BorrowStatus.RETURNED },
      include: {
        item: true,
        borrower: {
          select: { id: true, name: true, locality: true }
        },
        owner: {
          select: { id: true, name: true, locality: true }
        }
      }
    })

    // Update item status back to AVAILABLE
    await tx.item.update({
      where: { id: request.itemId },
      data: { status: ItemStatus.AVAILABLE }
    })

    // Notify the other party
    const targetUserId = userId === request.ownerId ? request.borrowerId : request.ownerId
    const createdNotif = await tx.notification.create({
      data: {
        userId: targetUserId,
        title: 'Item Returned Successfully',
        message: `"${request.item.title}" has been marked as returned and is now available again.`,
        type: NotificationType.ITEM_RETURNED
      }
    })

    return {
      updated: updatedReq,
      notification: createdNotif,
      notifyUserId: targetUserId,
      itemId: request.itemId
    }
  })

  // Invalidate Redis item cache and catalog list (item status changed to AVAILABLE)
  await cacheService.invalidateItemCache(itemId)

  // Real-time Socket.IO emissions
  emitToUser(notifyUserId, 'notification:new', notification)
  emitToUser(updated.borrowerId, 'borrow-request:updated', { request: updated })
  emitToUser(updated.ownerId, 'borrow-request:updated', { request: updated })
  broadcastEvent('item:availability-updated', { itemId, status: ItemStatus.AVAILABLE })

  return updated
}

/**
 * Queries outgoing borrow requests (sent by borrower).
 */
export const getOutgoingRequests = async (borrowerId, { status, page = 1, limit = 20 } = {}) => {
  const where = {
    borrowerId,
    ...(status ? { status } : {})
  }

  const [requests, total] = await Promise.all([
    prisma.borrowRequest.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            title: true,
            category: true,
            imageUrl: true,
            status: true
          }
        },
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
    prisma.borrowRequest.count({ where })
  ])

  return {
    requests,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

/**
 * Queries incoming borrow requests (for items owned by user).
 */
export const getIncomingRequests = async (ownerId, { status, page = 1, limit = 20 } = {}) => {
  const where = {
    ownerId,
    ...(status ? { status } : {})
  }

  const [requests, total] = await Promise.all([
    prisma.borrowRequest.findMany({
      where,
      include: {
        item: {
          select: {
            id: true,
            title: true,
            category: true,
            imageUrl: true,
            status: true
          }
        },
        borrower: {
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
    prisma.borrowRequest.count({ where })
  ])

  return {
    requests,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit)
    }
  }
}

/**
 * Retrieves details of a single borrow request.
 * User must be either borrower or owner.
 */
export const getBorrowRequestById = async (requestId, userId) => {
  const request = await prisma.borrowRequest.findUnique({
    where: { id: requestId },
    include: {
      item: {
        include: {
          owner: {
            select: { id: true, name: true, locality: true }
          }
        }
      },
      borrower: {
        select: { id: true, name: true, locality: true, email: true }
      },
      owner: {
        select: { id: true, name: true, locality: true, email: true }
      }
    }
  })

  if (!request) {
    throw new NotFoundError(`Borrow request "${requestId}" not found.`)
  }

  if (request.borrowerId !== userId && request.ownerId !== userId) {
    throw new ForbiddenError('You do not have access to view this borrow request.')
  }

  return request
}
