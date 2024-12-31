import { defu } from 'defu';
import { ofetch, type FetchOptions } from 'ofetch';
import type { Data } from './types';



export const UseApi = () => {
  //Usar el useSanctumClient para hacer la petición
  const client = useSanctumClient();


  // Función para formatear datos según JSON:API
  const formatData = (
    attributes: Record<string, any>,
    type: string,
    id?: string,
    relationships?: Record<string, { data: { id: string; type: string } | undefined }> | undefined,
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


    return formattedData;
  };

  /* Funciones para realizar solicitudes HTTP */
  const fetchGet = async <T>(url: string, params: FetchOptions<'json'> = {}) => {
    const mergedParams = defu(params, { method: 'GET' }) as FetchOptions<'json'>;
    return client<T>(url,mergedParams);
  };

  /* Función para realizar solicitudes POST
  * @param url: string
  * @param attributes: Record<string, any>
  * @param type: string
  * @param relationships?: Record<string, { data: { id: string; type: string } | undefined }> | undefined
  * @param params: FetchOptions<'json'> = {}
  * @returns Promise<T>
  * */
  const fetchPost = async <T>(
    url: string,
    attributes: Record<string, any>,
    type: string,
    relationships?: Record<string, { data: { id: string; type: string } | undefined }> | undefined,
    params: FetchOptions<'json'> = {}
  ) => {
    const formattedBody = formatData(attributes, type, undefined, relationships);
    const mergedParams = defu(params, { method: 'POST', body: formattedBody }) as FetchOptions<'json'>;
    return client<T>(url, mergedParams);
  };

  /* Función para realizar solicitudes PUT
  * @param url: string
  * @param attributes: Record<string, any>
  * @param id: string
  * @param type: string
  * @param relationships?: Record<string, { data: { id: string; type: string } | undefined }> | undefined
  * @param params: FetchOptions<'json'> = {}
  * @returns Promise<T>
  * */
  const fetchPut = async <T>(
    url: string,
    attributes: Record<string, any>,
    id: string,
    type: string,
    relationships?: Record<string, { data: { id: string; type: string } | undefined }> | undefined,
    params: FetchOptions<'json'> = {}
  ) => {
    const formattedBody = formatData(attributes, type, id, relationships);
    const mergedParams = defu(params, { method: 'PUT', body: formattedBody }) as FetchOptions<'json'>;
    return client<T>(url, mergedParams);
  };

  /* Función para realizar solicitudes DELETE
  * @param url: string
  * @param params: FetchOptions<'json'> = {}
  * @returns Promise<T>
   */
  const fetchDelete = async <T>(url: string, params: FetchOptions<'json'> = {}) => {
    const mergedParams = defu(params, { method: 'DELETE'}) as FetchOptions<'json'>;
    return client<T>(url, mergedParams);
  };

  return { fetchGet, fetchPost, fetchPut, fetchDelete };
};
