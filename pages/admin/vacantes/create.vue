<script setup lang="ts">
import Fields from '@/views/pages/reclutamiento/vacantes/fields.vue'
import type { DatosVacante } from '@/types/reclutamiento'

definePageMeta({ navActiveLink: 'admin-vacantes', middleware: 'permissions', action: 'crear vacantes', subject: 'Vacante' })

const { post } = useClienteRequest()
const { showToastSuccess } = useToast()
const guardando = ref(false)

const guardar = async (datos: DatosVacante) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await post<{ message: string }>('/api/vacantes', datos)

    showToastSuccess(respuesta.message)
    await navigateTo('/admin/vacantes')
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
        <span class="tt-eyebrow">OPORTUNIDADES ABIERTAS</span>
        <h1 class="tt-page-title">
          Nueva vacante
        </h1>
        <p class="tt-page-subtitle">
          Defina el puesto, unidad solicitante, plazas y perfil requerido para abrir el proceso.
        </p>
      </div>
      <VBtn
        color="secondary"
        variant="tonal"
        prepend-icon="tabler-arrow-left"
        to="/admin/vacantes"
      >
        Volver a vacantes
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
