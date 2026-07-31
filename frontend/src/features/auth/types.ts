export type SignupPayload = {
  name: string
  email: string
  password: string
  confirmpassword: string
  phone: string
  age: number
  gender?: 'male' | 'female'
}

export type SignupResponse = {
  message: string
  userId: string
  /** Dev-only: backend echoes the OTP when SMTP isn't configured. */
  devOtp?: string
}

export type LoginPayload = {
  email: string
  password: string
}

export type AuthUser = {
  _id: string
  name: string
  email: string
  role: 'user' | 'admin'
  image?: { secure_url?: string; public_id?: string }
}

export type LoginResponse = {
  message: string
  access_token: string
  refresh_token: string
  user: AuthUser
}

export type VerifyEmailPayload = {
  email: string
  otp: string
}

export type ForgetPasswordResponse = {
  message: string
  devOtp?: string
}

export type ResetPasswordPayload = {
  email: string
  otp: string
  newPassword: string
  confirmPassword: string
}
