<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import Fields from '@/views/pages/reclutamiento/postulaciones/fields.vue'
import HistorialPostulacion from '@/views/pages/reclutamiento/postulaciones/HistorialPostulacion.vue'
import type { DatosPostulacion, Postulacion } from '@/types/reclutamiento'
import { nombreCompletoPersona } from '@/utils/reclutamientoUx'

definePageMeta({
  navActiveLink: 'admin-postulaciones',
  middleware: 'permissions',
  action: 'editar postulaciones',
  subject: 'Postulacion',
})

const { get, put } = useClienteRequest()
const { showToastSuccess } = useToast()
const route = useRoute()

const registro = ref<Postulacion | null>(null)
const cargando = ref(true)
const guardando = ref(false)

const cargar = async () => {
  cargando.value = true
  try {
    const resp = await get<{ data: Postulacion }>(
      `/api/postulaciones/${route.params.id}?include=candidato,vacante.puesto,vacante.unidad,etapaReclutamiento,responsable`,
    )
    registro.value = resp.data
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargando.value = false
  }
}

const guardar = async (datos: DatosPostulacion) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const resp = await put<{ message: string }>(`/api/postulaciones/${route.params.id}`, datos)
    showToastSuccess(resp.message)
    await navigateTo('/admin/postulaciones')
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
        <span class="tt-eyebrow">SEGUIMIENTO · POSTULACIÓN #{{ route.params.id }}</span>
        <h1 class="tt-page-title">
          {{ registro ? nombreCompletoPersona(registro.candidato) : 'Editar postulación' }}
        </h1>
        <p class="tt-page-subtitle">
          {{ registro?.vacante?.puesto?.nombre ? `Proceso para ${registro.vacante.puesto.nombre}` : 'Actualice etapa, responsable, estado y observaciones del proceso.' }}
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
      <VProgressLinear
        v-if="cargando"
        indeterminate
        color="success"
      />
      <template v-else-if="registro">
        <Fields
          :postulacion="registro"
          :guardando="guardando"
          @guardar="guardar"
        />

        <VDivider class="my-6" />

        <HistorialPostulacion
          v-if="can('ver postulaciones', 'Postulacion')"
          :postulacion-id="registro.id"
        />
      </template>
      <div
        v-else
        class="text-medium-emphasis"
      >
        No fue posible cargar la postulación.
      </div>
    </section>
  </div>
</template>

<style scoped>
@import '@/assets/styles/reclutamiento-talent.scss';
</style>
