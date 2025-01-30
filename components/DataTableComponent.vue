<script lang="ts" setup>

import {exportarDataFormatoCSV, exportarDataFormatoPDF, exportarDataFormatoXLSX} from "@/utils/dataTable/exports";
import {object} from "@ucast/core";

const {get} = useClienteRequest();
const {showToastError} = useToast();

interface Columna {
  title: string;
  key: string;
}

interface DataTableProps {
  endpoint: string;
  columnas: Columna[];
  cantidadPorPagina?: number;
  cantidadPorPaginaOpciones?: number[];
  botones?: string[];
  titulo?: string;
  filtros?: object;
  nombreArchivoExport?: string;
}

interface PaginatedResponse {
  current_page: number;
  data: [];
  last_page: number;
  per_page: number;
  total: number;
}

interface QueryParams {
  page: number;
  per_page: number;
  campoAOrdenar?: string;
  ordenCampo?: string;
}

const props = defineProps<DataTableProps>();

const cantidadPorPaginaValorDefault: number[] = [10, 20, 30];

const botonesDefault: string[] = ['xlsx', 'pdf', 'csv', 'reiniciar'];

const fecha = new Date();

let {
  columnas,
  endpoint,
  cantidadPorPagina = 10,
  cantidadPorPaginaOpciones = cantidadPorPaginaValorDefault,
  botones = botonesDefault,
  titulo = '',
  nombreArchivoExport = 'reporte_data' + fecha.getTime(),

} = props;

let {filtros} = toRefs(props);

const items = ref<[]>([]);
const currentPage = ref<number>(1);
const totalItems = ref<number>(0);
const loading = ref<boolean>(false);
const search = ref<string>('');
let itemsbyPage = ref<number>(cantidadPorPagina);
let itemsbyPageOptions = ref<number[]>(cantidadPorPaginaOpciones);

const nombreCampoOrdenar = ref<string>('');
const ordenCampoOrdenar = ref<string>('');


const orden = ref([{ key: columnas[0].key, order: 'asc' }] as const)

const getItems = async (): Promise<void> => {

  const sortParam = orden.value.length ? (orden.value[0].order === 'asc' ? orden.value[0].key : `-${orden.value[0].key}`) : ''

  let data = {
    'page[number]': currentPage.value,
    'page[size]': itemsbyPage.value,
    'sort': sortParam,
  };

  if (filtros.value) {
    let key = Object.keys(filtros.value);

    for (let i = 0; i < key.length; i++) {
      console.log('key[i]', key[i]);
      data[`filter[${key[i]}]`] = filtros.value[key[i]];
    }

  }

  try {

    loading.value = true;

    const respuesta = await get(endpoint, data)

    items.value = respuesta.data.data;
    totalItems.value = respuesta.data.meta.total;

  } catch (error: any) {

    showToastError(error.response?.data?.message || error.message);

  } finally {

    loading.value = false;

  }
};
getItems();

watch([currentPage, itemsbyPage, filtros], getItems);

const reiniciar = () => {

  currentPage.value = 1;
  itemsbyPage.value = cantidadPorPagina;
  ordenCampoOrdenar.value = '';
  nombreCampoOrdenar.value = '';

  getItems();

};

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

            <VIcon
              icon="tabler-file-type-xls"
            />
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

            <VIcon
              icon="tabler-file-type-pdf"
              
            />
            Pdf
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

            <VIcon
              icon="tabler-refresh"
            />
            Recargar
          </VBtn>

        </VCol>

        <VDataTableServer
          v-model:items-per-page="itemsbyPage"
          v-model:page="currentPage"
          :headers="columnas"
          :items="items"
          v-model:sort-by="orden"
          :items-length="totalItems"
          :items-per-page-options="itemsbyPageOptions"
          :loading="loading"
          :search="search"
          item-value="id"
          @update:sort-by="getItems"
          @update:search="getItems"
        >

          <template
            v-for="(slot,name) in $slots"
            :key="name"
            v-slot:[name]="slotProps"
          >
            <slot :name="name" v-bind="slotProps"></slot>
          </template>

        </VDataTableServer>

      </VRow>

    </VCardText>

  </VCard>

</template>

<style lang="scss" scoped>
/* Estilos personalizados */
</style>
