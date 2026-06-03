export type SignupPayload = {
  name: string
  email: string
  password: string
  confirmpassword: string
  phone: string
  age: number
  gender?: 'male' | 'female'
  role?: 'user' | 'admin'
}

export type LoginPayload = {
  email: string
  password: string
}

export type LoginResponse = {
  message: string
  access_token: string
  refresh_token: string
}
