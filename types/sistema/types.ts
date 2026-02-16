export interface SendResponseInterface<t> {
  data: t
  message: string
  success: boolean
}

export interface SendResponseIndexInterface<T> {
  status: number
  message: string
  data: PaginationMeta<T>
}

export interface PaginationLinks {
  url: string | null
  label: string
  active: boolean
}

export interface PaginationMeta<T> {
  current_page: number
  data: T
  first_page_url: string
  from: number | null
  last_page: number
  last_page_url: string
  links: PaginationLinks[]
  next_page_url: string | null
  path: string
  per_page: number
  prev_page_url: string | null
  to: number | null
  total: number
}

export interface SendResponseErrorInterface {
  error: string
  message: string
}
export interface SendSuccessInterface {
  message: string
  success: boolean
}
