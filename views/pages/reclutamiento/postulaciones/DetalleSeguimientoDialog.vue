<script setup lang="ts">
import { useAbility } from '@casl/vue'
import type { Entrevista, EstadoPostulacion, EtapaReclutamiento, Postulacion } from '@/types/reclutamiento'
import EntrevistasPostulacionPanel from '@/views/pages/reclutamiento/entrevistas/EntrevistasPostulacionPanel.vue'
import HistorialPostulacion from '@/views/pages/reclutamiento/postulaciones/HistorialPostulacion.vue'
import {
  UMBRAL_DIAS_ATENCION,
  colorPuntoEtapa,
  diasSinActualizar,
  etiquetaDiasSinActualizar,
  inicialesPersona,
  nombreCompletoPersona,
  obtenerEtapaNombre,
  obtenerEtapaPostulacion,
  proximaAccionSugerida,
} from '@/utils/reclutamientoUx'

const props = withDefaults(defineProps<{
  modelValue: boolean
  postulacion: Postulacion | null
  etapas?: EtapaReclutamiento[]
  seccionInicial?: 'seguimiento' | 'entrevistas'
}>(), {
  seccionInicial: 'seguimiento',
})

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'actualizado', postulacion: Postulacion): void
  (e: 'entrevistaActualizada', entrevista: Entrevista): void
}>()

const { get, put } = useClienteRequest()
const { showToastSuccess } = useToast()
const ability = useAbility()
const can = (action: string, subject: string) => ability.can(action, subject)

const abierto = computed({
  get: () => props.modelValue,
  set: valor => emit('update:modelValue', valor),
})

const puedeVerEntrevistas = computed(() => can('ver entrevistas', 'Entrevista'))
const tabActiva = ref<'seguimiento' | 'entrevistas' | 'historial'>('seguimiento')

const catalogoEtapas = ref<EtapaReclutamiento[]>([])
const mostrarCambioRapido = ref(false)
const guardando = ref(false)
const refreshHistorial = ref(0)
const refreshEntrevistas = ref(0)

const resolverTabInicial = () => {
  if (props.seccionInicial === 'entrevistas' && puedeVerEntrevistas.value)
    return 'entrevistas'

  return 'seguimiento'
}

const formMovimiento = reactive<{
  etapa_reclutamiento_id: number | null
  estado: EstadoPostulacion
  observacion_movimiento: string
}>({
  etapa_reclutamiento_id: null,
  estado: 'En proceso',
  observacion_movimiento: '',
})

const etapasDisponibles = computed(() => {
  const fuente = props.etapas?.length ? props.etapas : catalogoEtapas.value

  return [...fuente].sort((a, b) => (a.orden ?? a.id) - (b.orden ?? b.id))
})

const sincronizarFormulario = () => {
  if (!props.postulacion)
    return

  const etapaActual = obtenerEtapaPostulacion(props.postulacion)

  formMovimiento.etapa_reclutamiento_id = props.postulacion.etapa_reclutamiento_id ?? etapaActual?.id ?? null
  formMovimiento.estado = props.postulacion.estado
  formMovimiento.observacion_movimiento = ''
  mostrarCambioRapido.value = false
}

watch(() => props.postulacion?.id, () => {
  sincronizarFormulario()
  tabActiva.value = resolverTabInicial()
})

watch(() => props.postulacion, sincronizarFormulario, { immediate: true })

watch(abierto, async valor => {
  if (!valor)
    return

  sincronizarFormulario()
  tabActiva.value = resolverTabInicial()
  refreshEntrevistas.value += 1
  if (!props.etapas?.length && !catalogoEtapas.value.length) {
    try {
      const resp = await get<any>('/api/catalogo/etapas-reclutamiento?limit=100')

      catalogoEtapas.value = Array.isArray(resp.data) ? resp.data : (resp.data?.data || [])
    }
    catch (error) {
      manejaError(error)
    }
  }
})

const alActualizarEntrevista = (entrevista: Entrevista) => {
  emit('entrevistaActualizada', entrevista)
}

const dias = computed(() => diasSinActualizar(props.postulacion))
const etapaNombre = computed(() => obtenerEtapaNombre(props.postulacion))
const alertaSeguimiento = computed(() => props.postulacion?.estado === 'En proceso' && dias.value >= UMBRAL_DIAS_ATENCION)

const siguienteEtapa = computed(() => {
  if (!props.postulacion || props.postulacion.estado !== 'En proceso')
    return null

  const actualId = props.postulacion.etapa_reclutamiento_id ?? obtenerEtapaPostulacion(props.postulacion)?.id
  const activas = etapasDisponibles.value.filter(e => !e.nombre.toLowerCase().includes('descart'))
  const idx = activas.findIndex(e => e.id === actualId)
  if (idx === -1 || idx >= activas.length - 1)
    return null

  return activas[idx + 1]
})

const hayCambioSeleccionado = computed(() => {
  if (!props.postulacion)
    return false

  const etapaOriginal = props.postulacion.etapa_reclutamiento_id ?? obtenerEtapaPostulacion(props.postulacion)?.id ?? null

  return Number(formMovimiento.etapa_reclutamiento_id) !== Number(etapaOriginal)
    || formMovimiento.estado !== props.postulacion.estado
})

const prepararAvanceRapido = () => {
  if (!siguienteEtapa.value)
    return

  formMovimiento.etapa_reclutamiento_id = siguienteEtapa.value.id
  if (siguienteEtapa.value.nombre.toLowerCase().includes('contrat'))
    formMovimiento.estado = 'Contratada'

  mostrarCambioRapido.value = true
}

const aplicarActualizacion = async () => {
  if (!props.postulacion || !hayCambioSeleccionado.value || guardando.value)
    return

  guardando.value = true
  try {
    const nota = formMovimiento.observacion_movimiento.trim()

    const payload: Record<string, any> = {
      etapa_reclutamiento_id: formMovimiento.etapa_reclutamiento_id,
      estado: formMovimiento.estado,
      ...(nota ? { observacion_movimiento: nota } : {}),
    }

    const respuesta = await put<{ data: Postulacion; message: string }>(`/api/postulaciones/${props.postulacion.id}`, payload)

    showToastSuccess(respuesta.message || 'Seguimiento actualizado con éxito.')
    refreshHistorial.value += 1
    mostrarCambioRapido.value = false
    formMovimiento.observacion_movimiento = ''
    emit('actualizado', respuesta.data)
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    guardando.value = false
  }
}

const coloresEstado: Record<string, string> = {
  'En proceso': 'success',
  'Contratada': 'info',
  'Descartada': 'error',
  'Retirada': 'secondary',
}
</script>

<template>
  <VDialog
    v-model="abierto"
    max-width="820"
    scrollable
  >
    <VCard
      v-if="postulacion"
      class="tt-panel"
    >
      <!-- Cabecera estilo maqueta-talento-humano.html -->
      <div class="d-flex justify-space-between align-start pa-5 pb-4">
        <div>
          <span class="tt-eyebrow">DETALLE DE POSTULACIÓN · #{{ postulacion.id }}</span>
          <h2 class="text-h5 font-weight-bold mt-1 mb-0">
            Seguimiento del candidato
          </h2>
        </div>
        <VBtn
          icon="tabler-x"
          variant="tonal"
          color="secondary"
          size="small"
          @click="abierto = false"
        />
      </div>

      <VDivider />

      <VCardText class="pa-5">
        <!-- Perfil del candidato -->
        <div class="d-flex flex-wrap align-center justify-space-between gap-3 mb-4">
          <div class="d-flex align-center gap-3">
            <div class="tt-avatar tt-avatar--lg">
              {{ inicialesPersona(postulacion.candidato?.nombres, postulacion.candidato?.apellidos) }}
            </div>
            <div>
              <div class="d-flex align-center flex-wrap gap-2">
                <h3 class="text-h6 font-weight-bold mb-0">
                  {{ nombreCompletoPersona(postulacion.candidato) }}
                </h3>
                <VChip
                  size="x-small"
                  :color="coloresEstado[postulacion.estado] || 'secondary'"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ postulacion.estado }}
                </VChip>
              </div>
              <p class="text-body-2 text-medium-emphasis mb-0 mt-1">
                <strong>{{ postulacion.vacante?.puesto?.nombre || `Vacante #${postulacion.vacante_id}` }}</strong>
                <template v-if="postulacion.vacante?.unidad?.nombre">
                  · {{ postulacion.vacante.unidad.nombre }}
                </template>
              </p>
              <p
                v-if="postulacion.candidato?.correo || postulacion.candidato?.telefono"
                class="text-caption text-disabled mb-0 mt-1"
              >
                {{ postulacion.candidato?.correo }}
                <template v-if="postulacion.candidato?.telefono">
                  · {{ postulacion.candidato.telefono }}
                </template>
              </p>
            </div>
          </div>

          <div class="d-flex flex-wrap gap-2">
            <VBtn
              v-if="postulacion.candidato_id && can('ver candidatos', 'Candidato')"
              size="small"
              variant="tonal"
              color="secondary"
              prepend-icon="tabler-id"
              :to="`/admin/candidatos/show/${postulacion.candidato_id}`"
            >
              Ver expediente
            </VBtn>
            <VBtn
              v-if="can('editar postulaciones', 'Postulacion')"
              size="small"
              variant="outlined"
              color="primary"
              prepend-icon="tabler-edit"
              :to="`/admin/postulaciones/edit/${postulacion.id}`"
            >
              Editar ficha
            </VBtn>
          </div>
        </div>

        <!-- Navegación interna del diálogo -->
        <VTabs
          v-model="tabActiva"
          density="compact"
          color="primary"
          class="mb-4 seguimiento-tabs"
        >
          <VTab
            value="seguimiento"
            prepend-icon="tabler-git-branch"
          >
            Seguimiento
          </VTab>
          <VTab
            v-if="puedeVerEntrevistas"
            value="entrevistas"
            prepend-icon="tabler-calendar-event"
          >
            Entrevistas
          </VTab>
          <VTab
            v-if="can('ver postulaciones', 'Postulacion')"
            value="historial"
            prepend-icon="tabler-history"
          >
            Historial
          </VTab>
        </VTabs>

        <!-- Pestaña 1: Seguimiento y cambio manual de etapa -->
        <div v-if="tabActiva === 'seguimiento'">
          <!-- Alerta ámbar si lleva >= 5 días sin actualizar -->
          <div
            v-if="alertaSeguimiento"
            class="tt-alert-card d-flex align-center justify-space-between flex-wrap gap-2 mb-4"
          >
            <div class="d-flex align-center gap-2">
              <VIcon
                icon="tabler-clock-exclamation"
                color="warning"
                size="20"
              />
              <span class="text-body-2">
                <strong>Atención prioritaria:</strong> este proceso acumula <strong>{{ dias }} días</strong> sin actualización.
              </span>
            </div>
            <VBtn
              v-if="can('editar postulaciones', 'Postulacion') && !mostrarCambioRapido"
              size="x-small"
              color="warning"
              variant="tonal"
              @click="mostrarCambioRapido = true"
            >
              Registrar avance
            </VBtn>
          </div>

          <!-- Grid de 4 bloques idéntico a maqueta-talento-humano.html -->
          <VRow
            dense
            class="mb-3"
          >
            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Etapa actual</span>
                <strong class="d-flex align-center gap-2">
                  <i
                    class="tt-dot"
                    :style="{ backgroundColor: colorPuntoEtapa(etapaNombre) }"
                  />
                  {{ etapaNombre }}
                </strong>
              </div>
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Sin actualización</span>
                <strong :class="{ 'text-warning': alertaSeguimiento }">
                  {{ etiquetaDiasSinActualizar(dias) }}
                </strong>
              </div>
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Responsable asignado</span>
                <strong>{{ nombreCompletoPersona(postulacion.responsable) }}</strong>
              </div>
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Fecha de postulación</span>
                <strong>{{ formatearFecha(postulacion.fecha_postulacion) }}</strong>
              </div>
            </VCol>

            <VCol cols="12">
              <div class="tt-detail-box">
                <span>Próxima acción sugerida</span>
                <strong>{{ proximaAccionSugerida(etapaNombre, postulacion.estado) }}</strong>
              </div>
            </VCol>

            <VCol
              v-if="postulacion.observaciones"
              cols="12"
            >
              <div class="tt-detail-box">
                <span>Observaciones generales</span>
                <strong class="font-weight-regular">{{ postulacion.observaciones }}</strong>
              </div>
            </VCol>
          </VRow>

          <!-- Barra de acción rápida de seguimiento -->
          <div
            v-if="can('editar postulaciones', 'Postulacion')"
            class="mt-3"
          >
            <div
              v-if="!mostrarCambioRapido"
              class="d-flex flex-wrap gap-2"
            >
              <VBtn
                v-if="siguienteEtapa"
                color="success"
                size="small"
                prepend-icon="tabler-arrow-right"
                @click="prepararAvanceRapido"
              >
                Avanzar a {{ siguienteEtapa.nombre }}
              </VBtn>
              <VBtn
                color="primary"
                variant="tonal"
                size="small"
                prepend-icon="tabler-git-branch"
                @click="mostrarCambioRapido = true"
              >
                Cambiar etapa o estado
              </VBtn>
            </div>

            <VExpandTransition>
              <div
                v-if="mostrarCambioRapido"
                class="tt-detail-box mt-2"
              >
                <div class="d-flex justify-space-between align-center mb-3">
                  <strong class="mt-0">Actualizar etapa o estado del proceso</strong>
                  <VBtn
                    size="x-small"
                    variant="text"
                    color="secondary"
                    @click="sincronizarFormulario"
                  >
                    Cancelar
                  </VBtn>
                </div>
                <VRow dense>
                  <VCol
                    cols="12"
                    sm="7"
                  >
                    <AppSelect
                      v-model="formMovimiento.etapa_reclutamiento_id"
                      label="Nueva etapa"
                      :items="etapasDisponibles"
                      item-title="nombre"
                      item-value="id"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    sm="5"
                  >
                    <AppSelect
                      v-model="formMovimiento.estado"
                      label="Estado"
                      :items="['En proceso', 'Contratada', 'Descartada', 'Retirada']"
                    />
                  </VCol>
                  <VCol cols="12">
                    <AppTextarea
                      v-model="formMovimiento.observacion_movimiento"
                      label="Acuerdo o nota del movimiento (opcional)"
                      placeholder="Ej. Entrevista completada satisfactoriamente; pasa a validación técnica."
                      rows="2"
                      :counter="2000"
                    />
                  </VCol>
                  <VCol
                    cols="12"
                    class="d-flex justify-end gap-2 mt-1"
                  >
                    <VBtn
                      size="small"
                      color="success"
                      prepend-icon="tabler-check"
                      :disabled="!hayCambioSeleccionado"
                      :loading="guardando"
                      @click="aplicarActualizacion"
                    >
                      Guardar movimiento
                    </VBtn>
                  </VCol>
                </VRow>
              </div>
            </VExpandTransition>
          </div>
        </div>

        <!-- Pestaña 2: Centro de entrevistas -->
        <EntrevistasPostulacionPanel
          v-else-if="tabActiva === 'entrevistas' && abierto && puedeVerEntrevistas"
          :postulacion-id="postulacion.id"
          :etapa-nombre="etapaNombre"
          :refresh-key="refreshEntrevistas"
          @entrevista-actualizada="alActualizarEntrevista"
        />

        <!-- Pestaña 3: Historial de movimientos integrado -->
        <HistorialPostulacion
          v-else-if="tabActiva === 'historial' && abierto && can('ver postulaciones', 'Postulacion')"
          :postulacion-id="postulacion.id"
          :refresh-key="refreshHistorial"
        />
      </VCardText>

      <VDivider />
      <VCardActions class="pa-4 justify-end">
        <VBtn
          color="secondary"
          variant="tonal"
          @click="abierto = false"
        >
          Cerrar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
@import '@styles/reclutamiento-talent.scss';

.seguimiento-tabs {
  border-bottom: 1px solid rgba(var(--v-theme-on-surface), 0.08);
}
</style>
