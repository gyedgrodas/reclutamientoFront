<script lang="ts" setup>
import formulario from './Form.vue';

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

      <v-card-title>Crear una nueva Opcion</v-card-title>

      <v-card-text>

        <formulario :parentId="null"/>

      </v-card-text>

    </v-card>


</template>
