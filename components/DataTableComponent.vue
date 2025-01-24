<script lang="ts" setup>

import {exportarDataFormatoCSV, exportarDataFormatoPDF, exportarDataFormatoXLSX} from "@/utils/dataTable/exports";

const {get} = useClienteRequest();
const {showToastError} = useToast();

interface Header {
  title: string;
  key: string;
}

interface DataTableProps {
  endpoint: string;
  headers: Header[];
  cantidadPorPagina?: number;
  cantidadPorPaginaOpciones?: number[];
}

interface PaginatedResponse {
  current_page: number;
  data: [];
  last_page: number;
  per_page: number;
  total: number;
}

const props = defineProps<DataTableProps>();

const cantidadPorPaginaValorDefault: number[] = [10, 20, 30];

let {headers, endpoint, cantidadPorPagina = 10, cantidadPorPaginaOpciones = cantidadPorPaginaValorDefault} = props;

const items = ref<[]>([]);
const currentPage = ref<number>(1);
const totalItems = ref<number>(0);
const loading = ref<boolean>(false);
const search = ref<string>('');
let itemsbyPage = ref<number>(cantidadPorPagina);
let itemsbyPageOptions = ref<number[]>(cantidadPorPaginaOpciones);

const nombreCampoOrdenar = ref<string>('');
const ordenCampoOrdenar = ref<string>('');

const getItems = async (): Promise<void> => {

  let data = {
    page: currentPage.value,
    per_page: itemsbyPage.value,
  };

  if (ordenCampoOrdenar.value && nombreCampoOrdenar.value) {
    data.campoAOrdenar = nombreCampoOrdenar.value;
    data.ordenCampo = ordenCampoOrdenar.value;
  }

  try {
    loading.value = true;

    const respuesta: { data: PaginatedResponse } = await get(endpoint, data);

    items.value = respuesta.data.data;
    totalItems.value = respuesta.data.total;
    itemsbyPage.value = respuesta.data.per_page;
    currentPage.value = respuesta.data.current_page;

  } catch (error: any) {

    showToastError(error.response?.data?.message || error.message);

  } finally {

    loading.value = false;

  }
};

// onMounted(getItems);

watch([currentPage, itemsbyPage], getItems);

const ordenarItems = (data) => {

  let campo = data?.sortBy[0]?.key;
  let orden = data?.sortBy[0]?.order;

  nombreCampoOrdenar.value = campo;
  ordenCampoOrdenar.value = orden;

  getItems();

};

</script>

<template>

  <VCard>

    <VCardText>

      <VRow>

        <VCol
          cols="12"
          md="4"
        >

          <VBtn
            class="mr-2"

            @click="exportarDataFormatoCSV(items, 'NuevoNombre')"
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
            class="mr-2"
            @click="exportarDataFormatoXLSX(items, 'NuevoNombre')"
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
            @click="exportarDataFormatoPDF(items, 'NuevoNombre')"
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

        </VCol>

        <VDataTable
          v-model:items-per-page="itemsbyPage"
          v-model:page="currentPage"
          :headers="headers"
          :items="items"
          :items-length="totalItems"
          :items-per-page-options="itemsbyPageOptions"
          :loading="loading"
          :search="search"
          item-value="id"
          @update:options="ordenarItems"
        >

          <template
            v-for="(slot,name) in $slots"
            :key="name"
            v-slot:[name]="slotProps"
          >
            <slot :name="name" v-bind="slotProps"></slot>
          </template>

        </VDataTable>

      </VRow>

    </VCardText>

  </VCard>

</template>

<style lang="scss" scoped>
/* Estilos personalizados */
</style>
