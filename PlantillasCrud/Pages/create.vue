<script setup lang="ts">

import fields from '@/views/pages/{{ model }}/fields.vue'

import {ref} from "vue";

const { post  } = useClienteRequest();

const { showToastSuccess, showToastError } = useToast();

const guardar{{ model }} = async ( {{ model }} ) => {

  try {

    const respuesta = await post('{{ url }}', {{ model }}.value );

    showToastSuccess(respuesta.message);

    navigateTo('/{{ directory }}');

  } catch (error) {

    showToastError(error.message);

  }

}




</script>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      class="ml-auto"
      color="secondary"
      to="/{{ directory }}/"
    >
      Regresar
    </VBtn>
  </div>


  <v-card>

    <v-card-title>Crear {{ model }} </v-card-title>

    <v-card-text>



      <fields :fields="fields"
              @emitirDatos="guardar{{ model }}"
      />


    </v-card-text>

  </v-card>



</template>

<style scoped lang="scss">

</style>
