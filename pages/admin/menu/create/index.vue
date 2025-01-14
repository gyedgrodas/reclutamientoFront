<script lang="ts" setup>

import Fields from '@/views/admin/menuOpciones/fields.vue';
</script>

<template>


  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      class="ml-auto"
      color="secondary"
      to="/admin/menu"
    >
      Regresar
    </VBtn>
  </div>

  <v-card>

    <v-card-title>Crear una nueva Opcion</v-card-title>

    <v-card-text>

      <fields :parentId="null"/>

    </v-card-text>

  </v-card>


</template>
