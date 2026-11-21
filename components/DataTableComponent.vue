<script lang="ts" setup>
import type {
  DataTablePropsInterface,
  PaginatedResponseInterface,
  QueryParamsInterface,
  ColumnaInterface,
} from '@/types/sistema/DataTableTypes'
import type { SendResponseInterface } from '@/types/sistema/types';

const props = defineProps<DataTablePropsInterface>()

const { get, post } = useClienteRequest()
const { paginaEspera } = useCargandoPagina()

const cantidadPorPaginaValorDefault: number[] = [10, 20, 30]

const botonesDefault: string[] = ['xlsx', 'pdf', 'csv', 'reiniciar']

const fecha = new Date()

const {
  columnas,
  endpoint,
  cantidadPorPagina = 10,
  cantidadPorPaginaOpciones = cantidadPorPaginaValorDefault,
  botones = botonesDefault,
  relaciones,
  titulo = '',
  nombreArchivoExport = 'reporte_data' + fecha.getTime(),
} = props

const items = ref<[]>([])
const currentPage = ref<number>(1)
const totalItems = ref<number>(0)
const loading = ref<boolean>(false)
const search = ref<string>('')

let itemsbyPage = ref<number>(cantidadPorPagina)
let itemsbyPageOptions = ref<number[]>(cantidadPorPaginaOpciones)

const orden = ref([{ key: columnas[0].key, order: 'asc' }] as const)

const filtrosActivos = computed(() => {
  const filtros: Record<string, any> = {}

  props.columnas.forEach((col: ColumnaInterface) => {
    if (col.OpcionesFiltro && tieneDatos(col.OpcionesFiltro.valor)) {
      const backendKey = col.OpcionesFiltro.campo || col.key
      filtros[backendKey] = col.OpcionesFiltro.valor
    }
  })

  return filtros
})

const getItems = async (): Promise<void> => {

  const sortParam = orden.value.length ? (orden.value[0].order === 'asc' ? orden.value[0].key : `-${orden.value[0].key}`) : ''

  let data: QueryParamsInterface = {
    'page[number]': currentPage.value,
    'page[size]': itemsbyPage.value,
    'sort': sortParam,
    'include': relaciones?.join(','),
  }

  const filtros = filtrosActivos.value
  Object.keys(filtros).forEach(key => {
    data[`filter[${key}]`] = filtros[key]
  })

  if (props.buscador)
    data['filter[search]'] = search.value

  try {
    loading.value = true
    const respuesta = await get<PaginatedResponseInterface>(endpoint, {
      params: {
        ...data,
      },
    })

    if (Array.isArray(respuesta.data)) {
      items.value = []

      return
    }

    items.value = respuesta.data.data
    totalItems.value = respuesta.data.total
  }
  catch (error: any) {
    manejaError(error)
  }
  finally {
    loading.value = false
  }
}

getItems()

watch([currentPage, itemsbyPage], getItems, { deep: true })

const reiniciar = () => {
  currentPage.value = 1
  itemsbyPage.value = cantidadPorPagina
  orden.value = [{ key: columnas[0].key, order: 'asc' }]
  search.value = ''
  getItems()
}

const filtrar = async () => {
  await nextTick()
  if (currentPage.value !== 1)
    currentPage.value = 1
  else
    await getItems()
}

let timeout: number = 0

const obtenerValorAnidado = (obj: any, path: string): string => {
  return path.split('.').reduce((acc, part) => acc && acc[part], obj) || ''
}

const obtenerDatosExport = () => {
  const filtrosProcesados: Record<string, any> = {}

  props.columnas?.forEach(columna => {
    const opciones = columna.OpcionesFiltro

    if (opciones && tieneDatos(opciones.valor)) {
      const dbColumn = opciones.campo || columna.key

      filtrosProcesados[dbColumn] = {
        value: opciones.valor,
        operador: opciones.operador || 'like',
      }
    }
  })

  if (props.buscador && tieneDatos(search.value)) {
    filtrosProcesados['search'] = {
      campo: 'search',
      value: search.value,
      operador: 'scope',
    }
  }

  return {
    model: props.model,
    columns: props.columnas || [],
    filters: filtrosProcesados,
  }
}

const exportarExcel = async () => {
  const datosRequest = obtenerDatosExport()

  paginaEspera.value = true
  try {
    const response = await post<SendResponseInterface<any>>(
      'api/exportar/excel?format=xlsx',
      datosRequest,
      {
        responseType: 'blob',
      },
    )


    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')

    link.href = url

    const nombreArchivo = `Reporte_${new Date().toISOString().slice(0, 10)}.xlsx`

    link.setAttribute('download', nombreArchivo)

    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    paginaEspera.value = false
  }
}

const exportarCSV = async () => {
  const datosRequest = obtenerDatosExport()

  paginaEspera.value = true
  try {
    const response = await post<SendResponseInterface<any>>(
      'api/exportar/excel?format=csv',
      datosRequest,
      {
        responseType: 'blob',
      }
    )

    const blob = new Blob([response.data], { type: 'text/csv;charset=utf-8;' })
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url

    const fecha = new Date().toISOString().slice(0, 10)
    const nombreArchivo = `Reporte_${fecha}.csv`

    link.setAttribute('download', nombreArchivo)
    document.body.appendChild(link)
    link.click()

    link.remove()
    window.URL.revokeObjectURL(url)
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    paginaEspera.value = false
  }
}

const exportarPdf = async () => {
  const datosRequest = obtenerDatosExport()

  paginaEspera.value = true
  try {
    const response = await post<any>('api/exportar/pdf', datosRequest, {
      responseType: 'blob',
    })

    const blob = new Blob([response.data], { type: 'application/pdf' })
    const url = window.URL.createObjectURL(blob)

    const link = document.createElement('a')
    link.href = url

    const fecha = new Date().toISOString().slice(0, 10)
    const nombreArchivo = `Reporte_${fecha}.pdf`

    link.setAttribute('download', nombreArchivo)
    document.body.appendChild(link)
    link.click()

    link.remove()
    window.URL.revokeObjectURL(url)
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    paginaEspera.value = false
  }
}

const columnasVisibles = computed(() => {
  return columnas.filter(col => col.visible !== false)
})

watch(search, () => {
  if (timeout)
    clearTimeout(timeout)
  timeout = setTimeout(() => {
    getItems()
  }, 500)
})

defineExpose({
  getItems,
  filtrar,
  items,
  totalItems,
})
</script>

<template>
  <VCard :title="titulo">
    <VCardText>
      <VRow>
        <VContainer
          fluid
        >
          <VRow justify="end">
            <VBtn
              v-if="botones.includes('reiniciar')"
              class="mr-2 mb-3 mt-3"
              variant="tonal"
              @click="reiniciar"
            >
              <VTooltip
                start
                activator="parent"
                location="top"
              >
                <span>Reiniciar</span>
              </VTooltip>
              <VIcon icon="tabler-refresh"/>
              Recargar
            </VBtn>
            <VMenu v-if="botones.includes('csv') || botones.includes('xlsx') || botones.includes('pdf')">
              <template v-slot:activator="{ props }">
                <VBtn
                  color="primary"
                  v-bind="props"
                  class="mt-3"
                >
                  <VIcon
                    start
                    icon="tabler-table-export"
                  />
                  Exportar
                </VBtn>
              </template>
              <VList
                dense
                class="pa-1 ma-1"
              >
                <VBtn
                  v-if="botones.includes('csv')"
                  class="mb-1"
                  variant="tonal"
                  block
                  @click="exportarCSV"
                >
                  <VIcon
                    start
                    icon="tabler-file-type-csv"
                  />
                  CSV
                </VBtn>

                <VBtn
                  v-if="botones.includes('xlsx')"
                  class="mb-1"
                  variant="tonal"
                  block
                  @click="exportarExcel"
                >
                  <VIcon
                    start
                    icon="tabler-file-type-xls"
                  />
                  Excel
                </VBtn>

                <VBtn
                  v-if="botones.includes('pdf')"
                  class="mb-1"
                  variant="tonal"
                  block
                  @click="exportarPdf"
                >
                  <VIcon
                    start
                    icon="tabler-file-type-pdf"
                  />
                  PDF
                </VBtn>
              </VList>
            </VMenu>
            <AppTextField
              v-if="buscador"
              v-model="search"
              class="v-col-md-3"
              placeholder="Buscador ..."
              append-inner-icon="tabler-search"
              single-line
              hide-details
              dense
              outlined
            />
          </VRow>
        </VContainer>
        <VDataTableServer
          v-model:items-per-page="itemsbyPage"
          v-model:page="currentPage"
          v-model:sort-by="orden"
          :headers="columnasVisibles"
          :items="items"
          :no-data-text="placeholder"
          :items-length="totalItems"
          :items-per-page-options="itemsbyPageOptions"
          :loading="loading"
          :search="search"
          item-value="id"
          @update:sort-by="getItems"
          @update:search="getItems"
        >
          <template
            v-for="(slot, name) in $slots"
            v-slot:[name]="slotProps"
            :key="name"
          >
            <slot :name="name" v-bind="slotProps" />
          </template>
        </VDataTableServer>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
/* Estilos personalizados */
</style>
