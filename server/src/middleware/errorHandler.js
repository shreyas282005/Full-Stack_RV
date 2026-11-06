import { AppError } from '../errors/AppError.js'

export const errorHandler = (err, req, res, next) => { // eslint-disable-line no-unused-vars
  // Log unexpected internal errors in development
  if (!(err instanceof AppError) || err.statusCode === 500) {
    console.error('Unhandled Application Error:', err)
  }

  // Handle Prisma known request errors
  if (err.code === 'P2002') {
    const target = Array.isArray(err.meta?.target) ? err.meta.target.join(', ') : 'field'
    return res.status(409).json({
      success: false,
      error: {
        message: `A record with this ${target} already exists.`,
        code: 'UNIQUE_CONSTRAINT_VIOLATION',
        details: err.meta
      }
    })
  }

  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: {
        message: 'The requested record does not exist or has been deleted.',
        code: 'NOT_FOUND',
        details: null
      }
    })
  }

  // Handled AppError instances
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      success: false,
      error: {
        message: err.message,
        code: err.code,
        details: err.details
      }
    })
  }

  // Generic 500 Internal Server Error fallback
  const statusCode = err.status || err.statusCode || 500
  return res.status(statusCode).json({
    success: false,
    error: {
      message: process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : err.message,
      code: 'INTERNAL_SERVER_ERROR',
      details: null
    }
  })
}

export const notFoundHandler = (req, res, next) => {
  res.status(404).json({
    success: false,
    error: {
      message: `Endpoint not found: ${req.method} ${req.originalUrl}`,
      code: 'ROUTE_NOT_FOUND',
      details: null
    }
  })
}

