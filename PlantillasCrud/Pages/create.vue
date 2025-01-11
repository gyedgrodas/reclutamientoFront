<script setup lang="ts">

definePageMeta({
  middleware: 'permissions',
  action: 'crear {{ modelPlural }}', // Acción requerida
  subject: '{{ modelPlural }}',  // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
});


import fields from '@/views/pages/{{ modelPlural }}/fields.vue'

import {ref} from "vue";

const { post  } = useClienteRequest();

const { showToastSuccess, showToastError } = useToast();

const requestInProgress = ref(false) // Evitar solicitudes concurrentes
const cargando = ref(false) // Evitar solicitudes concurrentes

const guardar{{ model }} = async ( {{ model }} ) => {

  if (requestInProgress.value)
    return

  requestInProgress.value = true // Establecer bandera de solicitud en progreso
  cargando.value = true // Activar indicador de carga

  try {

    const respuesta = await post('{{ url }}', {{ model }}.value );

    showToastSuccess(respuesta.message);

    navigateTo('/{{ directory }}');

  } catch (error) {

    showToastError(error.message);

  }  finally {
    cargando.value = false // Desactivar indicador de carga
    requestInProgress.value = false // Liberar la bandera
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

  <AppCardActions
    v-model:loading="cargando"
    title="Crear {{ model }}"
    no-actions
  >

    <VCardText>
      <fields :fields="fields"
              @emitirDatos="guardar{{ model }}"
      />

    </VCardText>

  </AppCardActions>


</template>

<style scoped lang="scss">

</style>
