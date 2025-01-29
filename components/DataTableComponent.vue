<script lang="ts" setup>
import { exportarDataFormatoCSV, exportarDataFormatoPDF, exportarDataFormatoXLSX } from '@/utils/dataTable/exports'

const props = defineProps<DataTableProps>()
const { get } = useClienteRequest()
const { showToastError } = useToast()

interface Columna {
  title: string
  key: string
}

interface DataTableProps {
  endpoint: string
  columnas: Columna[]
  cantidadPorPagina?: number
  cantidadPorPaginaOpciones?: number[]
  botones?: string[]
  titulo?: string
  filtros?: object
  nombreArchivoExport?: string
}

interface PaginatedResponse {
  current_page: number
  data: []
  last_page: number
  per_page: number
  total: number
}

interface QueryParams {
  page: number
  per_page: number
  campoAOrdenar?: string
  ordenCampo?: string
}

const cantidadPorPaginaValorDefault: number[] = [10, 20, 30]

const botonesDefault: string[] = ['xlsx', 'pdf', 'csv', 'reiniciar']

const fecha = new Date()

const {
  columnas,
  endpoint,
  cantidadPorPagina = 10,
  cantidadPorPaginaOpciones = cantidadPorPaginaValorDefault,
  botones = botonesDefault,
  titulo = '',
  nombreArchivoExport = `reporte_data${fecha.getTime()}`,

} = props

const { filtros } = toRefs(props)

const items = ref<[]>([])
const currentPage = ref<number>(1)
const totalItems = ref<number>(0)
const loading = ref<boolean>(false)
const search = ref<string>('')
const itemsbyPage = ref<number>(cantidadPorPagina)
const itemsbyPageOptions = ref<number[]>(cantidadPorPaginaOpciones)

const nombreCampoOrdenar = ref<string>('')
const ordenCampoOrdenar = ref<string>('')

const getItems = async (): Promise<void> => {
  const data: QueryParams = {
    page: currentPage.value,
    per_page: itemsbyPage.value,
  }

  if (ordenCampoOrdenar.value && nombreCampoOrdenar.value) {
    data.campoAOrdenar = nombreCampoOrdenar.value
    data.ordenCampo = ordenCampoOrdenar.value
  }

  if (filtros.value) {
    const key = Object.keys(filtros.value)

    key.forEach(k => {
      data[k] = filtros.value[k]
    })
  }

  try {
    loading.value = true

    const respuesta: { data: PaginatedResponse } = await get(endpoint, data)

    items.value = respuesta.data.data
    totalItems.value = respuesta.data.total
    itemsbyPage.value = respuesta.data.per_page

    // currentPage.value = respuesta.data.current_page;
  }
  catch (error: any) {
    showToastError(error.response?.data?.message || error.message)
  }
  finally {
    loading.value = false
  }
}

// onMounted(getItems);

watch([currentPage, itemsbyPage, filtros], getItems)

const ordenarItems = data => {
  const campo = data?.sortBy[0]?.key
  const orden = data?.sortBy[0]?.order

  nombreCampoOrdenar.value = campo
  ordenCampoOrdenar.value = orden

  getItems()
}

const reiniciar = () => {
  currentPage.value = 1
  itemsbyPage.value = cantidadPorPagina
  ordenCampoOrdenar.value = ''
  nombreCampoOrdenar.value = ''

  getItems()
}
</script>

<template>
  <VCard :title="titulo">
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          md="5"
        >
          <VBtn
            v-if="botones.includes('csv')"
            class="mr-2 mb-3"
            variant="tonal"
            @click="exportarDataFormatoCSV(items, nombreArchivoExport, columnas)"
          >
            <VTooltip
              activator="parent"
              location="top"
              start
            >
              <span>Exportar a CSV</span>
            </VTooltip>
            <VIcon
              icon="tabler-file-type-csv"
              start
            />
            CSV
          </VBtn>

          <VBtn
            v-if="botones.includes('xlsx')"
            class="mr-2 mb-3"
            variant="tonal"
            @click="exportarDataFormatoXLSX(items, nombreArchivoExport, columnas)"
          >
            <VTooltip
              activator="parent"
              location="top"
              start
            >
              <span>Exportar a XLS</span>
            </VTooltip>

            <VIcon icon="tabler-file-type-xls" />
            Excel
          </VBtn>

          <VBtn
            v-if="botones.includes('pdf')"
            class="mr-2 mb-3"
            variant="tonal"
            @click="exportarDataFormatoPDF(items, nombreArchivoExport, columnas)"
          >
            <VTooltip
              activator="parent"
              location="top"
              start
            >
              <span>Exportar a PDF</span>
            </VTooltip>

            <VIcon icon="tabler-file-type-pdf" />
            PDF
          </VBtn>

          <VBtn
            v-if="botones.includes('reiniciar')"
            class="mr-2 mb-3"
            variant="tonal"
            @click="reiniciar"
          >
            <VTooltip
              activator="parent"
              location="top"
              start
            >
              <span>Exportar a PDF</span>
            </VTooltip>

            <VIcon icon="tabler-refresh" />
            Recargar
          </VBtn>
        </VCol>

        <VDataTableServer
          v-model:items-per-page="itemsbyPage"
          v-model:page="currentPage"
          :headers="columnas"
          :items="items"
          :items-length="totalItems"
          :items-per-page-options="itemsbyPageOptions"
          :loading="loading"
          :search="search"
          item-value="id"
          @update:options="ordenarItems"
        >
          <template
            v-for="(slot, name) in $slots"
            :key="name"
            #[name]="slotProps"
          >
            <slot
              :name="name"
              v-bind="slotProps"
            />
          </template>
        </VDataTableServer>
      </VRow>
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
/* Estilos personalizados */
</style>
