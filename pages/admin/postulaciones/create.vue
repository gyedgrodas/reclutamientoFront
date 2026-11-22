<script setup lang="ts">
import Fields from '@/views/pages/reclutamiento/postulaciones/fields.vue'
import type { DatosPostulacion } from '@/types/reclutamiento'

definePageMeta({
  navActiveLink: 'admin-postulaciones',
  middleware: 'permissions',
  action: 'crear postulaciones',
  subject: 'Postulacion',
})

const { post } = useClienteRequest()
const { showToastSuccess } = useToast()
const guardando = ref(false)

const guardar = async (datos: DatosPostulacion) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await post<{ message: string }>('/api/postulaciones', datos)
    showToastSuccess(respuesta.message)
    await navigateTo('/admin/postulaciones')
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    guardando.value = false
  }
}
</script>

<template>
  <div>
    <header class="tt-page-header">
      <div>
        <span class="tt-eyebrow">NUEVO PROCESO</span>
        <h1 class="tt-page-title">
          Registrar postulación
        </h1>
        <p class="tt-page-subtitle">
          Vincule un candidato a una vacante activa para iniciar su seguimiento por etapas.
        </p>
      </div>
      <VBtn
        color="secondary"
        variant="tonal"
        prepend-icon="tabler-arrow-left"
        to="/admin/postulaciones"
      >
        Volver al tablero
      </VBtn>
    </header>

    <section class="tt-panel pa-6">
      <Fields
        :guardando="guardando"
        @guardar="guardar"
      />
    </section>
  </div>
</template>

<style scoped>
@import '@/assets/styles/reclutamiento-talent.scss';
</style>
