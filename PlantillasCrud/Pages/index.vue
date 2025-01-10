<script setup lang="ts">

import {ref} from "vue";

const { Get, Delete  } = useJsonApiClient();

const { showToastSuccess, showToastError } = useToast()

const headers =  {{ headers }}

const items = ref([])

const getItems = async (): Promise<object> => {

  try {

    const respuesta = await Get('{{ url }}');

    items.value = respuesta.data.data;

  } catch (error) {

    console.error(error.meesage);

  }

}

getItems();

const currentPage = ref(1) // Página actual
const itemsPerPage = ref(2) // Elementos por página
const totalItems = ref(0) // Total de elementos en el backend
const loading = ref(false) // Indicador de carga
const search = ref('') // Búsqueda de usuarios

const deleteItem = async (id: number) => {

    try {

      const respuesta = await Delete('{{ url }}/' + id);

      showToastSuccess(respuesta.data.message);

      await getItems();

    } catch (error) {

      showToastError(error.message);

    }

}

</script>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      class="ml-auto"
      color="success"
      to=" {{ directory }}/create "
    >
      Nuev@ {{ model }}
    </VBtn>
  </div>


  <v-card>

    <v-card-title> {{ model }} </v-card-title>

    <v-card-text>

      <VDataTableServer
        v-model:items-per-page="itemsPerPage"
        v-model:page="currentPage"
        :items="items"
        :headers="headers"
        :search="search"
        item-value="id"
        :items-length="totalItems"
        :items-per-page-options="[2, 5, 10, 50, -1]"
        :loading="loading"
      >
        <template #item.actions="{ item }">
          <VBtn
            icon
            variant="text"
            color="primary"
            :to=" '{{ directory }}/edit/' + item.id "
          >
            <VIcon icon="tabler-edit" />
          </VBtn>
          <VBtn
            icon
            color="error"
            variant="text"
            @click="deleteItem(item.id)"
          >
            <VIcon icon="tabler-trash" />
          </VBtn>
        </template>
      </VDataTableServer>


    </v-card-text>

  </v-card>



</template>

<style scoped lang="scss">

</style>
