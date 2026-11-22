<script setup lang="ts">
import Fields from '@/views/pages/reclutamiento/vacantes/fields.vue'
import type { DatosVacante, Vacante } from '@/types/reclutamiento'

definePageMeta({ navActiveLink: 'admin-vacantes', middleware: 'permissions', action: 'editar vacantes', subject: 'Vacante' })

const { get, put } = useClienteRequest()
const { showToastSuccess } = useToast()
const route = useRoute()
const registro = ref<Vacante | null>(null)
const guardando = ref(false)
const cargando = ref(true)

const cargar = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: Vacante }>(`/api/vacantes/${route.params.id}?include=puesto,unidad,solicitante`)

    registro.value = respuesta.data
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargando.value = false
  }
}

const guardar = async (datos: DatosVacante) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await put<{ message: string }>(`/api/vacantes/${route.params.id}`, datos)

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

onMounted(cargar)
</script>

<template>
  <div>
    <header class="tt-page-header">
      <div>
        <span class="tt-eyebrow">EDICIÓN · VACANTE #{{ route.params.id }}</span>
        <h1 class="tt-page-title">
          {{ registro?.puesto?.nombre || 'Editar vacante' }}
        </h1>
        <p class="tt-page-subtitle">
          Actualice las condiciones, plazas, estado o fechas estimadas del proceso.
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
      <VProgressLinear
        v-if="cargando"
        indeterminate
        color="success"
      />
      <Fields
        v-else-if="registro"
        :vacante="registro"
        :guardando="guardando"
        @guardar="guardar"
      />
      <div v-else>
        No fue posible cargar la vacante.
        <VBtn
          variant="text"
          @click="cargar"
        >
          Reintentar
        </VBtn>
      </div>
    </section>
  </div>
</template>

<style scoped>
@import '@/assets/styles/reclutamiento-talent.scss';
</style>
