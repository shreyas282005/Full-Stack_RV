import * as borrowService from '../services/borrow.service.js'

export const createBorrowRequest = async (req, res, next) => {
  try {
    const borrowRequest = await borrowService.createBorrowRequest(req.body, req.user.id)
    res.status(201).json({
      success: true,
      message: 'Borrow request submitted successfully',
      data: borrowRequest
    })
  } catch (error) {
    next(error)
  }
}

export const getOutgoingRequests = async (req, res, next) => {
  try {
    const result = await borrowService.getOutgoingRequests(req.user.id, req.query)
    res.status(200).json({
      success: true,
      data: result.requests,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}

export const getIncomingRequests = async (req, res, next) => {
  try {
    const result = await borrowService.getIncomingRequests(req.user.id, req.query)
    res.status(200).json({
      success: true,
      data: result.requests,
      pagination: result.pagination
    })
  } catch (error) {
    next(error)
  }
}

export const getBorrowRequestById = async (req, res, next) => {
  try {
    const request = await borrowService.getBorrowRequestById(req.params.id, req.user.id)
    res.status(200).json({
      success: true,
      data: request
    })
  } catch (error) {
    next(error)
  }
}

export const approveBorrowRequest = async (req, res, next) => {
  try {
    const updated = await borrowService.approveBorrowRequest(req.params.id, req.user.id)
    res.status(200).json({
      success: true,
      message: 'Borrow request approved',
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

export const rejectBorrowRequest = async (req, res, next) => {
  try {
    const updated = await borrowService.rejectBorrowRequest(req.params.id, req.user.id)
    res.status(200).json({
      success: true,
      message: 'Borrow request rejected',
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

export const cancelBorrowRequest = async (req, res, next) => {
  try {
    const updated = await borrowService.cancelBorrowRequest(req.params.id, req.user.id)
    res.status(200).json({
      success: true,
      message: 'Borrow request cancelled',
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

export const activateBorrowRequest = async (req, res, next) => {
  try {
    const updated = await borrowService.activateBorrowRequest(req.params.id, req.user.id)
    res.status(200).json({
      success: true,
      message: 'Borrowing is now active and item marked as borrowed',
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

export const returnBorrowRequest = async (req, res, next) => {
  try {
    const updated = await borrowService.returnBorrowRequest(req.params.id, req.user.id)
    res.status(200).json({
      success: true,
      message: 'Item returned successfully and is now available again',
      data: updated
    })
  } catch (error) {
    next(error)
  }
}

