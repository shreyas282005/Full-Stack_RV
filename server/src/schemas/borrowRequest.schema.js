import { z } from 'zod'
import { BorrowStatus } from '@prisma/client'

export const createBorrowRequestSchema = {
  body: z
    .object({
      itemId: z.string({ required_error: 'itemId is required' }).uuid('Invalid item ID format. Expected UUID.'),
      startDate: z.coerce.date({ required_error: 'startDate is required' }),
      endDate: z.coerce.date({ required_error: 'endDate is required' })
    })
    .refine((data) => data.startDate < data.endDate, {
      message: 'Start date must precede end date',
      path: ['endDate']
    })
    .refine(
      (data) => {
        // Disallow start dates more than 1 day in the past (to allow for timezone differences)
        const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000)
        return data.startDate >= yesterday
      },
      {
        message: 'Start date cannot be in the past',
        path: ['startDate']
      }
    )
}

export const requestIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid borrow request ID format. Expected UUID.')
  })
}

export const listBorrowRequestsSchema = {
  query: z.object({
    role: z.enum(['borrower', 'owner']).optional(),
    status: z.nativeEnum(BorrowStatus).optional(),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(20)
  })
}

