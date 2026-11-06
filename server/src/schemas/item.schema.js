import { z } from 'zod'
import { ItemCategory, ItemStatus } from '@prisma/client'

export const createItemSchema = {
  body: z.object({
    title: z
      .string({ required_error: 'Item title is required' })
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(120, 'Title cannot exceed 120 characters'),
    description: z
      .string({ required_error: 'Item description is required' })
      .trim()
      .min(5, 'Description must be at least 5 characters')
      .max(2000, 'Description cannot exceed 2000 characters'),
    category: z.nativeEnum(ItemCategory, {
      errorMap: () => ({ message: `Invalid category. Must be one of: ${Object.values(ItemCategory).join(', ')}` })
    }).optional().default(ItemCategory.OTHER),
    imageUrl: z
      .string()
      .trim()
      .url('Image URL must be a valid URL')
      .optional()
      .or(z.literal(''))
  })
}

export const updateItemSchema = {
  params: z.object({
    id: z.string().uuid('Invalid item ID format. Expected UUID.')
  }),
  body: z.object({
    title: z
      .string()
      .trim()
      .min(3, 'Title must be at least 3 characters')
      .max(120, 'Title cannot exceed 120 characters')
      .optional(),
    description: z
      .string()
      .trim()
      .min(5, 'Description must be at least 5 characters')
      .max(2000, 'Description cannot exceed 2000 characters')
      .optional(),
    category: z.nativeEnum(ItemCategory).optional(),
    imageUrl: z.string().trim().url('Image URL must be a valid URL').optional().or(z.literal('')),
    status: z.nativeEnum(ItemStatus).optional()
  }).refine((data) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update'
  })
}

export const listItemsSchema = {
  query: z.object({
    search: z.string().trim().optional(),
    category: z.nativeEnum(ItemCategory).optional(),
    status: z.nativeEnum(ItemStatus).optional(),
    locality: z.string().trim().optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20)
  })
}

export const itemIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid item ID format. Expected UUID.')
  })
}

