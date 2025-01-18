<script lang="ts" setup>
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


</script>

<template>

  <VCard class="mb-3">
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

  <VCard>
    <VCardTitle>Pagina Cargando</VCardTitle>
    <VCardText class="d-flex justify-space-between v-col-sm-5 offset-3">

      <VBtn border="border"
            @click="activarPaginaEspera">
        Pagina Espera
      </VBtn>

      <VBtn color="error"
            @click="activarPaginaCargando">
        Pagina Cargando
      </VBtn>

    </VCardText>
  </VCard>

</template>

<style lang="scss" scoped>

</style>
