<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import { requiredValidator } from '@core/utils/validators'
import type { SolicitudVacante } from '@/types/reclutamiento'
import { nombreCompletoPersona } from '@/utils/reclutamientoUx'

const props = withDefaults(defineProps<{
  modelValue: boolean
  solicitud: SolicitudVacante | null
  modoInicial?: 'detalle' | 'resolver'
}>(), {
  modoInicial: 'detalle',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'resuelta', solicitud: SolicitudVacante): void
  (e: 'abrirCrearVacante', solicitud: SolicitudVacante): void
}>()

const { post } = useClienteRequest()
const { showToastSuccess } = useToast()
const puedeResolverSolicitud = usePuedeResolverSolicitud()

const abierto = computed({
  get: () => props.modelValue,
  set: valor => emit('update:modelValue', valor),
})

const form = ref<{ validate: () => Promise<{ valid: boolean }>; resetValidation: () => void } | null>(null)
const observaciones = ref('')
const resolviendo = ref(false)
const decisionActiva = ref<'Aprobada' | 'Rechazada' | null>(null)
const errorResolucion = ref<string | null>(null)

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

const puedeResolver = computed(() => puedeResolverSolicitud(props.solicitud))

const puedeCrearVacante = computed(() =>
  props.solicitud?.estado === 'Aprobada'
  && !props.solicitud?.vacante
  && can('crear vacantes', 'Vacante'),
)

const validarObservaciones = (value: unknown) => {
  const texto = String(value ?? '').trim()
  if (!texto.length)
    return 'Debe ingresar la justificación u observaciones de la resolución'
  if (texto.length > 10000)
    return 'Las observaciones no deben superar los 10,000 caracteres'

  return true
}

const reiniciarFormulario = () => {
  observaciones.value = ''
  errorResolucion.value = null
  decisionActiva.value = null
  nextTick(() => {
    form.value?.resetValidation()
  })
}

watch(abierto, valor => {
  if (valor)
    reiniciarFormulario()
})

watch(() => props.solicitud?.id, () => {
  reiniciarFormulario()
})

const resolverSolicitud = async (estado: 'Aprobada' | 'Rechazada') => {
  if (!props.solicitud || resolviendo.value)
    return

  errorResolucion.value = null

  const resultado = await form.value?.validate()
  if (!resultado?.valid)
    return

  resolviendo.value = true
  decisionActiva.value = estado
  try {
    const respuesta = await post<{ data: SolicitudVacante; message: string }>(
      `/api/solicitudes-vacante/${props.solicitud.id}/resolver`,
      {
        estado,
        observaciones: observaciones.value.trim(),
      },
    )

    showToastSuccess(respuesta.message || `Solicitud ${estado.toLowerCase()} con éxito.`)
    emit('resuelta', respuesta.data)
    abierto.value = false
  }
  catch (error: any) {
    errorResolucion.value = error?.response?.data?.message || 'No fue posible registrar la resolución de la solicitud.'
    manejaError(error)
  }
  finally {
    resolviendo.value = false
    decisionActiva.value = null
  }
}

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
</script>

<template>
  <VDialog
    v-model="abierto"
    max-width="760"
    scrollable
  >
    <VCard
      v-if="solicitud"
      class="tt-panel"
    >
      <div class="d-flex justify-space-between align-start gap-3 pa-5 pb-4">
        <div>
          <span class="tt-eyebrow">
            SOLICITUD #{{ solicitud.id }} · {{ solicitud.motivo }}
          </span>
          <h3 class="text-h5 font-weight-bold mt-1 mb-0">
            {{ solicitud.puesto?.nombre || `Puesto #${solicitud.puesto_id}` }}
          </h3>
          <p class="text-body-2 text-medium-emphasis mb-0 mt-1">
            {{ solicitud.unidad?.nombre || `Unidad #${solicitud.unidad_id}` }}
          </p>
        </div>

        <div class="d-flex align-center gap-2">
          <VChip
            :color="coloresEstado[solicitud.estado] || 'secondary'"
            :prepend-icon="iconosEstado[solicitud.estado]"
            variant="tonal"
            size="small"
            class="font-weight-bold"
          >
            {{ solicitud.estado }}
          </VChip>
          <VBtn
            icon="tabler-x"
            variant="tonal"
            color="secondary"
            size="small"
            :disabled="resolviendo"
            @click="abierto = false"
          />
        </div>
      </div>

      <VDivider />

      <VCardText class="pa-5">
        <!-- Indicador visual del flujo -->
        <div class="tt-flow-steps mb-5">
          <div class="tt-flow-step tt-flow-step--done">
            <VIcon
              icon="tabler-file-description"
              size="15"
            />
            <span>1. Solicitud registrada</span>
          </div>
          <VIcon
            icon="tabler-arrow-right"
            size="15"
            class="text-disabled"
          />
          <div
            class="tt-flow-step"
            :class="{
              'tt-flow-step--active': solicitud.estado === 'Pendiente',
              'tt-flow-step--done': solicitud.estado === 'Aprobada',
              'tt-flow-step--error': solicitud.estado === 'Rechazada',
            }"
          >
            <VIcon
              :icon="solicitud.estado === 'Rechazada' ? 'tabler-circle-x' : 'tabler-shield-check'"
              size="15"
            />
            <span>2. {{ solicitud.estado === 'Pendiente' ? 'Pendiente de aprobación' : solicitud.estado }}</span>
          </div>
          <VIcon
            icon="tabler-arrow-right"
            size="15"
            class="text-disabled"
          />
          <div
            class="tt-flow-step"
            :class="{
              'tt-flow-step--done': Boolean(solicitud.vacante),
              'tt-flow-step--active': solicitud.estado === 'Aprobada' && !solicitud.vacante,
            }"
          >
            <VIcon
              icon="tabler-briefcase"
              size="15"
            />
            <span>3. {{ solicitud.vacante ? `Vacante #${solicitud.vacante.id}` : 'Creación de vacante' }}</span>
          </div>
        </div>

        <!-- Resumen estructurado -->
        <VRow
          dense
          class="mb-4"
        >
          <VCol
            cols="12"
            sm="4"
          >
            <div class="tt-detail-box">
              <span>Plazas solicitadas</span>
              <strong>{{ solicitud.numero_plazas }} {{ Number(solicitud.numero_plazas) === 1 ? 'plaza' : 'plazas' }}</strong>
            </div>
          </VCol>
          <VCol
            cols="12"
            sm="4"
          >
            <div class="tt-detail-box">
              <span>Solicitante</span>
              <strong>{{ nombreCompletoPersona(solicitud.solicitante) }}</strong>
            </div>
          </VCol>
          <VCol
            cols="12"
            sm="4"
          >
            <div class="tt-detail-box">
              <span>Fecha de solicitud</span>
              <strong>{{ formatearFechaSegura(solicitud.created_at) }}</strong>
            </div>
          </VCol>
        </VRow>

        <!-- Justificación del requerimiento -->
        <div class="tt-detail-box mb-4">
          <span>Justificación del requerimiento</span>
          <p class="text-body-2 mt-2 mb-0 pre-line">
            {{ solicitud.justificacion }}
          </p>
        </div>

        <!-- Resolución existente -->
        <div
          v-if="solicitud.estado !== 'Pendiente'"
          class="tt-detail-box mb-4"
        >
          <div class="d-flex flex-wrap justify-space-between align-center gap-2 mb-2">
            <span>Resolución gerencial ({{ solicitud.estado }})</span>
            <small class="text-medium-emphasis">
              {{ nombreCompletoPersona(solicitud.aprobador) }} · {{ formatearFechaSegura(solicitud.fecha_resolucion) }}
            </small>
          </div>
          <p class="text-body-2 mb-0 pre-line">
            {{ solicitud.observaciones || 'Sin observaciones registradas.' }}
          </p>
        </div>

        <!-- Vacante vinculada -->
        <VAlert
          v-if="solicitud.vacante"
          type="success"
          variant="tonal"
          class="mb-4"
        >
          <div class="d-flex flex-wrap align-center justify-space-between gap-2">
            <div>
              <strong>Vacante vinculada #{{ solicitud.vacante.id }}</strong>
              <div class="text-caption">
                Estado: {{ solicitud.vacante.estado }}
                <span v-if="solicitud.vacante.fecha_apertura"> · Apertura: {{ formatearFecha(solicitud.vacante.fecha_apertura) }}</span>
              </div>
            </div>
            <VBtn
              v-if="can('ver vacantes', 'Vacante')"
              size="small"
              color="success"
              variant="flat"
              prepend-icon="tabler-external-link"
              :to="`/admin/vacantes/show/${solicitud.vacante.id}`"
              @click="abierto = false"
            >
              Ir a la vacante
            </VBtn>
          </div>
        </VAlert>

        <!-- Formulario de Aprobación / Rechazo -->
        <section
          v-if="puedeResolver"
          class="tt-resolution-box mt-4"
        >
          <div class="d-flex align-center justify-space-between gap-2 mb-3">
            <div>
              <span class="tt-eyebrow">APROBACIÓN GERENCIAL</span>
              <h4 class="text-subtitle-1 font-weight-bold mb-0">
                Registrar resolución de solicitud
              </h4>
            </div>
            <VChip
              size="x-small"
              color="warning"
              variant="tonal"
            >
              Justificación obligatoria
            </VChip>
          </div>

          <VAlert
            v-if="errorResolucion"
            type="error"
            variant="tonal"
            class="mb-3"
          >
            {{ errorResolucion }}
          </VAlert>

          <VForm ref="form">
            <AppTextarea
              v-model="observaciones"
              label="Observaciones / Justificación de la resolución *"
              placeholder="Indique los motivos de autorización presupuestal, condiciones o razones del rechazo..."
              rows="3"
              counter="10000"
              :disabled="resolviendo"
              :rules="[requiredValidator, validarObservaciones]"
            />

            <div class="d-flex flex-wrap gap-3 mt-4">
              <VBtn
                color="success"
                prepend-icon="tabler-check"
                :loading="resolviendo && decisionActiva === 'Aprobada'"
                :disabled="resolviendo"
                @click="resolverSolicitud('Aprobada')"
              >
                Aprobar solicitud
              </VBtn>
              <VBtn
                color="error"
                variant="tonal"
                prepend-icon="tabler-x"
                :loading="resolviendo && decisionActiva === 'Rechazada'"
                :disabled="resolviendo"
                @click="resolverSolicitud('Rechazada')"
              >
                Rechazar solicitud
              </VBtn>
            </div>
          </VForm>
        </section>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4 d-flex flex-wrap justify-space-between gap-2">
        <VBtn
          variant="text"
          color="secondary"
          prepend-icon="tabler-arrow-up-right"
          :to="`/admin/solicitudes-vacante/show/${solicitud.id}`"
          @click="abierto = false"
        >
          Abrir ficha completa
        </VBtn>

        <div class="d-flex flex-wrap gap-2">
          <VBtn
            v-if="puedeCrearVacante"
            color="primary"
            prepend-icon="tabler-briefcase-2"
            @click="emit('abrirCrearVacante', solicitud)"
          >
            Crear vacante oficial
          </VBtn>
          <VBtn
            variant="tonal"
            color="secondary"
            :disabled="resolviendo"
            @click="abierto = false"
          >
            Cerrar
          </VBtn>
        </div>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
@import "@styles/reclutamiento-talent.scss";

.pre-line {
  white-space: pre-line;
}

.tt-flow-steps {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 8px;
}

.tt-flow-step {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 11px;
  border-radius: 8px;
  font-size: 12px;
  font-weight: 700;
  background: #f2f7f4;
  color: #5a7268;
}

.tt-flow-step--done {
  background: #e8f5ee;
  color: #117b63;
}

.tt-flow-step--active {
  background: #fff4e5;
  color: #a76c21;
}

.tt-flow-step--error {
  background: #fff0ed;
  color: #ad4b3b;
}

.v-theme--dark .tt-flow-step {
  background: rgba(255, 255, 255, 0.06);
  color: rgba(255, 255, 255, 0.72);
}

.v-theme--dark .tt-flow-step--done {
  background: rgba(17, 123, 99, 0.24);
  color: #6ee7b7;
}

.v-theme--dark .tt-flow-step--active {
  background: rgba(182, 108, 32, 0.25);
  color: #fcd34d;
}

.v-theme--dark .tt-flow-step--error {
  background: rgba(220, 38, 38, 0.22);
  color: #fca5a5;
}

.tt-resolution-box {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(33, 130, 104, 0.22);
  background: rgba(33, 130, 104, 0.04);
}
</style>
