import { Router } from 'express'
import * as itemController from '../controllers/item.controller.js'
import { authenticate } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import {
  createItemSchema,
  updateItemSchema,
  listItemsSchema,
  itemIdParamSchema
} from '../schemas/item.schema.js'

const router = Router()

// Public: List items with search & filters
router.get('/', validate(listItemsSchema), itemController.listItems)

// Public: Retrieve item details
router.get('/:id', validate(itemIdParamSchema), itemController.getItemById)

// Protected: Create new item listing (owner is authenticated user)
router.post('/', authenticate, validate(createItemSchema), itemController.createItem)

// Protected: Update existing listing (ownership enforced)
router.patch('/:id', authenticate, validate(updateItemSchema), itemController.updateItem)
router.put('/:id', authenticate, validate(updateItemSchema), itemController.updateItem)

// Protected: Delete item listing (ownership enforced)
router.delete('/:id', authenticate, validate(itemIdParamSchema), itemController.deleteItem)

export default router

