import { z } from 'zod'

export const notificationIdParamSchema = {
  params: z.object({
    id: z.string().uuid('Invalid notification ID format. Expected UUID.')
  })
}

export const listNotificationsSchema = {
  query: z.object({
    unreadOnly: z
      .enum(['true', 'false'])
      .optional()
      .transform((val) => val === 'true'),
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().positive().max(100).optional().default(30)
  })
}

