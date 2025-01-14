<script lang="ts" setup>

import Fields from '@/views/admin/menuOpciones/fields.vue';

const route = useRoute<{ parentId: number }>();

const parentId = <number>route.params.parentId;

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

  <VCard>

    <VCardTitle>Crear opcion Hija</VCardTitle>

    <VCardText>

      <Fields :item="null"
              :parentId="parentId"
      />

    </VCardText>

  </VCard>


</template>
