import { defu } from 'defu'
import { type FetchOptions } from 'ofetch'

export const useJsonApiClient = () => {
  const client = useSanctumClient()

  // Método genérico para realizar solicitudes HTTP
  const request = async <T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    options: {
      body?: Record<string, any>
      params?: FetchOptions<'json'>
    } = {},
  ) => {
    const { body, params } = options

    const mergedParams = defu(params, { method, ...(body && { body }) }) as FetchOptions<'json'>

    return client<T>(url, mergedParams)
  }

  // Métodos específicos
  const Get = <T>(url: string, params: FetchOptions<'json'> = {}) =>
    request<T>('GET', url, { params })

  const Post = <T>(
    url: string,
    body: Record<string, any>,
    params: FetchOptions<'json'> = {},
  ) => request<T>('POST', url, { body, params })

  const Put = <T>(
    url: string,
    body: Record<string, any>,
    params: FetchOptions<'json'> = {},
  ) => request<T>('PUT', url, { body, params })

  const Delete = <T>(url: string, params: FetchOptions<'json'> = {}) =>
    request<T>('DELETE', url, { params })

  return { Get, Post, Put, Delete }
}
