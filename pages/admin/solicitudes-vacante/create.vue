<script setup lang="ts">
import SolicitudVacanteForm from '@/views/pages/reclutamiento/solicitudes-vacante/SolicitudVacanteForm.vue'
import type { DatosSolicitudVacante, SolicitudVacante } from '@/types/reclutamiento'

definePageMeta({
  navActiveLink: 'admin-solicitudes-vacante',
  middleware: 'permissions',
  action: 'crear solicitudes vacante',
  subject: 'SolicitudVacante',
})

const { post } = useClienteRequest()
const { showToastSuccess } = useToast()

const guardando = ref(false)
const errorEnvio = ref<string | null>(null)

const guardar = async (datos: DatosSolicitudVacante) => {
  if (guardando.value)
    return

  guardando.value = true
  errorEnvio.value = null
  try {
    const respuesta = await post<{ data: SolicitudVacante; message: string }>(
      '/api/solicitudes-vacante',
      datos,
    )

    showToastSuccess(respuesta.message || 'Solicitud de vacante creada con éxito.')

    if (respuesta?.data?.id)
      await navigateTo(`/admin/solicitudes-vacante/show/${respuesta.data.id}`)
    else
      await navigateTo('/admin/solicitudes-vacante')
  }
  catch (error: any) {
    errorEnvio.value = error?.response?.data?.message || 'No fue posible registrar la solicitud de vacante.'
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
        <span class="tt-eyebrow">REQUERIMIENTOS DE PERSONAL</span>
        <h1 class="tt-page-title">
          Nueva solicitud de vacante
        </h1>
        <p class="tt-page-subtitle">
          Formalice el requerimiento de plazas de su área para enviarlo a revisión y aprobación gerencial.
        </p>
      </div>
      <VBtn
        color="secondary"
        variant="tonal"
        prepend-icon="tabler-arrow-left"
        to="/admin/solicitudes-vacante"
      >
        Volver a solicitudes
      </VBtn>
    </header>

    <VAlert
      v-if="errorEnvio"
      type="error"
      variant="tonal"
      class="mb-4"
    >
      {{ errorEnvio }}
    </VAlert>

    <section class="tt-panel pa-6">
      <SolicitudVacanteForm
        :guardando="guardando"
        @guardar="guardar"
      />
    </section>
  </div>
</template>

<style scoped>
@import "@styles/reclutamiento-talent.scss";
</style>
