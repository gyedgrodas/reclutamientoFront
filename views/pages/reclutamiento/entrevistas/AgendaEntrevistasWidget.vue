<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type { AgendaEntrevistas, Entrevista } from '@/types/reclutamiento'
import {
  extraerMensajeErrorApi,
  formatearFechaCortaGuatemala,
  formatearHoraGuatemala,
  iconoModalidadEntrevista,
} from '@/utils/entrevistasGuatemala'
import { inicialesPersona, nombreCompletoPersona } from '@/utils/reclutamientoUx'

const props = defineProps<{
  refreshKey?: number
  abriendoEntrevistaId?: number | null
}>()

const emit = defineEmits<{
  (e: 'abrirPostulacion', entrevista: Entrevista): void
}>()

const { get } = useClienteRequest()

const LIMITE_POR_CATEGORIA = 100

const puedeVer = computed(() => can('ver entrevistas', 'Entrevista'))
const puedeGestionar = computed(() => can('gestionar entrevistas', 'Entrevista'))

const cargando = ref(true)
const errorCarga = ref<string | null>(null)
const tabActiva = ref<'hoy' | 'pendientes' | 'proximas'>('hoy')
const seleccionInicialAplicada = ref(false)

const agenda = ref<AgendaEntrevistas>({
  hoy: [],
  pendientes_resultado: [],
  proximas: [],
})

let solicitudAgenda: AbortController | undefined

const mostradasAgenda = computed(() =>
  agenda.value.hoy.length + agenda.value.pendientes_resultado.length + agenda.value.proximas.length,
)

const hayPosibleTruncamiento = computed(() =>
  agenda.value.hoy.length >= LIMITE_POR_CATEGORIA
  || agenda.value.pendientes_resultado.length >= LIMITE_POR_CATEGORIA
  || agenda.value.proximas.length >= LIMITE_POR_CATEGORIA,
)

const etiquetaConteoCategoria = (cantidad: number) =>
  cantidad >= LIMITE_POR_CATEGORIA ? `${LIMITE_POR_CATEGORIA}+` : String(cantidad)

const itemsActivos = computed<Entrevista[]>(() => {
  if (tabActiva.value === 'pendientes')
    return agenda.value.pendientes_resultado
  if (tabActiva.value === 'proximas')
    return agenda.value.proximas

  return agenda.value.hoy
})

const categoriaActivaTruncada = computed(() => itemsActivos.value.length >= LIMITE_POR_CATEGORIA)

const mensajeVacioTab = computed(() => {
  if (tabActiva.value === 'pendientes')
    return 'No hay entrevistas vencidas pendientes de registrar resultado.'
  if (tabActiva.value === 'proximas')
    return 'No hay entrevistas programadas para los próximos 7 días.'

  return 'No tienes entrevistas programadas para hoy.'
})

const cargarAgenda = async () => {
  if (!puedeVer.value) {
    cargando.value = false

    return
  }

  solicitudAgenda?.abort()

  const controlador = new AbortController()
  const { signal } = controlador

  solicitudAgenda = controlador
  cargando.value = true
  errorCarga.value = null

  try {
    const respuesta = await get<{ success?: boolean; data?: Partial<AgendaEntrevistas> }>(
      '/api/entrevistas/agenda',
      { signal },
    )

    if (signal.aborted)
      return

    if (respuesta?.success === false || !respuesta?.data || typeof respuesta.data !== 'object') {
      errorCarga.value = 'La agenda recibida del servidor no tiene el formato esperado.'

      return
    }

    agenda.value = {
      hoy: Array.isArray(respuesta.data.hoy) ? respuesta.data.hoy : [],
      pendientes_resultado: Array.isArray(respuesta.data.pendientes_resultado) ? respuesta.data.pendientes_resultado : [],
      proximas: Array.isArray(respuesta.data.proximas) ? respuesta.data.proximas : [],
    }

    if (!seleccionInicialAplicada.value) {
      if (agenda.value.hoy.length)
        tabActiva.value = 'hoy'
      else if (agenda.value.pendientes_resultado.length)
        tabActiva.value = 'pendientes'
      else if (agenda.value.proximas.length)
        tabActiva.value = 'proximas'
      seleccionInicialAplicada.value = true
    }
  }
  catch (error) {
    if (signal.aborted)
      return

    errorCarga.value = extraerMensajeErrorApi(error, 'No fue posible cargar la agenda de entrevistas.')
  }
  finally {
    if (!signal.aborted)
      cargando.value = false
  }
}

watch(() => props.refreshKey, () => {
  cargarAgenda()
})

onMounted(() => {
  cargarAgenda()
})

onBeforeUnmount(() => {
  solicitudAgenda?.abort()
})
</script>

<template>
  <section
    v-if="puedeVer"
    class="tt-panel pa-5"
  >
    <div class="d-flex flex-wrap justify-space-between align-center gap-3 mb-4">
      <div class="d-flex align-center gap-3">
        <div class="tt-stat-icon">
          <VIcon
            icon="tabler-calendar-event"
            size="20"
          />
        </div>
        <div>
          <span class="tt-eyebrow">AGENDA DE ENTREVISTAS · HORA GUATEMALA</span>
          <h2 class="text-h6 font-weight-bold mb-0">
            Centro de entrevistas del reclutador
          </h2>
          <p class="text-caption text-medium-emphasis mb-0 mt-1">
            Muestra hasta {{ LIMITE_POR_CATEGORIA }} registros por categoría (hoy, pendientes de resultado y próximos 7 días; no incluye citas a más de 7 días).
          </p>
        </div>
      </div>

      <div class="d-flex align-center gap-2">
        <VChip
          v-if="!cargando && !errorCarga"
          size="small"
          :color="hayPosibleTruncamiento ? 'warning' : 'primary'"
          variant="tonal"
          class="font-weight-bold"
          :title="hayPosibleTruncamiento ? 'Al menos una categoría alcanzó el límite de 100 registros mostrados.' : 'Registros mostrados en esta agenda (ventana de 7 días).'"
        >
          {{ mostradasAgenda }}{{ hayPosibleTruncamiento ? '+' : '' }} {{ mostradasAgenda === 1 && !hayPosibleTruncamiento ? 'mostrada' : 'mostradas' }}
        </VChip>
        <VBtn
          icon="tabler-refresh"
          size="small"
          variant="tonal"
          color="secondary"
          :loading="cargando"
          title="Actualizar agenda"
          @click="cargarAgenda"
        />
      </div>
    </div>

    <!-- Tabs de agenda -->
    <VTabs
      v-model="tabActiva"
      density="compact"
      color="primary"
      class="mb-4 agenda-tabs"
    >
      <VTab value="hoy">
        <span>Hoy</span>
        <VChip
          size="x-small"
          :color="agenda.hoy.length ? 'primary' : 'secondary'"
          variant="tonal"
          class="ms-2 font-weight-bold"
          :title="`Registros mostrados (máximo ${LIMITE_POR_CATEGORIA})`"
        >
          {{ etiquetaConteoCategoria(agenda.hoy.length) }}
        </VChip>
      </VTab>

      <VTab value="pendientes">
        <span>Pendientes de resultado</span>
        <VChip
          size="x-small"
          :color="agenda.pendientes_resultado.length ? 'warning' : 'secondary'"
          variant="tonal"
          class="ms-2 font-weight-bold"
          :title="`Registros mostrados (máximo ${LIMITE_POR_CATEGORIA})`"
        >
          {{ etiquetaConteoCategoria(agenda.pendientes_resultado.length) }}
        </VChip>
      </VTab>

      <VTab value="proximas">
        <span>Próximas (7 días)</span>
        <VChip
          size="x-small"
          :color="agenda.proximas.length ? 'info' : 'secondary'"
          variant="tonal"
          class="ms-2 font-weight-bold"
          :title="`Registros mostrados (máximo ${LIMITE_POR_CATEGORIA})`"
        >
          {{ etiquetaConteoCategoria(agenda.proximas.length) }}
        </VChip>
      </VTab>
    </VTabs>

    <!-- Cargando -->
    <div
      v-if="cargando"
      role="status"
      class="py-4"
    >
      <p class="text-caption text-medium-emphasis mb-2">
        Consultando agenda de entrevistas…
      </p>
      <VProgressLinear
        indeterminate
        color="primary"
        rounded
        aria-label="Cargando agenda de entrevistas"
      />
    </div>

    <!-- Error -->
    <VAlert
      v-else-if="errorCarga"
      type="error"
      variant="tonal"
      density="compact"
    >
      <div class="d-flex align-center justify-space-between flex-wrap gap-2">
        <span>{{ errorCarga }}</span>
        <VBtn
          size="small"
          variant="text"
          @click="cargarAgenda"
        >
          Reintentar
        </VBtn>
      </div>
    </VAlert>

    <!-- Vacío -->
    <div
      v-else-if="!itemsActivos.length"
      class="tt-detail-box text-center py-6"
      role="status"
    >
      <VIcon
        :icon="tabActiva === 'pendientes' ? 'tabler-checks' : 'tabler-calendar-off'"
        size="26"
        class="text-disabled mb-1"
      />
      <p class="text-body-2 text-medium-emphasis mb-0">
        {{ mensajeVacioTab }}
      </p>
    </div>

    <!-- Lista responsive de entrevistas en agenda -->
    <template v-else>
      <VAlert
        v-if="categoriaActivaTruncada"
        type="info"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        Se muestran los primeros {{ LIMITE_POR_CATEGORIA }} registros de esta categoría; pueden existir entrevistas adicionales no listadas aquí.
      </VAlert>

      <div class="agenda-grid">
        <article
          v-for="item in itemsActivos"
          :key="item.id"
          class="agenda-card"
          :class="{ 'agenda-card--pendiente': tabActiva === 'pendientes' }"
        >
          <div class="d-flex align-start justify-space-between gap-2">
            <div class="d-flex align-center gap-2 min-w-0">
              <div class="tt-avatar">
                {{ inicialesPersona(item.postulacion?.candidato?.nombres, item.postulacion?.candidato?.apellidos) }}
              </div>
              <div class="min-w-0">
                <div class="text-body-2 font-weight-bold text-truncate">
                  {{ nombreCompletoPersona(item.postulacion?.candidato) }}
                </div>
                <div class="text-caption text-medium-emphasis text-truncate">
                  {{ item.postulacion?.vacante?.puesto?.nombre || `Postulación #${item.postulacion_id}` }}
                </div>
              </div>
            </div>

            <VChip
              size="x-small"
              :color="tabActiva === 'pendientes' ? 'warning' : 'primary'"
              variant="tonal"
              class="font-weight-bold flex-shrink-0"
            >
              {{ formatearHoraGuatemala(item.fecha_hora) }}
            </VChip>
          </div>

          <div class="d-flex flex-wrap align-center gap-x-3 gap-y-1 mt-3 text-caption text-medium-emphasis">
            <span class="d-inline-flex align-center gap-1">
              <VIcon
                icon="tabler-calendar"
                size="14"
              />
              {{ formatearFechaCortaGuatemala(item.fecha_hora) }} (GT)
            </span>
            <span class="d-inline-flex align-center gap-1">
              <VIcon
                :icon="iconoModalidadEntrevista(item.modalidad)"
                size="14"
              />
              {{ item.modalidad }}
            </span>
            <span
              v-if="item.entrevistador"
              class="d-inline-flex align-center gap-1 text-truncate"
            >
              <VIcon
                icon="tabler-user-check"
                size="14"
              />
              {{ nombreCompletoPersona(item.entrevistador) }}
            </span>
          </div>

          <div
            v-if="item.lugar"
            class="text-caption text-disabled text-truncate mt-1"
          >
            {{ item.lugar }}
          </div>

          <div class="d-flex justify-end mt-3">
            <VBtn
              size="x-small"
              :color="tabActiva === 'pendientes' ? 'warning' : 'primary'"
              variant="tonal"
              :loading="abriendoEntrevistaId === item.id"
              :disabled="Boolean(abriendoEntrevistaId && abriendoEntrevistaId !== item.id)"
              :prepend-icon="tabActiva === 'pendientes' && puedeGestionar ? 'tabler-clipboard-check' : 'tabler-arrow-right'"
              @click="emit('abrirPostulacion', item)"
            >
              {{ tabActiva === 'pendientes' && puedeGestionar ? 'Registrar resultado' : 'Abrir seguimiento' }}
            </VBtn>
          </div>
        </article>
      </div>
    </template>
  </section>
</template>

<style scoped>
@import '@styles/reclutamiento-talent.scss';

.agenda-tabs {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}

.agenda-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 12px;
}

.agenda-card {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 11px;
  padding: 13px 14px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: border-color 0.14s ease, box-shadow 0.14s ease;
}

.agenda-card:hover {
  border-color: rgba(33, 130, 104, 0.45);
  box-shadow: 0 6px 16px rgba(27, 65, 52, 0.07);
}

.agenda-card--pendiente {
  border-left: 3px solid #d08328;
}
</style>
