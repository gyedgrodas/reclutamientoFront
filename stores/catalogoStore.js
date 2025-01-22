import { defineStore } from 'pinia'
import { useClienteRequest } from '~/composables/useClienteRequest'

export const useCatalogStore = defineStore('catalog', {
  state: () => ({
    catalogos: {}, // Aquí se almacenan los catálogos
    loaded: false, // Indica si los catálogos ya se cargaron
  }),
  actions: {
    async fetchCatalogs(catalogNames) {
      const { get } = useClienteRequest()

      // Filtrar los catálogos que no están en el estado
      const uncachedCatalogs = catalogNames.filter(name => !this.catalogos[name])

      // Si todos los catálogos están en el estado, no es necesario hacer solicitudes
      if (uncachedCatalogs.length === 0) {
        console.log('Todos los catálogos ya están en el estado')

        return { catalogos: this.catalogos, errors: [] }
      }

      console.log('Solicitando catálogos:', uncachedCatalogs)
      // Hacer las solicitudes para los catálogos faltantes
      const promises = uncachedCatalogs.map(name =>
        get(`/api/catalogo/${name}`)
          .then(response => ({
            name,
            data: response.data, // Asegúrate de desestructurar el contenido de `data`
            error: null,
          }))
          .catch(error => ({
            name,
            data: null,
            error,
          })),
      )

      const results = await Promise.all(promises)

      // Actualizar el estado con los resultados exitosos
      results.forEach(result => {
        if (!result.error)
          this.catalogos[result.name] = result.data // Guarda los datos directamente
      })

      return {
        catalogos: this.catalogos,
        errors: results.filter(result => result.error),
      }
    },
  },
})
