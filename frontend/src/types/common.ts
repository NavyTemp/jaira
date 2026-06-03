/**
 * Types shared across more than one feature.
 * Feature-specific types live in `features/<feature>/types.ts`.
 */

export type Id = string

export type Paginated<T> = {
  items: T[]
  total: number
  page: number
  limit: number
}

export type ApiMessageResponse = {
  message: string
}
