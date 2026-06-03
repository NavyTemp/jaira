import { z } from 'zod'

const passwordRegex =
  /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/

const egyptPhoneRegex = /^(010|011|012|015)[0-9]{8}$/

export const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
})

export const signupSchema = z
  .object({
    name: z.string().trim().min(3, 'Name must be at least 3 characters'),
    email: z.string().email('Invalid email'),
    password: z
      .string()
      .regex(
        passwordRegex,
        'Password must include uppercase, lowercase, digit, and special character',
      ),
    confirmpassword: z.string(),
    phone: z.string().regex(egyptPhoneRegex, 'Invalid Egyptian phone number'),
    age: z
      .number()
      .min(15, 'Must be at least 15')
      .max(100, 'Must be under 100'),
    gender: z.enum(['male', 'female']),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmpassword) {
      ctx.addIssue({
        code: 'custom',
        path: ['confirmpassword'],
        message: 'Passwords do not match',
      })
    }
  })

export type LoginValues = z.infer<typeof loginSchema>
export type SignupValues = z.infer<typeof signupSchema>
