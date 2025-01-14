<style scoped>
.tabular {
  margin-left: 10px;
}
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

  <v-card>

    <v-card-title>Configurar Menu</v-card-title>

    <v-card-text>

      <lista-opciones :opciones="opcionesMenu"/>

    </v-card-text>

  </v-card>

</template>

<script lang="ts" setup>

import ListaOpciones from '@/views/admin/menuOpciones/components/ListaOpciones.vue';

const opcionesMenu = <[]>useState('menu')

</script>
