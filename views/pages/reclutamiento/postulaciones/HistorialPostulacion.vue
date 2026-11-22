<script setup lang="ts">
import type { MovimientoPostulacion, RespuestaHistorialPostulacion } from '@/types/reclutamiento'

const props = defineProps<{ postulacionId: number; refreshKey?: number }>()
const { get } = useClienteRequest()
const historial = ref<RespuestaHistorialPostulacion['data'] | null>(null)
const pagina = ref(1)
const cargando = ref(true)
const error = ref(false)
let solicitud: AbortController | undefined

const formatoFecha = new Intl.DateTimeFormat('es-GT', { dateStyle: 'medium', timeStyle: 'short' })

const formatearFecha = (iso: string) => {
  const fecha = new Date(iso)

  return Number.isNaN(fecha.getTime()) ? 'Fecha no disponible' : formatoFecha.format(fecha)
}

const cambiosDe = (movimiento: MovimientoPostulacion) => [
  { campo: 'Etapa', icono: 'tabler-git-Merge', anterior: movimiento.etapa_anterior, nuevo: movimiento.etapa_nueva },
  { campo: 'Estado', icono: 'tabler-flag', anterior: movimiento.estado_anterior, nuevo: movimiento.estado_nuevo },
  { campo: 'Responsable', icono: 'tabler-user-check', anterior: movimiento.responsable_anterior, nuevo: movimiento.responsable_nuevo },
].filter(cambio => movimiento.tipo === 'Registro'
  ? Boolean(cambio.nuevo)
  : cambio.anterior !== cambio.nuevo)

const cargar = async (numero: number) => {
  solicitud?.abort()

  const controlador = new AbortController()
  const { signal } = controlador

  solicitud = controlador
  pagina.value = numero
  cargando.value = true
  error.value = false

  try {
    const respuesta = await get<RespuestaHistorialPostulacion>(`/api/postulaciones/${props.postulacionId}/historial`, {
      params: { 'page[number]': numero, 'page[size]': 8 },
      signal,
    })

    if (signal.aborted)
      return

    if (!respuesta.success || !Array.isArray(respuesta.data?.data)) {
      error.value = true

      return
    }

    historial.value = respuesta.data
    pagina.value = respuesta.data.current_page
  }
  catch {
    if (!signal.aborted)
      error.value = true
  }
  finally {
    if (!signal.aborted)
      cargando.value = false
  }
}

watch(() => [props.postulacionId, props.refreshKey], () => {
  cargar(1)
})

onMounted(() => cargar(1))
onBeforeUnmount(() => solicitud?.abort())
</script>

<template>
  <section class="mt-5">
    <div class="d-flex align-center justify-space-between mb-3">
      <div>
        <span class="tt-eyebrow">TRAZABILIDAD</span>
        <h3 class="text-subtitle-1 font-weight-bold mb-0">
          Historial de seguimiento
        </h3>
      </div>
      <VChip
        v-if="historial?.total"
        size="x-small"
        color="success"
        variant="tonal"
        class="font-weight-bold"
      >
        {{ historial.total }} {{ historial.total === 1 ? 'movimiento' : 'movimientos' }}
      </VChip>
    </div>

    <div
      v-if="cargando"
      role="status"
      class="py-3"
    >
      <p class="text-caption text-medium-emphasis mb-2">
        Cargando movimientos del proceso…
      </p>
      <VProgressLinear
        indeterminate
        color="success"
        rounded
        aria-label="Cargando historial"
      />
    </div>

    <VAlert
      v-else-if="error"
      type="error"
      variant="tonal"
      density="compact"
    >
      <div class="d-flex align-center justify-space-between flex-wrap gap-2">
        <span>No fue posible cargar el historial de movimientos.</span>
        <VBtn
          size="small"
          variant="text"
          @click="cargar(pagina)"
        >
          Reintentar
        </VBtn>
      </div>
    </VAlert>

    <div
      v-else-if="!historial?.data.length"
      class="tt-detail-box text-center py-5"
      role="status"
    >
      <VIcon
        icon="tabler-history"
        size="26"
        class="text-disabled mb-1"
      />
      <p class="text-body-2 text-medium-emphasis mb-0">
        {{ historial?.total ? 'No hay movimientos en esta página.' : 'Aún no hay movimientos registrados para esta postulación.' }}
      </p>
    </div>

    <VTimeline
      v-else
      side="end"
      align="start"
      density="compact"
      line-inset="4"
      class="historial-timeline"
    >
      <VTimelineItem
        v-for="movimiento in historial.data"
        :key="movimiento.id"
        :dot-color="movimiento.tipo === 'Registro' ? 'success' : 'primary'"
        size="x-small"
      >
        <div class="movimiento-card">
          <div class="d-flex flex-wrap align-center justify-space-between gap-2 mb-1">
            <div class="d-flex align-center gap-2">
              <VChip
                size="x-small"
                :color="movimiento.tipo === 'Registro' ? 'success' : 'primary'"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ movimiento.tipo === 'Registro' ? 'Postulación registrada' : 'Cambio de seguimiento' }}
              </VChip>
              <span class="text-caption text-medium-emphasis">
                por <strong>{{ movimiento.actor || 'Sistema' }}</strong>
              </span>
            </div>
            <time
              :datetime="movimiento.created_at"
              class="text-caption text-disabled"
            >
              {{ formatearFecha(movimiento.created_at) }}
            </time>
          </div>

          <div class="d-flex flex-column gap-1 mt-2">
            <div
              v-for="cambio in cambiosDe(movimiento)"
              :key="cambio.campo"
              class="text-body-2 d-flex flex-wrap align-center gap-1"
            >
              <span class="text-caption font-weight-bold text-medium-emphasis mr-1">{{ cambio.campo }}:</span>
              <template v-if="movimiento.tipo === 'Actualización'">
                <span class="cambio-pill cambio-pill--old">{{ cambio.anterior ?? 'Sin asignar' }}</span>
                <VIcon
                  icon="tabler-arrow-right"
                  size="14"
                  class="text-disabled"
                />
              </template>
              <span class="cambio-pill cambio-pill--new">{{ cambio.nuevo ?? 'Sin asignar' }}</span>
            </div>
          </div>

          <div
            v-if="movimiento.observaciones"
            class="observacion-box mt-2"
          >
            <VIcon
              icon="tabler-message-2"
              size="14"
              class="mr-1 text-medium-emphasis"
            />
            <span class="observacion">{{ movimiento.observaciones }}</span>
          </div>
        </div>
      </VTimelineItem>
    </VTimeline>

    <VPagination
      v-if="historial && historial.last_page > 1"
      :model-value="pagina"
      :length="historial.last_page"
      :total-visible="4"
      :disabled="cargando"
      aria-label="Páginas del historial"
      size="small"
      class="mt-3"
      @update:model-value="cargar"
    />
  </section>
</template>

<style scoped>
@import '@/assets/styles/reclutamiento-talent.scss';

.movimiento-card {
  background: rgba(var(--v-theme-on-surface), 0.025);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 10px;
  padding: 10px 12px;
}

.cambio-pill {
  display: inline-block;
  font-size: 12px;
  font-weight: 600;
  padding: 1px 8px;
  border-radius: 999px;
}

.cambio-pill--old {
  background: rgba(var(--v-theme-on-surface), 0.07);
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.cambio-pill--new {
  background: #e8f4ef;
  color: #16654f;
}

.v-theme--dark .cambio-pill--new {
  background: rgba(33, 130, 104, 0.25);
  color: #6ee7b7;
}

.observacion-box {
  font-size: 12.5px;
  padding: 7px 10px;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface), 0.9);
  border-left: 3px solid #218268;
}

.observacion {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
