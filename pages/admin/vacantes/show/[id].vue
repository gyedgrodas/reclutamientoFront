<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type { Vacante } from '@/types/reclutamiento'
import { nombreCompletoPersona } from '@/utils/reclutamientoUx'

definePageMeta({ navActiveLink: 'admin-vacantes', middleware: 'permissions', action: 'ver vacantes', subject: 'Vacante' })

const { get } = useClienteRequest()
const route = useRoute()
const registro = ref<Vacante | null>(null)
const cargando = ref(true)

const coloresEstado: Record<string, string> = {
  'Abierta': 'success',
  'En Proceso': 'warning',
  'Cubierta': 'info',
  'Cancelada': 'secondary',
}

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

onMounted(cargar)
</script>

<template>
  <div>
    <header class="tt-page-header">
      <div>
        <span class="tt-eyebrow">OPORTUNIDAD LABORAL · #{{ route.params.id }}</span>
        <h1 class="tt-page-title">
          {{ registro?.puesto?.nombre || 'Detalle de la vacante' }}
        </h1>
        <p class="tt-page-subtitle">
          {{ registro?.unidad?.nombre || 'Consulte el perfil requerido, fechas clave y candidatos vinculados.' }}
        </p>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <VBtn
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-arrow-left"
          to="/admin/vacantes"
        >
          Regresar
        </VBtn>
        <VBtn
          v-if="registro && can('ver postulaciones', 'Postulacion')"
          color="secondary"
          variant="outlined"
          prepend-icon="tabler-layout-kanban"
          :to="`/admin/postulaciones?vacante_id=${registro.id}`"
        >
          Ver postulaciones ({{ registro.postulaciones_count ?? 0 }})
        </VBtn>
        <VBtn
          v-if="registro && can('crear postulaciones', 'Postulacion') && (registro.estado === 'Abierta' || registro.estado === 'En Proceso')"
          color="success"
          prepend-icon="tabler-user-plus"
          :to="`/admin/postulaciones/create?vacante_id=${registro.id}`"
        >
          Vincular candidato
        </VBtn>
        <VBtn
          v-if="registro && can('editar vacantes', 'Vacante')"
          color="primary"
          variant="tonal"
          prepend-icon="tabler-edit"
          :to="`/admin/vacantes/edit/${registro.id}`"
        >
          Editar
        </VBtn>
      </div>
    </header>

    <VProgressLinear
      v-if="cargando"
      indeterminate
      color="success"
      rounded
      class="mb-4"
    />

    <VRow v-else-if="registro">
      <VCol
        cols="12"
        md="8"
      >
        <section class="tt-panel pa-6 h-100">
          <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-4">
            <div>
              <span class="tt-eyebrow">PERFIL DEL PUESTO</span>
              <h2 class="text-h6 font-weight-bold mb-0">
                Descripción y requisitos
              </h2>
            </div>
            <VChip
              :color="coloresEstado[registro.estado] || 'secondary'"
              variant="tonal"
              size="small"
              class="font-weight-bold"
            >
              {{ registro.estado }}
            </VChip>
          </div>

          <div class="tt-detail-box mb-4">
            <span>Descripción del puesto</span>
            <p class="text-body-2 mt-2 mb-0 pre-line">
              {{ registro.descripcion || 'Sin descripción registrada para esta vacante.' }}
            </p>
          </div>

          <div class="tt-detail-box">
            <span>Requisitos e indicadores deseables</span>
            <p class="text-body-2 mt-2 mb-0 pre-line">
              {{ registro.requisitos || 'Sin requisitos específicos registrados.' }}
            </p>
          </div>
        </section>
      </VCol>

      <VCol
        cols="12"
        md="4"
      >
        <aside class="tt-panel pa-6 h-100">
          <span class="tt-eyebrow">RESUMEN OPERATIVO</span>
          <h2 class="text-h6 font-weight-bold mb-4">
            Datos del proceso
          </h2>

          <div class="d-flex flex-column gap-3">
            <div class="tt-detail-box">
              <span>Unidad / Agencia</span>
              <strong>{{ registro.unidad?.nombre || 'Sin asignar' }}</strong>
            </div>

            <div class="tt-detail-box">
              <span>Plazas y motivo</span>
              <strong>{{ registro.numero_plazas }} {{ Number(registro.numero_plazas) === 1 ? 'plaza' : 'plazas' }} · {{ registro.motivo }}</strong>
            </div>

            <div class="tt-detail-box">
              <span>Postulaciones vinculadas</span>
              <strong>{{ registro.postulaciones_count ?? 0 }} en registro</strong>
            </div>

            <div class="tt-detail-box">
              <span>Solicitante responsable</span>
              <strong>{{ nombreCompletoPersona(registro.solicitante) }}</strong>
            </div>

            <div class="tt-detail-box">
              <span>Fechas del proceso</span>
              <strong>Apertura: {{ formatearFecha(registro.fecha_apertura) }}</strong>
              <div class="text-caption text-medium-emphasis mt-1">
                Cierre estimado: {{ registro.fecha_cierre_estimada ? formatearFecha(registro.fecha_cierre_estimada) : 'Por definir' }}
              </div>
              <div
                v-if="registro.fecha_cierre_real"
                class="text-caption text-success font-weight-medium mt-1"
              >
                Cierre real: {{ formatearFecha(registro.fecha_cierre_real) }}
              </div>
            </div>
          </div>
        </aside>
      </VCol>
    </VRow>

    <section
      v-else
      class="tt-panel pa-6 text-center"
    >
      No fue posible cargar la vacante.
      <VBtn
        variant="text"
        color="primary"
        @click="cargar"
      >
        Reintentar
      </VBtn>
    </section>
  </div>
</template>

<style scoped>
@import '@/assets/styles/reclutamiento-talent.scss';

.pre-line {
  white-space: pre-line;
}
</style>
