<script lang="ts" setup>

const {get} = useClienteRequest();
const {showToastError} = useToast();

interface DataTableProps {
  endpoint: string;
  headers: [{ text: string; value: string }];
}

const props = defineProps<DataTableProps>();

// const {endpoint} = toRefs(props);

const {headers, endpoint} = props;

const items = ref([]);
const currentPage = ref(1);
const itemsPerPage = ref(2);
const totalItems = ref(0);
const loading = ref(false);
const search = ref('');

const getItems = async () => {
  try {
    loading.value = true;

    const res = await get(endpoint, {
      page: currentPage.value,
      per_page: itemsPerPage.value,
    });

    items.value = res.data.data;
    totalItems.value = res.data?.total;
    itemsPerPage.value = res.data?.per_page;
    currentPage.value = res.data?.current_page;

  } catch (error) {
    showToastError(error.response?.data?.message || error.message);
  } finally {
    loading.value = false;
  }
};

onMounted(getItems);

watch([currentPage, itemsPerPage], () => {

  console.log('currentPage:', currentPage.value);
  getItems()
})

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
