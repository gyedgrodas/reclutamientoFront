<script setup lang="ts">
import type { MovimientoPostulacion, RespuestaHistorialPostulacion } from '@/types/reclutamiento'

const props = defineProps<{ postulacionId: number }>()
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
  { campo: 'Etapa', anterior: movimiento.etapa_anterior, nuevo: movimiento.etapa_nueva },
  { campo: 'Estado', anterior: movimiento.estado_anterior, nuevo: movimiento.estado_nuevo },
  { campo: 'Responsable', anterior: movimiento.responsable_anterior, nuevo: movimiento.responsable_nuevo },
].filter(cambio => movimiento.tipo === 'Registro' || cambio.anterior !== cambio.nuevo)

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
      params: { 'page[number]': numero, 'page[size]': 10 },
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

onMounted(() => cargar(1))
onBeforeUnmount(() => solicitud?.abort())
</script>

<template>
  <section class="mt-5">
    <VDivider class="mb-4" />
    <h2 class="text-h6 mb-3">
      Historial de movimientos
    </h2>

    <div
      v-if="cargando"
      role="status"
    >
      <p class="text-body-2 mb-2">
        Cargando historial…
      </p>
      <VProgressLinear
        indeterminate
        aria-label="Cargando historial"
      />
    </div>
    <VAlert
      v-else-if="error"
      type="error"
      variant="tonal"
    >
      No fue posible cargar el historial.
      <VBtn
        size="small"
        variant="text"
        @click="cargar(pagina)"
      >
        Reintentar
      </VBtn>
    </VAlert>
    <p
      v-else-if="!historial?.data.length"
      class="text-medium-emphasis"
      role="status"
    >
      {{ historial?.total ? 'No hay movimientos en esta página.' : 'Aún no hay movimientos registrados para esta postulación.' }}
    </p>
    <VTimeline
      v-else
      side="end"
      align="start"
      density="compact"
    >
      <VTimelineItem
        v-for="movimiento in historial.data"
        :key="movimiento.id"
        :dot-color="movimiento.tipo === 'Registro' ? 'success' : 'primary'"
        size="x-small"
      >
        <div class="text-subtitle-2">
          {{ movimiento.tipo }}
        </div>
        <div class="text-caption text-medium-emphasis mb-1">
          <time :datetime="movimiento.created_at">{{ formatearFecha(movimiento.created_at) }}</time>
          · Por: {{ movimiento.actor || 'Sin identificar' }}
        </div>
        <div
          v-for="cambio in cambiosDe(movimiento)"
          :key="cambio.campo"
        >
          <strong>{{ cambio.campo }}:</strong>
          <template v-if="movimiento.tipo === 'Actualización'">
            {{ cambio.anterior ?? 'Sin asignar' }} →
          </template>
          {{ cambio.nuevo ?? 'Sin asignar' }}
        </div>
        <p
          v-if="movimiento.observaciones"
          class="observacion mt-2 mb-0"
        >
          <strong>Observación del movimiento:</strong> {{ movimiento.observaciones }}
        </p>
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
.observacion {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
