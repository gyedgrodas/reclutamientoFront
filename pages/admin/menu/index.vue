<style scoped>

</style>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      class="ml-auto"
      color="success"
      to="/admin/menu/create"
    >
      Nueva Opción
    </VBtn>
  </div>

  <VCard>

    <VCardTitle>Configurar Menu</VCardTitle>

    <VCardText>

      <ListaOpciones :opciones="opcionesMenu"/>

    </VCardText>

  </VCard>

</template>

<script lang="ts" setup>

import ListaOpciones from '@/views/admin/menuOpciones/components/ListaOpciones.vue';

const opcionesMenu = <[]>useState('menu')

</script>
