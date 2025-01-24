<script lang="ts" setup>

import DataTableComponent from "@/components/DataTableComponent.vue";

const {showToastInfo, showToastSuccess, showToastWarning, showToastError} = useToast();
const {paginaEspera, cargandoPagina} = useCargandoPagina();

const mostrarToastInfo = () => {
  showToastInfo('Hello from second page');
};
const mostrarToastSuccess = () => {
  showToastSuccess('Hello from second page');
};
const mostrarToastWarning = () => {
  showToastWarning('Hello from second page');
};
const mostrarToastError = () => {
  showToastError('Hello from second page');
};

const activarPaginaEspera = () => {
  paginaEspera.value = true; // Activar la pagina de espera

  setTimeout(() => {
    paginaEspera.value = false; // Desactivar la pagina de espera
  }, 1500);
};

const activarPaginaCargando = () => {
  cargandoPagina.value = true; // Activar la página cargando
  setTimeout(() => {
    cargandoPagina.value = false; // Desactivar la página cargando
  }, 1500);
};

const headers = [
  {title: 'ID', key: 'id', sortable: true, exportable: true},
  {title: 'titulo', key: 'titulo', sortable: false,},
  {title: 'titulo Seccion', key: 'titulo_seccion', exportable: false},
  {title: 'Acciones', key: 'Acciones'},
];

</script>

<template>

  <VCard class="mb-5">
    <VCardTitle>Toast</VCardTitle>
    <VCardText class="d-flex justify-space-between v-col-sm-10 offset-1">
      <VBtn border="border"
            @click="mostrarToastSuccess">
        Mostrar Toast Success
      </VBtn>

      <VBtn color="error"
            @click="mostrarToastError">
        Mostrar Toast Error
      </VBtn>


      <VBtn color="warning"
            @click="mostrarToastWarning"
      >
        Mostrar Toast Warning
      </VBtn>

      <VBtn color="info"
            @click="mostrarToastInfo"
      >
        Mostrar Toast Info
      </VBtn>
    </VCardText>
  </VCard>

  <VCard class="mb-5">
    <VCardTitle>Página Cargando</VCardTitle>
    <VCardText class="d-flex justify-space-between v-col-sm-5 offset-3">

      <VBtn color="info"
            @click="activarPaginaEspera">
        Pagina Espera
      </VBtn>

      <VBtn color="warning"
            @click="activarPaginaCargando"
      >
        Pagina Cargando
      </VBtn>

    </VCardText>
  </VCard>

  <VCard class="mb-5">
    <VCardTitle>Buscador General</VCardTitle>
    <VCardText>
      <selector-buscador
        Endpoint="/api/asociados/buscar/select2/"
        placeholder="Ingrese el nombre del asociado "
        requerido
        title="Buscar Asociado"
      ></selector-buscador>
    </VCardText>
  </VCard>

  <VCard class="mb-5">

    <VCardTitle>Componente DataTable</VCardTitle>

    <VCardText>

      <DataTableComponent
        :cantidadPorPagina="3"
        :cantidadPorPaginaOpciones="[10,20,30]"
        :headers="headers"
        endpoint="/api/menu_opciones"
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

    </VCardText>

  </VCard>

</template>

<style lang="scss" scoped>

</style>
