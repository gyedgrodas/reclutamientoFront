<script setup lang="ts">
import Fields from '@/views/pages/reclutamiento/candidatos/fields.vue'
import type { DatosCandidato } from '@/types/reclutamiento'

definePageMeta({ navActiveLink: 'admin-candidatos', middleware: 'permissions', action: 'crear candidatos', subject: 'Candidato' })

const { post } = useClienteRequest()
const { showToastSuccess } = useToast()
const guardando = ref(false)

const guardar = async (datos: DatosCandidato) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await post<{ message: string }>('/api/candidatos', datos)

    showToastSuccess(respuesta.message)
    await navigateTo('/admin/candidatos')
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
        <span class="tt-eyebrow">BANCO DE TALENTO</span>
        <h1 class="tt-page-title">
          Registrar candidato
        </h1>
        <p class="tt-page-subtitle">
          Ingrese la información personal, académica y de contacto para su expediente.
        </p>
      </div>
      <VBtn
        color="secondary"
        variant="tonal"
        prepend-icon="tabler-arrow-left"
        to="/admin/candidatos"
      >
        Volver a candidatos
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
