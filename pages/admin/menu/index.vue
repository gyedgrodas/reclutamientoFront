<style scoped>
.tabular{
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

      <options-item :opciones="opcionesMenu" />

    </v-card-text>

  </v-card>

</template>

<script setup lang="ts">

import OptionsItem from '@/pages/admin/menu/opciones/ListaOpciones.vue';

const opcionesMenu = <[]>useState('menu')

</script>
