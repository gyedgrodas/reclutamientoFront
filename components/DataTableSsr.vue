<script lang="ts" setup>

import {toRefs} from 'vue';

const {get} = useClienteRequest();

const {showToastError} = useToast();

interface DataTableProps {
  endpoint: string;
  headers: [{ text: string; value: string }];
}

const props = defineProps<DataTableProps>();

//Props reactivos
const {endpoint} = toRefs(props);

//Props no reactivos
const {headers} = props;

const items = ref([]);
const currentPage = ref(1);
const itemsPerPage = ref(5);
const totalItems = ref(0);
const loading = ref(false);
const search = ref('');

const getItems = async () => {

  try {
    loading.value = true;

    const res = await get(endpoint.value, {
      'page[number]': currentPage.value,
      'page[size]': itemsPerPage.value,
    });

    items.value = res.data.data; // Aquí deberías obtener la lista de usuarios
    totalItems.value = res.data?.meta.total; // Total de registros en el backend
    itemsPerPage.value = res.data?.meta.per_page; // Elementos por página
    currentPage.value = res.data?.meta.current_page // Página actual

  } catch (error) {

    showToastError(error.message);

  } finally {

    loading.value = false;

  }

};

onMounted(getItems);

</script>


<template>
  <VDataTableServer
      v-model:items-per-page="itemsPerPage"
      v-model:page="currentPage"
      :headers="headers"
      :items="items"
      :items-length="totalItems"
      :items-per-page-options="[2, 5, 10, 50, -1]"
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
