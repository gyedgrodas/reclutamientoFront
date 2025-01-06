import type { FetchContext } from 'ofetch'  // Importa el tipo de contexto de la solicitud para el interceptor
import type { ConsolaInstance } from 'consola'
import type {NuxtApp} from "#app";  // Importa el tipo de consola para poder usar logging

// Definir la configuración global de la aplicación de Nuxt
export default defineAppConfig({
  sanctum: {
    interceptors: {
      // Interceptor que se ejecuta antes de que la solicitud sea enviada
      onRequest: async (
        app: NuxtApp,  // Acceso a la instancia de Nuxt
        ctx: FetchContext,  // Contexto de la solicitud HTTP que incluye la configuración de la solicitud
        logger: ConsolaInstance,  // Logger para registrar mensajes de depuración o error
      ) => {
        // Aquí se modifica el encabezado de la solicitud para agregar un encabezado personalizado
        ctx.options.headers.set('Accept', 'application/vnd.api+json')  // Agrega el encabezado 'Accept'
        ctx.options.headers.set('Content-Type', 'application/vnd.api+json')  // Agrega el encabezado 'Content-Type'
        // Mensaje de log para mostrar que el interceptor onRequest ha sido llamado
        logger.debug(`[onRequest] custom interceptor (${ctx.request})`)  // Log de depuración con la solicitud actual
      },
      // Interceptor que se ejecuta cuando se recibe una respuesta de la solicitud
      onResponse: async (
        app: NuxtApp,  // Acceso a la instancia de Nuxt
        ctx: FetchContext,  // Contexto de la respuesta de la solicitud
        logger: ConsolaInstance,  // Logger para registrar mensajes de depuración o error
      ) => {
        if (ctx.response?.status === 401) {
          // Elimina las cookies relacionadas con permisos
          eliminarCookiesPermisos();
        }
        // Mensaje de log para mostrar que el interceptor onResponse ha sido llamado
        logger.debug(`[onResponse] custom interceptor (${ctx.request})`)  // Log de depuración con la solicitud que ha recibido la respuesta
      },
    },
  },
})


// Función para eliminar las cookies relacionadas con permisos
const eliminarCookiesPermisos = () => {
  const cookies = document.cookie.split(';');

  cookies.forEach(cookie => {
    const cookieName = cookie.split('=')[0].trim();
    if (cookieName.includes('userAbilityRules')) {
      document.cookie = `${cookieName}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }
  });
};
