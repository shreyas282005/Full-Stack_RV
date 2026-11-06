import { z } from 'zod'

export const loginSchema = {
  body: z.object({
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email address')
      .trim()
      .toLowerCase(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(1, 'Password cannot be empty')
  })
}

export const demoLoginSchema = {
  body: z.object({
    email: z
      .string({ required_error: 'Demo user email is required' })
      .email('Please provide a valid demo email address')
      .trim()
      .toLowerCase()
  })
}

export const registerSchema = {
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .trim()
      .min(2, 'Name must be at least 2 characters')
      .max(60, 'Name cannot exceed 60 characters'),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Please provide a valid email address')
      .trim()
      .toLowerCase(),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters')
      .max(100, 'Password cannot exceed 100 characters'),
    locality: z
      .string({ required_error: 'Locality is required' })
      .trim()
      .min(2, 'Locality must be at least 2 characters')
      .max(100, 'Locality cannot exceed 100 characters')
  })
}

