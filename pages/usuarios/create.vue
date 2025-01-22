<script setup lang="ts">
import fields from '@/views/pages/usuarios/fields.vue'

definePageMeta({
  middleware: 'permissions',
  action: 'crear usuarios', // Acción requerida
  subject: 'usuarios', // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
})

// eslint-disable-next-line import/extensions
import type { UsuarioInterface } from '@/types/usuarios/index.ts'

import { ref } from 'vue'

const { post } = useClienteRequest()

const { showToastSuccess, showToastError } = useToast();

const requestInProgress = ref(false) // Evitar solicitudes concurrentes
const { paginaEspera } = useCargandoPagina();


const guardarUsuario = async (Usuario: UsuarioInterface): Promise<void> => {
  if (!requestInProgress.value) {
    requestInProgress.value = true // Establecer bandera de solicitud en progreso
    paginaEspera.value = true // Activar indicador de carga

    try {
      const respuesta: { message: string } = await post('/api/users', Usuario );



      showToastSuccess(respuesta.message)

      navigateTo('/usuarios')
    }
    catch (error: any) {
      showToastError(error.message)
    }
    finally {
      paginaEspera.value = false // Desactivar indicador de carga
      requestInProgress.value = false // Liberar la bandera

    }
  }
}
</script>

<template>
<div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">

    <VBtn
      class="ml-auto"
      color="secondary"
      to="/usuarios/"
    >
      Regresar
    </VBtn>

  </div>

  <VCard>


    <VCardItem>

      <VCardTitle>Crear Usuario</VCardTitle>

    </VCardItem>
    <VCardText>

      <fields :fields="fields"
              @emitirDatos="guardarUsuario"
      />

    </VCardText>

  </VCard>

</template>

<style scoped lang="scss">

</style>
