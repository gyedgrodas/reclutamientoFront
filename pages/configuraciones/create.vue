<script setup lang="ts">
import { ref } from 'vue'
import type { ConfiguracionInterface } from '@/types/configuraciones'
import Fields from '@/views/pages/configuraciones/fields.vue'

definePageMeta({
  middleware: 'permissions',
  action: 'crear configuraciones', // Acción requerida
  subject: 'configuraciones', // Sujeto requerido (esto puede ser el nombre de un recurso o algo más específico)
})

const { post } = useClienteRequest()

const { showToastSuccess, showToastError } = useToast()

const requestInProgress = ref(false) // Evitar solicitudes concurrentes
const { paginaEspera } = useCargandoPagina()

const guardarConfiguracion = async (Configuracion: ConfiguracionInterface): Promise<void> => {
  if (!requestInProgress.value) {
    if (String(Configuracion.cifrado) === 'Si')
      Configuracion.cifrado = Boolean(true)
    else
      Configuracion.cifrado = Boolean(false)

    requestInProgress.value = true // Establecer bandera de solicitud en progreso
    paginaEspera.value = true // Activar indicador de carga

    try {
      const respuesta: { message: string } = await post('/api/configuracions', Configuracion)

      showToastSuccess(respuesta.message)

      navigateTo('/configuraciones')
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
      to="/configuraciones/"
    >
      Regresar
    </VBtn>
  </div>

  <VCard>
    <VCardItem>
      <VCardTitle>Crear Configuracion</VCardTitle>
    </VCardItem>

    <VCardText>
      <Fields
        :fields="fields"
        @emitir-datos="guardarConfiguracion"
      />
    </VCardText>
  </VCard>
</template>

<style scoped lang="scss">

</style>
