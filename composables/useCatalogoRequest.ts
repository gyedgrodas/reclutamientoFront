import { useCatalogStore } from '~/stores/catalogoStore'

export const useCatalogo = () => {
  const catalogoStore = useCatalogStore()

  const getCatalogos = async nombreCatalogo => {
    try {
      const { catalogos, errors } = await catalogoStore.fetchCatalogs(nombreCatalogo)

      if (errors.length)
        throw new Error(`Error al cargar catálogos: ${errors.map(e => e.name).join(', ')}`)

      catalogoStore.loaded = true

      return catalogos
    }
    catch (error) {
      console.error('Error al obtener catálogos:', error)
      throw error // Lanza el error para manejarlo en el componente
    }

    return nombreCatalogo.reduce((acc, name) => {
      acc[name] = catalogoStore.catalogos[name] || null

      return acc
    }, {})
  }

  return {
    getCatalogos,
    catalogos: catalogoStore.catalogos,
  }
}
