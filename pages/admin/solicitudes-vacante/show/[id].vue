<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type { SolicitudVacante, Vacante } from '@/types/reclutamiento'
import DetalleResolucionDialog from '@/views/pages/reclutamiento/solicitudes-vacante/DetalleResolucionDialog.vue'
import CrearVacanteDesdeSolicitudDialog from '@/views/pages/reclutamiento/solicitudes-vacante/CrearVacanteDesdeSolicitudDialog.vue'
import BitacoraSolicitud from '@/views/pages/reclutamiento/solicitudes-vacante/BitacoraSolicitud.vue'
import { nombreCompletoPersona } from '@/utils/reclutamientoUx'

type EstadoPasoFlujo = 'done' | 'active' | 'pending' | 'error' | 'skipped'

interface PasoFlujoSolicitud {
  numero: number
  titulo: string
  estado: EstadoPasoFlujo
  etiquetaEstado: string
  icono: string
  fecha: string
  detalle: string
}

definePageMeta({
  navActiveLink: 'admin-solicitudes-vacante',
  middleware: 'permissions',
  action: 'ver solicitudes vacante',
  subject: 'SolicitudVacante',
})

const route = useRoute()
const { get } = useClienteRequest()
const puedeResolverSolicitud = usePuedeResolverSolicitud()

const registro = ref<SolicitudVacante | null>(null)
const cargando = ref(true)
const errorCarga = ref<string | null>(null)

const dialogResolucion = ref(false)
const dialogCrearVacante = ref(false)
const versionBitacora = ref(0)

const coloresEstado: Record<string, string> = {
  Pendiente: 'warning',
  Aprobada: 'success',
  Rechazada: 'error',
}

const iconosEstado: Record<string, string> = {
  Pendiente: 'tabler-clock',
  Aprobada: 'tabler-circle-check',
  Rechazada: 'tabler-circle-x',
}

const puedeResolver = computed(() => puedeResolverSolicitud(registro.value))

const puedeCrearVacante = computed(() =>
  registro.value?.estado === 'Aprobada'
  && !registro.value?.vacante
  && can('crear vacantes', 'Vacante'),
)

const puedeVerBitacora = computed(() =>
  can('ver bitacora reclutamiento', 'BitacoraReclutamiento'),
)

const formatearFechaSegura = (fecha?: string | null) => {
  if (!fecha)
    return 'No registrada'
  try {
    return formatoFechaHora(fecha)
  }
  catch {
    return fecha
  }
}

const formatearFechaCortaSegura = (fecha?: string | null) => {
  if (!fecha)
    return 'No registrada'
  try {
    return formatearFecha(fecha)
  }
  catch {
    return fecha
  }
}

const pasosProceso = computed<PasoFlujoSolicitud[]>(() => {
  const sol = registro.value
  if (!sol)
    return []

  const esPendiente = sol.estado === 'Pendiente'
  const esAprobada = sol.estado === 'Aprobada'
  const esRechazada = sol.estado === 'Rechazada'
  const tieneVacante = Boolean(sol.vacante)

  const pasoRegistro: PasoFlujoSolicitud = {
    numero: 1,
    titulo: 'Solicitud registrada',
    estado: 'done',
    etiquetaEstado: 'Completado',
    icono: 'tabler-file-description',
    fecha: formatearFechaSegura(sol.created_at),
    detalle: `Por ${nombreCompletoPersona(sol.solicitante)}`,
  }

  let pasoAprobacion: PasoFlujoSolicitud
  if (esPendiente) {
    pasoAprobacion = {
      numero: 2,
      titulo: 'Revisión y aprobación',
      estado: 'active',
      etiquetaEstado: 'En curso',
      icono: 'tabler-clock-hour-4',
      fecha: 'Pendiente de resolución',
      detalle: 'En espera de dictamen gerencial',
    }
  }
  else if (esAprobada) {
    pasoAprobacion = {
      numero: 2,
      titulo: 'Solicitud aprobada',
      estado: 'done',
      etiquetaEstado: 'Aprobada',
      icono: 'tabler-circle-check',
      fecha: formatearFechaSegura(sol.fecha_resolucion),
      detalle: `Por ${nombreCompletoPersona(sol.aprobador)}`,
    }
  }
  else {
    pasoAprobacion = {
      numero: 2,
      titulo: 'Solicitud rechazada',
      estado: 'error',
      etiquetaEstado: 'Rechazada',
      icono: 'tabler-circle-x',
      fecha: formatearFechaSegura(sol.fecha_resolucion),
      detalle: `Por ${nombreCompletoPersona(sol.aprobador)}`,
    }
  }

  let pasoVacante: PasoFlujoSolicitud
  if (tieneVacante && sol.vacante) {
    pasoVacante = {
      numero: 3,
      titulo: `Vacante #${sol.vacante.id} creada`,
      estado: 'done',
      etiquetaEstado: sol.vacante.estado || 'Creada',
      icono: 'tabler-briefcase',
      fecha: sol.vacante.fecha_apertura
        ? `Apertura: ${formatearFechaCortaSegura(sol.vacante.fecha_apertura)}`
        : 'Vinculada al requerimiento',
      detalle: `Estado actual: ${sol.vacante.estado}`,
    }
  }
  else if (esAprobada) {
    pasoVacante = {
      numero: 3,
      titulo: 'Creación de vacante',
      estado: 'active',
      etiquetaEstado: 'Siguiente paso',
      icono: 'tabler-briefcase-2',
      fecha: 'Lista para apertura',
      detalle: 'Pendiente de publicar vacante oficial',
    }
  }
  else if (esRechazada) {
    pasoVacante = {
      numero: 3,
      titulo: 'Creación de vacante',
      estado: 'skipped',
      etiquetaEstado: 'No aplica',
      icono: 'tabler-ban',
      fecha: 'Proceso cerrado',
      detalle: 'No se genera vacante por rechazo',
    }
  }
  else {
    pasoVacante = {
      numero: 3,
      titulo: 'Creación de vacante',
      estado: 'pending',
      etiquetaEstado: 'Pendiente',
      icono: 'tabler-briefcase',
      fecha: 'Disponible al aprobar',
      detalle: 'Se habilitará tras la aprobación',
    }
  }

  return [pasoRegistro, pasoAprobacion, pasoVacante]
})

const resumenSiguientePaso = computed(() => {
  const sol = registro.value
  if (!sol)
    return null

  if (sol.estado === 'Pendiente') {
    return {
      tono: 'warning' as const,
      icono: 'tabler-hourglass-high',
      titulo: 'Siguiente paso: Resolución gerencial',
      descripcion: puedeResolver.value
        ? 'Revise la justificación y registre la aprobación o el rechazo para continuar con el flujo.'
        : 'La solicitud está pendiente de dictamen por un usuario autorizado para resolver solicitudes.',
    }
  }

  if (sol.estado === 'Aprobada' && !sol.vacante) {
    return {
      tono: 'info' as const,
      icono: 'tabler-arrow-right-circle',
      titulo: 'Siguiente paso: Crear vacante oficial',
      descripcion: puedeCrearVacante.value
        ? 'La solicitud ya fue aprobada. Genere la vacante oficial para iniciar el proceso de reclutamiento.'
        : 'La solicitud fue aprobada y está pendiente de que Talento Humano cree la vacante oficial.',
    }
  }

  if (sol.vacante) {
    return {
      tono: 'success' as const,
      icono: 'tabler-rosette-discount-check',
      titulo: `Flujo completado · Vacante #${sol.vacante.id} vinculada`,
      descripcion: `La vacante oficial se encuentra en estado "${sol.vacante.estado}"${sol.vacante.fecha_apertura ? ` con fecha de apertura ${formatearFechaCortaSegura(sol.vacante.fecha_apertura)}` : ''}.`,
    }
  }

  return {
    tono: 'error' as const,
    icono: 'tabler-circle-x',
    titulo: 'Proceso finalizado · Solicitud rechazada',
    descripcion: 'No se habilitará la creación de vacante para esta solicitud. Consulte las observaciones registradas.',
  }
})

const cargar = async (silencioso = false) => {
  if (!silencioso)
    cargando.value = true
  errorCarga.value = null
  try {
    const respuesta = await get<{ data: SolicitudVacante }>(`/api/solicitudes-vacante/${route.params.id}`)
    if (!respuesta?.data)
      throw new Error('No se encontró la información de la solicitud solicitada.')

    registro.value = respuesta.data
  }
  catch (error: any) {
    if (!silencioso)
      registro.value = null
    errorCarga.value = error?.response?.data?.message || error?.message || 'No fue posible cargar el detalle de la solicitud.'
    manejaError(error)
  }
  finally {
    if (!silencioso)
      cargando.value = false
  }
}

const onResuelta = async (actualizada: SolicitudVacante) => {
  registro.value = registro.value
    ? { ...registro.value, ...actualizada }
    : actualizada
  await cargar(true)
  versionBitacora.value++
}

const onVacanteCreada = async (vacante: Vacante) => {
  if (registro.value)
    registro.value = { ...registro.value, vacante }
  await cargar(true)
  versionBitacora.value++
}

const reintentar = () => {
  cargar(false)
}

onMounted(() => cargar())
</script>

<template>
  <div>
    <header class="tt-page-header">
      <div>
        <span class="tt-eyebrow">SOLICITUD DE VACANTE · #{{ route.params.id }}</span>
        <h1 class="tt-page-title">
          {{ registro?.puesto?.nombre || 'Detalle de solicitud' }}
        </h1>
        <p class="tt-page-subtitle">
          {{ registro?.unidad?.nombre || 'Consulte el estado de aprobación, justificación y vacante vinculada.' }}
        </p>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <VBtn
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-arrow-left"
          to="/admin/solicitudes-vacante"
        >
          Regresar
        </VBtn>

        <VBtn
          v-if="puedeResolver"
          color="primary"
          prepend-icon="tabler-shield-check"
          @click="dialogResolucion = true"
        >
          Aprobar / Rechazar
        </VBtn>

        <VBtn
          v-if="puedeCrearVacante"
          color="success"
          prepend-icon="tabler-briefcase-2"
          @click="dialogCrearVacante = true"
        >
          Crear vacante oficial
        </VBtn>

        <VBtn
          v-if="registro?.vacante && can('ver vacantes', 'Vacante')"
          color="success"
          variant="outlined"
          prepend-icon="tabler-external-link"
          :to="`/admin/vacantes/show/${registro.vacante.id}`"
        >
          Ver vacante #{{ registro.vacante.id }}
        </VBtn>
      </div>
    </header>

    <VProgressLinear
      v-if="cargando"
      indeterminate
      color="primary"
      rounded
      class="mb-4"
    />

    <section
      v-else-if="errorCarga"
      class="tt-panel pa-8 text-center"
    >
      <VIcon
        icon="tabler-alert-triangle"
        size="46"
        color="error"
        class="mb-2"
      />
      <h3 class="text-h6 font-weight-bold mb-1">
        No se pudo cargar la solicitud
      </h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ errorCarga }}
      </p>
      <div class="d-flex justify-center gap-2">
        <VBtn
          color="primary"
          prepend-icon="tabler-refresh"
          @click="reintentar"
        >
          Reintentar
        </VBtn>
        <VBtn
          color="secondary"
          variant="tonal"
          to="/admin/solicitudes-vacante"
        >
          Volver al listado
        </VBtn>
      </div>
    </section>

    <VRow v-else-if="registro">
      <VCol
        cols="12"
        md="8"
      >
        <section class="tt-panel pa-6 h-100 tt-solicitud-main">
          <div class="d-flex align-center justify-space-between flex-wrap gap-2 mb-5">
            <div>
              <span class="tt-eyebrow">SEGUIMIENTO DEL REQUERIMIENTO</span>
              <h2 class="text-h6 font-weight-bold mb-0">
                Proceso y justificación
              </h2>
            </div>
            <VChip
              :color="coloresEstado[registro.estado] || 'secondary'"
              :prepend-icon="iconosEstado[registro.estado]"
              variant="tonal"
              size="small"
              class="font-weight-bold"
            >
              {{ registro.estado }}
            </VChip>
          </div>

          <!-- Flujo visual dinámico, responsive y accesible -->
          <div class="tt-process-card mb-5">
            <ol
              class="tt-process-flow"
              aria-label="Flujo de seguimiento de la solicitud de vacante"
            >
              <li
                v-for="(paso, idx) in pasosProceso"
                :key="paso.numero"
                class="tt-process-step"
                :class="`tt-process-step--${paso.estado}`"
                :aria-current="paso.estado === 'active' ? 'step' : undefined"
              >
                <div class="tt-process-step__rail">
                  <div
                    class="tt-process-step__node"
                    aria-hidden="true"
                  >
                    <VIcon
                      :icon="paso.icono"
                      size="17"
                    />
                  </div>
                  <span
                    v-if="idx < pasosProceso.length - 1"
                    class="tt-process-step__connector"
                    :class="{
                      'tt-process-step__connector--done': paso.estado === 'done' && pasosProceso[idx + 1].estado !== 'pending' && pasosProceso[idx + 1].estado !== 'skipped',
                      'tt-process-step__connector--error': paso.estado === 'error',
                    }"
                    aria-hidden="true"
                  />
                </div>

                <div class="tt-process-step__body">
                  <div class="tt-process-step__top">
                    <span class="tt-process-step__num">Paso {{ paso.numero }}</span>
                    <span class="tt-process-step__badge">
                      {{ paso.etiquetaEstado }}
                    </span>
                  </div>
                  <h3 class="tt-process-step__title">
                    {{ paso.titulo }}
                  </h3>
                  <p class="tt-process-step__meta">
                    <VIcon
                      icon="tabler-calendar-event"
                      size="13"
                      class="me-1"
                    />
                    <span>{{ paso.fecha }}</span>
                  </p>
                  <p class="tt-process-step__detail">
                    {{ paso.detalle }}
                  </p>
                </div>
              </li>
            </ol>

            <div
              v-if="resumenSiguientePaso"
              class="tt-next-step"
              :class="`tt-next-step--${resumenSiguientePaso.tono}`"
              role="status"
              aria-live="polite"
            >
              <div class="tt-next-step__content">
                <VIcon
                  :icon="resumenSiguientePaso.icono"
                  size="20"
                  class="tt-next-step__icon"
                />
                <div>
                  <strong class="tt-next-step__title">{{ resumenSiguientePaso.titulo }}</strong>
                  <p class="tt-next-step__desc mb-0">
                    {{ resumenSiguientePaso.descripcion }}
                  </p>
                </div>
              </div>

              <div class="tt-next-step__actions">
                <VBtn
                  v-if="puedeResolver"
                  size="small"
                  color="primary"
                  prepend-icon="tabler-shield-check"
                  @click="dialogResolucion = true"
                >
                  Resolver ahora
                </VBtn>
                <VBtn
                  v-else-if="puedeCrearVacante"
                  size="small"
                  color="primary"
                  prepend-icon="tabler-briefcase-2"
                  @click="dialogCrearVacante = true"
                >
                  Crear vacante ahora
                </VBtn>
                <VBtn
                  v-else-if="registro.vacante && can('ver vacantes', 'Vacante')"
                  size="small"
                  color="success"
                  variant="flat"
                  prepend-icon="tabler-external-link"
                  :to="`/admin/vacantes/show/${registro.vacante.id}`"
                >
                  Abrir vacante
                </VBtn>
              </div>
            </div>
          </div>

          <div class="tt-detail-box mb-4">
            <span>Justificación del requerimiento</span>
            <p class="text-body-2 mt-2 mb-0 pre-line">
              {{ registro.justificacion }}
            </p>
          </div>

          <div
            v-if="registro.estado !== 'Pendiente'"
            class="tt-detail-box"
          >
            <div class="d-flex flex-wrap justify-space-between align-center gap-2 mb-1">
              <span>Observaciones de resolución ({{ registro.estado }})</span>
              <small class="text-medium-emphasis">
                {{ nombreCompletoPersona(registro.aprobador) }} · {{ formatearFechaSegura(registro.fecha_resolucion) }}
              </small>
            </div>
            <p class="text-body-2 mt-2 mb-0 pre-line">
              {{ registro.observaciones || 'Sin observaciones registradas.' }}
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
            Datos del requerimiento
          </h2>

          <div class="d-flex flex-column gap-3">
            <div class="tt-detail-box">
              <span>Puesto</span>
              <strong>{{ registro.puesto?.nombre || `Puesto #${registro.puesto_id}` }}</strong>
            </div>
            <div class="tt-detail-box">
              <span>Unidad / Agencia</span>
              <strong>{{ registro.unidad?.nombre || `Unidad #${registro.unidad_id}` }}</strong>
            </div>
            <div class="tt-detail-box">
              <span>Número de plazas</span>
              <strong>{{ registro.numero_plazas }} {{ Number(registro.numero_plazas) === 1 ? 'plaza' : 'plazas' }}</strong>
            </div>
            <div class="tt-detail-box">
              <span>Motivo</span>
              <strong>{{ registro.motivo }}</strong>
            </div>
            <div class="tt-detail-box">
              <span>Solicitante</span>
              <strong>{{ nombreCompletoPersona(registro.solicitante) }}</strong>
            </div>
            <div class="tt-detail-box">
              <span>Fecha de solicitud</span>
              <strong>{{ formatearFechaSegura(registro.created_at) }}</strong>
            </div>
            <div
              v-if="registro.estado !== 'Pendiente'"
              class="tt-detail-box"
            >
              <span>Aprobador</span>
              <strong>{{ nombreCompletoPersona(registro.aprobador) }}</strong>
            </div>
            <div
              v-if="registro.estado !== 'Pendiente'"
              class="tt-detail-box"
            >
              <span>Fecha de resolución</span>
              <strong>{{ formatearFechaSegura(registro.fecha_resolucion) }}</strong>
            </div>
          </div>
        </aside>
      </VCol>
    </VRow>

    <BitacoraSolicitud
      v-if="registro && puedeVerBitacora"
      :solicitud-id="registro.id"
      :version="versionBitacora"
    />

    <DetalleResolucionDialog
      v-model="dialogResolucion"
      :solicitud="registro"
      modo-inicial="resolver"
      @resuelta="onResuelta"
      @abrir-crear-vacante="dialogResolucion = false; dialogCrearVacante = true"
    />

    <CrearVacanteDesdeSolicitudDialog
      v-model="dialogCrearVacante"
      :solicitud="registro"
      @creada="onVacanteCreada"
    />
  </div>
</template>

<style scoped>
@import "@styles/reclutamiento-talent.scss";

/* Corrige localmente height: 100% heredado de .tt-detail-box en contenedores apilados */
.tt-detail-box {
  height: auto;
}

.pre-line {
  white-space: pre-line;
}

.tt-process-card {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid #e4ece8;
  background: #f8fbf9;
}

.v-theme--dark .tt-process-card {
  background: rgba(255, 255, 255, 0.025);
  border-color: rgba(255, 255, 255, 0.09);
}

.tt-process-flow {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.tt-process-step {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 10px;
  padding: 12px;
  border-radius: 10px;
  border: 1px solid #e4ece8;
  background: rgb(var(--v-theme-surface));
  min-width: 0;
}

.tt-process-step--done {
  border-color: rgba(17, 123, 99, 0.3);
}

.tt-process-step--active {
  border-color: rgba(208, 131, 40, 0.55);
  box-shadow: 0 0 0 2px rgba(208, 131, 40, 0.12);
}

.tt-process-step--error {
  border-color: rgba(197, 48, 48, 0.45);
  box-shadow: 0 0 0 2px rgba(197, 48, 48, 0.08);
}

.tt-process-step--skipped {
  border-style: dashed;
  opacity: 0.72;
}

.tt-process-step--pending {
  opacity: 0.85;
}

.v-theme--dark .tt-process-step {
  border-color: rgba(255, 255, 255, 0.09);
}

.v-theme--dark .tt-process-step--done {
  border-color: rgba(52, 211, 153, 0.32);
}

.v-theme--dark .tt-process-step--active {
  border-color: rgba(251, 191, 36, 0.48);
  box-shadow: 0 0 0 2px rgba(251, 191, 36, 0.12);
}

.v-theme--dark .tt-process-step--error {
  border-color: rgba(248, 113, 113, 0.48);
}

.tt-process-step__rail {
  display: flex;
  align-items: center;
  gap: 10px;
}

.tt-process-step__node {
  width: 34px;
  height: 34px;
  border-radius: 50%;
  display: inline-grid;
  place-items: center;
  flex-shrink: 0;
  background: #edf2ef;
  color: #5a7268;
}

.tt-process-step--done .tt-process-step__node {
  background: #e4f4ec;
  color: #117b63;
}

.tt-process-step--active .tt-process-step__node {
  background: #fff3e2;
  color: #b66c20;
}

.tt-process-step--error .tt-process-step__node {
  background: #fdecec;
  color: #b9382c;
}

.tt-process-step--skipped .tt-process-step__node {
  background: #f1f3f2;
  color: #7c8b85;
}

.v-theme--dark .tt-process-step__node {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.72);
}

.v-theme--dark .tt-process-step--done .tt-process-step__node {
  background: rgba(17, 123, 99, 0.28);
  color: #6ee7b7;
}

.v-theme--dark .tt-process-step--active .tt-process-step__node {
  background: rgba(182, 108, 32, 0.28);
  color: #fcd34d;
}

.v-theme--dark .tt-process-step--error .tt-process-step__node {
  background: rgba(220, 38, 38, 0.26);
  color: #fca5a5;
}

.tt-process-step__connector {
  flex: 1;
  height: 3px;
  border-radius: 999px;
  background: #dfe8e4;
}

.tt-process-step__connector--done {
  background: #218268;
}

.tt-process-step__connector--error {
  background: #d65a4f;
}

.v-theme--dark .tt-process-step__connector {
  background: rgba(255, 255, 255, 0.12);
}

.v-theme--dark .tt-process-step__connector--done {
  background: #34d399;
}

.v-theme--dark .tt-process-step__connector--error {
  background: #f87171;
}

.tt-process-step__body {
  min-width: 0;
}

.tt-process-step__top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 6px;
  flex-wrap: wrap;
  margin-bottom: 4px;
}

.tt-process-step__num {
  font-size: 11px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--v-theme-on-surface), 0.56);
}

.tt-process-step__badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: 999px;
  background: #eef3f0;
  color: #4f645e;
}

.tt-process-step--done .tt-process-step__badge {
  background: #e4f4ec;
  color: #117b63;
}

.tt-process-step--active .tt-process-step__badge {
  background: #fff3e2;
  color: #a76c21;
}

.tt-process-step--error .tt-process-step__badge {
  background: #fdecec;
  color: #ad4b3b;
}

.v-theme--dark .tt-process-step__badge {
  background: rgba(255, 255, 255, 0.08);
  color: rgba(255, 255, 255, 0.78);
}

.v-theme--dark .tt-process-step--done .tt-process-step__badge {
  background: rgba(17, 123, 99, 0.25);
  color: #6ee7b7;
}

.v-theme--dark .tt-process-step--active .tt-process-step__badge {
  background: rgba(182, 108, 32, 0.26);
  color: #fcd34d;
}

.v-theme--dark .tt-process-step--error .tt-process-step__badge {
  background: rgba(220, 38, 38, 0.24);
  color: #fca5a5;
}

.tt-process-step__title {
  font-size: 14px;
  font-weight: 800;
  line-height: 1.3;
  color: rgb(var(--v-theme-on-surface));
  margin: 0 0 6px;
}

.tt-process-step__meta {
  display: flex;
  align-items: center;
  font-size: 12px;
  font-weight: 600;
  color: rgba(var(--v-theme-on-surface), 0.74);
  margin: 0 0 2px;
  word-break: break-word;
}

.tt-process-step__detail {
  font-size: 12px;
  color: rgba(var(--v-theme-on-surface), 0.58);
  margin: 0;
  line-height: 1.35;
}

.tt-next-step {
  margin-top: 14px;
  padding: 12px 14px;
  border-radius: 10px;
  border: 1px solid #dfe8e4;
  background: rgb(var(--v-theme-surface));
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.tt-next-step--warning {
  border-color: rgba(208, 131, 40, 0.36);
  background: #fffaf3;
}

.tt-next-step--info {
  border-color: rgba(44, 111, 163, 0.32);
  background: #f4f9fd;
}

.tt-next-step--success {
  border-color: rgba(17, 123, 99, 0.32);
  background: #f2fbf6;
}

.tt-next-step--error {
  border-color: rgba(185, 56, 44, 0.32);
  background: #fff6f5;
}

.v-theme--dark .tt-next-step--warning {
  background: rgba(208, 131, 40, 0.12);
  border-color: rgba(251, 191, 36, 0.28);
}

.v-theme--dark .tt-next-step--info {
  background: rgba(44, 111, 163, 0.15);
  border-color: rgba(147, 197, 253, 0.28);
}

.v-theme--dark .tt-next-step--success {
  background: rgba(17, 123, 99, 0.16);
  border-color: rgba(52, 211, 153, 0.28);
}

.v-theme--dark .tt-next-step--error {
  background: rgba(220, 38, 38, 0.14);
  border-color: rgba(248, 113, 113, 0.28);
}

.tt-next-step__content {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  flex: 1 1 260px;
  min-width: 0;
}

.tt-next-step__icon {
  margin-top: 2px;
  flex-shrink: 0;
}

.tt-next-step--warning .tt-next-step__icon {
  color: #b66c20;
}

.tt-next-step--info .tt-next-step__icon {
  color: #2c6fa3;
}

.tt-next-step--success .tt-next-step__icon {
  color: #117b63;
}

.tt-next-step--error .tt-next-step__icon {
  color: #b9382c;
}

.v-theme--dark .tt-next-step--warning .tt-next-step__icon {
  color: #fcd34d;
}

.v-theme--dark .tt-next-step--info .tt-next-step__icon {
  color: #93c5fd;
}

.v-theme--dark .tt-next-step--success .tt-next-step__icon {
  color: #6ee7b7;
}

.v-theme--dark .tt-next-step--error .tt-next-step__icon {
  color: #fca5a5;
}

.tt-next-step__title {
  display: block;
  font-size: 13.5px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
}

.tt-next-step__desc {
  font-size: 12.5px;
  color: rgba(var(--v-theme-on-surface), 0.72);
  margin-top: 2px;
}

.tt-next-step__actions {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

@media (max-width: 959px) {
  .tt-process-flow {
    grid-template-columns: 1fr;
    gap: 10px;
  }

  .tt-process-step {
    flex-direction: row;
    align-items: flex-start;
  }

  .tt-process-step__rail {
    flex-direction: column;
    align-self: stretch;
    gap: 6px;
  }

  .tt-process-step__connector {
    width: 3px;
    height: auto;
    min-height: 18px;
  }
}
</style>
