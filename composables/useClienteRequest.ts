import type { AxiosError, AxiosInstance, AxiosRequestConfig } from 'axios'
import axios from 'axios'
import { useCookie, useRuntimeConfig } from '#imports'

export const useClienteRequest = () => {
  const config = useRuntimeConfig()
  const user = useSanctumUser()
  const options = useSanctumConfig()
  const tokenCookie = useCookie('sanctum.token.cookie')

  // Crear instancia de Axios con configuración base
  const axiosInstance: AxiosInstance = axios.create({
    baseURL: config.public.apiBaseUrl,
    headers: {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'Authorization': tokenCookie.value ? `Bearer ${tokenCookie.value}` : '',
    },
  })

  // Interceptor para manejar respuestas y errores
  axiosInstance.interceptors.response.use(
    response => response,
    async (error: AxiosError) => {
      console.error('Error en respuesta:', error.response || error)

      if (error.response?.status === 401) {
        console.warn('Token expirado, redirigiendo a login...')

        // Eliminar usuario si está autenticado
        if (user.value !== null)
          user.value = null

        // eliminar token
        tokenCookie.value = null

        // Redirigir a la página de login
        await navigateTo(options.redirect.onAuthOnly || '/login')
      }

      return Promise.reject(error)
    },
  )

  // Función genérica para realizar solicitudes HTTP
  const request = async <T>(
    method: string,
    url: string,
    data?: any,
    options: AxiosRequestConfig = {},
  ) => {
    try {
      const isFormData = data instanceof FormData

      const response = await axiosInstance.request<T>({
        method,
        url,
        data,
        headers: {
          ...options.headers,
          ...(isFormData ? { 'Content-Type': 'multipart/form-data' } : {}), // Axios maneja el boundary automáticamente
        },
        ...options,
      })

      return response.data
    }
    catch (error) {
      console.error(`Error en ${method} ${url}:`, error)
      throw error
    }
  }

  return {
    get<T>(url: string, options: AxiosRequestConfig = {}) {
      return request<T>('GET', url, undefined, options)
    },

    post<T>(url: string, data: any, options: AxiosRequestConfig = {}) {
      return request<T>('POST', url, data, options)
    },

    put<T>(url: string, data: any, options: AxiosRequestConfig = {}) {
      return request<T>('PUT', url, data, options)
    },

    deleted<T>(url: string, options: AxiosRequestConfig = {}) {
      return request<T>('DELETE', url, undefined, options)
    },
  }
}
