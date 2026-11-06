import * as itemService from '../services/item.service.js'

export const listItems = async (req, res, next) => {
  try {
    const result = await itemService.listItems(req.query)
    res.status(200).json({
      success: true,
      data: result.items,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}

export const getItemById = async (req, res, next) => {
  try {
    const item = await itemService.getItemById(req.params.id)
    res.status(200).json({
      success: true,
      data: item
    })
  } catch (error) {
    next(error)
  }
}

export const createItem = async (req, res, next) => {
  try {
    // Owner is strictly derived from verified JWT user ID
    const newItem = await itemService.createItem(req.body, req.user.id)
    res.status(201).json({
      success: true,
      message: 'Item created successfully',
      data: newItem
    })
  } catch (error) {
    next(error)
  }
}

export const updateItem = async (req, res, next) => {
  try {
    const updated = await itemService.updateItem(req.params.id, req.body, req.user.id)
    res.status(200).json({
      success: true,
      message: 'Item updated successfully',
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

export const deleteItem = async (req, res, next) => {
  try {
    const result = await itemService.deleteItem(req.params.id, req.user.id)
    res.status(200).json({
      success: true,
      message: result.message,
      data: { id: result.id }
    })
  } catch (error) {
    next(error)
  }
}

