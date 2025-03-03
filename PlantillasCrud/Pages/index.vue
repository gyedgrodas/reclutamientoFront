<script setup lang="ts">

import {ref} from "vue";

definePageMeta({
  middleware: 'permissions',
  action: 'listar {{ modelPlural }}', // Acción requerida
  subject: '{{ modelPlural }}',  // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
});

import {can} from "@layouts/plugins/casl";

const {deleted} = useClienteRequest();

const {showToastSuccess, showToastError, preguntaEliminar} = useToast()

const headers = {{ headers }}

const dataTable = ref(null)

const deleteItem = async (id: number) => {

  const confirm = await preguntaEliminar('¿Desea Eliminar {{ model }}?');

  if (!confirm) return;

  try {

    const respuesta = await deleted('{{ url }}/' + id);

    showToastSuccess(respuesta.message);

    dataTable.value?.getItems()

  } catch (error) {

    showToastError(error.message);

  }

}

</script>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <h1 v-text="'Listado de {{ modelPlural }}'"/>
    <VBtn
      v-if="can('crear {{ modelPlural }}', '{{ modelPlural }}')"
      class="ml-auto"
      color="success"
      to="/{{ directory }}/create"
    >
      Nuev@ {{ model }}
    </VBtn>
  </div>

  <DataTableComponent
    ref="dataTable"
    :columnas="headers"
    endpoint="{{ url }}"
    :cantidadPorPagina="10"
    :cantidadPorPaginaOpciones="[10, 20, 30]"
    :botones="['xlsx', 'pdf', 'csv', 'reiniciar']"
  >
    <template #item.Acciones="{ item }">
      <VBtn
        v-if="can('ver {{ modelPlural }}', '{{ modelPlural }}')"
        icon="ri-eye-line"
        variant="tonal"
        color="info"
        :to="'/{{ directory }}/show/' + item.id "
        class="mr-1"
      />
      <VBtn
        v-if="can('editar {{ modelPlural }}', '{{ modelPlural }}')"
        icon="ri-edit-box-line"
        variant="tonal"
        color="warning"
        :to="'/{{ directory }}/edit/' + item.id "
        class="mr-1"
      />
      <VBtn
        v-if="can('eliminar {{ modelPlural }}', '{{ modelPlural }}')"
        icon="ri-delete-bin-line"
        variant="tonal"
        color="error"
        @click="deleteItem(item.id)"
      />

    </template>

  </DataTableComponent>

</template>

<style scoped lang="scss">

</style>
