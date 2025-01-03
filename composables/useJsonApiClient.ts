import { defu } from 'defu'
import { type FetchOptions } from 'ofetch'
import type { Data } from './types'

export const useJsonApiClient = () => {
  const client = useSanctumClient()

  // Formatear datos según JSON:API
  const formatData = ({
    type,
    attributes,
    id,
    relationships,
  }: {
    type: string
    attributes: Record<string, any>
    id?: string
    relationships?: Record<string, { data: { id: string; type: string } | undefined }>
  }): { data: Data } => ({
    data: {
      type,
      attributes,
      ...(id && { id }),
      ...(relationships && { relationships }),
    },
  })

  // Método genérico para realizar solicitudes HTTP
  const request = async <T>(
    method: 'GET' | 'POST' | 'PUT' | 'DELETE',
    url: string,
    options: {
      attributes?: Record<string, any>
      type?: string
      id?: string
      relationships?: Record<string, { data: { id: string; type: string } | undefined }>
      params?: FetchOptions<'json'>
    } = {},
  ) => {
    const { attributes, type, id, relationships, params } = options

    const body
      = method !== 'GET' && method !== 'DELETE' && attributes && type
        ? formatData({ type, attributes, id, relationships })
        : undefined

    const mergedParams = defu(params, { method, ...(body && { body }) }) as FetchOptions<'json'>

    return client<T>(url, mergedParams)
  }

  // Métodos específicos
  const Get = <T>(url: string, params: FetchOptions<'json'> = {}) =>
    request<T>('GET', url, { params })

  const Post = <T>(
    url: string,
    attributes: Record<string, any>,
    type: string,
    relationships?: Record<string, { data: { id: string; type: string } | undefined }>,
    params: FetchOptions<'json'> = {},
  ) => request<T>('POST', url, { attributes, type, relationships, params })

  const Put = <T>(
    url: string,
    attributes: Record<string, any>,
    type: string,
    id: string,
    relationships?: Record<string, { data: { id: string; type: string } | undefined }>,
    params: FetchOptions<'json'> = {},
  ) => request<T>('PUT', url, { attributes, type, id, relationships, params })

  const Delete = <T>(url: string, params: FetchOptions<'json'> = {}) =>
    request<T>('DELETE', url, { params })

  return { Get, Post, Put, Delete }
}
