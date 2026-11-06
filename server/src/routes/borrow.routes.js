import { Router } from 'express'
import * as borrowController from '../controllers/borrow.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createBorrowRequestSchema,
  requestIdParamSchema,
  listBorrowRequestsSchema
} from '../schemas/borrowRequest.schema.js'

const router = Router()

// All borrow routes require authentication
router.use(authenticate)

// Create borrow request
router.post('/', validate(createBorrowRequestSchema), borrowController.createBorrowRequest)

// List requests sent by current user
router.get('/outgoing', validate(listBorrowRequestsSchema), borrowController.getOutgoingRequests)

// List requests for items owned by current user
router.get('/incoming', validate(listBorrowRequestsSchema), borrowController.getIncomingRequests)

// Single request detail (must be borrower or owner)
router.get('/:id', validate(requestIdParamSchema), borrowController.getBorrowRequestById)

// Status transition actions
router.post('/:id/approve', validate(requestIdParamSchema), borrowController.approveBorrowRequest)
router.post('/:id/reject', validate(requestIdParamSchema), borrowController.rejectBorrowRequest)
router.post('/:id/cancel', validate(requestIdParamSchema), borrowController.cancelBorrowRequest)
router.post('/:id/activate', validate(requestIdParamSchema), borrowController.activateBorrowRequest)
router.post('/:id/return', validate(requestIdParamSchema), borrowController.returnBorrowRequest)

export default router

