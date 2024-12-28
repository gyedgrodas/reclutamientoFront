import { defu } from 'defu';
import { ofetch, type FetchOptions } from 'ofetch';
import type { Data } from './types';

export const UseApi = () => {
  const getBaseConfig = (): FetchOptions<'json'> => {
    const config = useRuntimeConfig();
    const accessToken = useCookie('sanctum.token.cookie').value;
    return {
      baseURL: config.public.apiBaseUrl,
      headers: accessToken
        ? {
          Authorization: `Bearer ${accessToken}`,
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        }
        : {
          Accept: 'application/vnd.api+json',
          'Content-Type': 'application/vnd.api+json',
        },
      responseType: 'json',
    };
  };

  // Función para formatear datos según JSON:API
  const formatData = (
    attributes: Record<string, any>,
    type: string,
    id?: string,
    relationships?: Record<string, { data: { id: string; type: string } | undefined }> | undefined,
    links?: Record<string, string>,
    included?: Record<string, any>
  ): { data: Data } => {
    const formattedData: { data: Data } = {
      data: {
        type,
        attributes,
      },
    };

    if (id) {
      formattedData.data.id = id;
    }

    if (relationships) {
      formattedData.data.relationships = relationships;
    }

    if (links) {
      formattedData.data.links = links;
    }

    if (included) {
      formattedData.data.included = included;
    }

    return formattedData;
  };

  /* Funciones para realizar solicitudes HTTP */
  const fetchGet = async <T>(url: string, params: FetchOptions<'json'> = {}) => {
    const config = getBaseConfig();
    const mergedParams = defu(params, { method: 'GET', ...config }) as FetchOptions<'json'>;
    return ofetch<T>(url, mergedParams);
  };

  /* Función para realizar solicitudes POST
  * @param url: string
  * @param attributes: Record<string, any>
  * @param type: string
  * @param relationships?: Record<string, { data: { id: string; type: string } | undefined }> | undefined
  * @param links?: Record<string, string>
  * @param included?: Record<string, any>
  * @param params: FetchOptions<'json'> = {}
  * @returns Promise<T>
  * */
  const fetchPost = async <T>(
    url: string,
    attributes: Record<string, any>,
    type: string,
    relationships?: Record<string, { data: { id: string; type: string } | undefined }> | undefined,
    links?: Record<string, string>,
    included?: Record<string, any>,
    params: FetchOptions<'json'> = {}
  ) => {
    const config = getBaseConfig();
    const formattedBody = formatData(attributes, type, undefined, relationships, links, included);
    const mergedParams = defu(params, { method: 'POST', body: formattedBody, ...config }) as FetchOptions<'json'>;
    return ofetch<T>(url, mergedParams);
  };

  /* Función para realizar solicitudes PUT
  * @param url: string
  * @param attributes: Record<string, any>
  * @param id: string
  * @param type: string
  * @param relationships?: Record<string, { data: { id: string; type: string } | undefined }> | undefined
  * @param links?: Record<string, string>
  * @param included?: Record<string, any>
  * @param params: FetchOptions<'json'> = {}
  * @returns Promise<T>
  * */
  const fetchPut = async <T>(
    url: string,
    attributes: Record<string, any>,
    id: string,
    type: string,
    relationships?: Record<string, { data: { id: string; type: string } | undefined }> | undefined,
    links?: Record<string, string>,
    included?: Record<string, any>,
    params: FetchOptions<'json'> = {}
  ) => {
    const config = getBaseConfig();
    const formattedBody = formatData(attributes, type, id, relationships, links, included);
    const mergedParams = defu(params, { method: 'PUT', body: formattedBody, ...config }) as FetchOptions<'json'>;
    return ofetch<T>(url, mergedParams);
  };

  /* Función para realizar solicitudes DELETE
  * @param url: string
  * @param params: FetchOptions<'json'> = {}
  * @returns Promise<T>
   */
  const fetchDelete = async <T>(url: string, params: FetchOptions<'json'> = {}) => {
    const config = getBaseConfig();
    const mergedParams = defu(params, { method: 'DELETE', ...config }) as FetchOptions<'json'>;
    return ofetch<T>(url, mergedParams);
  };

  return { fetchGet, fetchPost, fetchPut, fetchDelete };
};
