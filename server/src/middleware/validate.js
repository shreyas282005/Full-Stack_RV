import { ZodError } from 'zod'
import { BadRequestError } from '../errors/AppError.js'

export const validate = (schemas = {}) => {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body)
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query)
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params)
      }
      next()
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
          code: issue.code
        }))
        const primaryMessage = details.length > 0 ? details[0].message : 'Invalid request payload'
        return next(new BadRequestError(primaryMessage, details))
      }
      next(error)
    }
  }
}

