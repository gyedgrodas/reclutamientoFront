<template>

  <VCard class="mb-5"
         title="filtros"
  >
    <VCardText>
      <VRow>

        <VCol
          class="mb-3"
          cols="12"
          md="5"
        >
          <VTextField
            v-model="titulo"
            label="Filtro"
            outlined
            placeholder="Buscar..."
          />
        </VCol>

        <VCol
          class="mb-3"
          cols="12"
          md="5"
        >
          <VTextField
            v-model="titulo_seccion"
            label="titulo_seccion"
            outlined
            placeholder="Buscar..."
          />
        </VCol>

        <VCol
          class="mb-3"
          cols="12"
          md="5"
        >
          <VBtn
            color="primary"
            @click="buscar"
          >
            Buscar
          </VBtn>
        </VCol>

      </VRow>
    </VCardText>
  </VCard>


  <DataTableComponent
    :botones="['csv', 'xlsx', 'pdf', 'reiniciar']"
    :cantidadPorPagina="3"
    :cantidadPorPaginaOpciones="[2,3,5]"
    :columnas="columnas"
    :filtros="filtros"
    endpoint="/api/menu_opciones"
    titulo="Ejemplo de DataTable"
  >

    <template #item.Acciones="{ item }">

      <VBtn
        color="primary"
        icon
        variant="text"
      >
        <VIcon icon="tabler-eye"/>
      </VBtn>

      <VBtn
        color="primary"
        icon
        variant="text"
      >
        <VIcon icon="tabler-edit"/>
      </VBtn>

      <VBtn
        color="error"
        icon
        variant="text"
      >
        <VIcon icon="tabler-trash"/>
      </VBtn>


    </template>

  </DataTableComponent>
</template>

<script lang="ts" setup>

import {ref} from 'vue';

const columnas = [
  {title: 'ID', key: 'id', sortable: true, exportable: true},
  {title: 'titulo', key: 'titulo', sortable: false,},
  {title: 'titulo Seccion', key: 'titulo_seccion', exportable: true},
  {title: 'Acciones', key: 'Acciones'},
];

const filtros = ref({});

const buscar = () => {

  filtros.value = {
    titulo: titulo.value ?? '',
    titulo_seccion: titulo_seccion.value ?? '',
  }

};

const titulo = ref('');
const titulo_seccion = ref('');


</script>
