<style scoped>

</style>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 ">

    <p class="text-2xl">
      Administrar Menu
    </p>

    <VBtn
      class="ml-auto"
      color="success"
      to="/admin/menu/create"
    >
      Nueva Opción
    </VBtn>
  </div>

  <VCard>

    <VCardText>

      <ListaOpciones :opciones="opcionesMenu"
                     @ItemsActualizadas="actualizarOpciones"
      />

    </VCardText>

  </VCard>

</template>

<script lang="ts" setup>

import ListaOpciones from '@/views/admin/menuOpciones/components/ListaOpciones.vue';

const opcionesMenu = <[]>useState('menu');

const actualizarOpciones = (opciones) => {

  console.log("Opciones actualizadas:", opciones);

}

</script>
