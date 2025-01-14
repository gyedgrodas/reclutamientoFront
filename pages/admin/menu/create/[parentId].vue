<script lang="ts" setup>
import Fields from '@/views/admin/menuOpciones/fields.vue';

const route = useRoute();
const parentId = route.params.parentId;

console.log('uuuu');
console.log(parentId);

</script>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      class="ml-auto"
      color="secondary"
      @click="navigateTo('/admin/menu')"
    >
      Regresar
    </VBtn>
  </div>

  <v-card>

    <v-card-title>Crear opcion Hija</v-card-title>

    <v-card-text>

      <fields :parentId="parentId"/>

    </v-card-text>

  </v-card>


</template>
