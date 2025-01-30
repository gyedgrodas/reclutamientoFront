import axios from 'axios'
import type { AxiosInstance, AxiosRequestConfig } from 'axios'

export const useClienteRequestSigua = () => {
  const config = useRuntimeConfig() // Configuración de tiempo de ejecución

  // Crear instancia de Axios con configuración base
  const axiosInstance: AxiosInstance = axios.create({
    baseURL: config.public.apiBaseUrlSigua,
    headers: {
      'Content-Type': 'application/json', // Igual que fetch
      'Accept': 'application/json', // O el encabezado necesario
    },
  })

  // Función genérica para realizar solicitudes HTTP
  const request = async <T>(method: string, url: string, options: AxiosRequestConfig = {}) => {
    try {
      const response = await axiosInstance.request<T>({
        method,
        url,
        ...options,
      })

      return response.data // Retorna los datos de la respuesta
    }
    catch (error) {
      console.error(`Error en ${method} ${url}:`, error)
      throw error // Lanza el error para manejarlo fuera del composable
    }
  }

  return {
    // Métodos HTTP comunes
    get<T>(url: string, options: AxiosRequestConfig = {}) {
      return request<T>('GET', url, options)
    },
    post<T>(url: string, data: any, options: AxiosRequestConfig = {}) {
      return request<T>('POST', url, { ...options, data })
    },
    put<T>(url: string, data: any, options: AxiosRequestConfig = {}) {
      return request<T>('PUT', url, { ...options, data })
    },
    delete<T>(url: string, options: AxiosRequestConfig = {}) {
      return request<T>('DELETE', url, options)
    },
  }
}
