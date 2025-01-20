export const useClienteRequest = () => {
  const client = useSanctumClient();

  type RequestResponse<T = any> = T;

  type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';
  type Params = Record<string, any>;
  type Body = Record<string, any> | null;

  const request = async <T = any>(url: string, method: HttpMethod, body: Body = null, params: Params = {}): Promise<RequestResponse<T>> => {
    try {

      const queryString = new URLSearchParams(params).toString();
      const fullUrl = queryString ? `${url}?${queryString}` : url;

      const options: RequestInit = { method };

      if (body && method !== 'GET' && method !== 'DELETE') {
        options.body = JSON.stringify(body);
        options.headers = {
          'Content-Type': 'application/json',
        };
      }

      const res = await client(fullUrl, options);

      return res as RequestResponse<T>;

    } catch (e: any) {

      console.error(`Error in ${method} request to ${url}:`, e);

      throw e.response._data;

    }
  };

  return {

    get: <T = any>(url: string, params: Params = {}): Promise<RequestResponse<T>> => request<T>(url, 'GET', null, params),

    post: <T = any>(url: string, body: Body): Promise<RequestResponse<T>> => request<T>(url, 'POST', body),

    put: <T = any>(url: string, body: Body): Promise<RequestResponse<T>> => request<T>(url, 'PUT', body),

    deleted: <T = any>(url: string, params: Params = {}): Promise<RequestResponse<T>> => request<T>(url, 'DELETE', null, params),

  };
};
