<script lang="ts" setup>

const {get} = useClienteRequest();
const {showToastError} = useToast();

interface Header {
  text: string;
  value: string;
}

interface DataTableProps {
  endpoint: string;
  headers: Header[];
  cantidadPorPagina?: number;
  cantidadPorPaginaOpciones?: [];
}

interface PaginatedResponse {
  current_page: number;
  data: [];
  last_page: number;
  per_page: number;
  total: number;
}

const props = defineProps<DataTableProps>();

let {headers, endpoint, cantidadPorPagina = 10, cantidadPorPaginaOpciones = [2, 5, 10]} = props;

const items = ref<[]>([]);
const currentPage = ref<number>(1);
const totalItems = ref<number>(0);
const loading = ref<boolean>(false);
const search = ref<string>('');
let itemsbyPage = ref<number>(cantidadPorPagina);
let itemsbyPageOptions = ref<number[]>(cantidadPorPaginaOpciones);

const getItems = async (): Promise<void> => {

  try {
    loading.value = true;

    const respuesta: { data: PaginatedResponse } = await get(endpoint, {
      page: currentPage.value,
      per_page: itemsbyPage.value,
    });

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

onMounted(getItems);

watch([currentPage, itemsbyPage], () => {
  getItems();
});

</script>

<template>
  <VDataTableServer
    v-model:items-per-page="itemsbyPage"
    v-model:page="currentPage"
    :headers="headers"
    :items="items"
    :items-length="totalItems"
    :items-per-page-options="itemsbyPageOptions"
    :loading="loading"
    :search="search"
    item-value="id"
  >

    <template
      v-for="(slot, name) in $slots"
      :key="name"
      v-slot:[name]="slotProps"
    >
      <slot :name="name" v-bind="slotProps"></slot>
    </template>

  </VDataTableServer>

</template>

<style lang="scss" scoped>
/* Estilos personalizados */
</style>
