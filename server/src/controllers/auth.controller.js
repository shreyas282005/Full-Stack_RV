import * as authService from '../services/auth.service.js'

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body
    const result = await authService.login(email, password)
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const demoLogin = async (req, res, next) => {
  try {
    const { email } = req.body
    const result = await authService.demoLogin(email)
    res.status(200).json({
      success: true,
      message: `Logged in as demo user "${result.user.name}"`,
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const register = async (req, res, next) => {
  try {
    const result = await authService.register(req.body)
    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: result
    })
  } catch (error) {
    next(error)
  }
}

export const getDemoUsers = async (req, res, next) => {
  try {
    const demoUsers = await authService.getDemoUsers()
    res.status(200).json({
      success: true,
      data: demoUsers
    })
  } catch (error) {
    next(error)
  }
}

export const getMe = async (req, res, next) => {
  try {
    const profile = await authService.getProfile(req.user.id)
    res.status(200).json({
      success: true,
      data: profile
    })
  } catch (error) {
    next(error)
  }
}

