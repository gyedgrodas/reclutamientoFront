<script setup lang="ts">
import { useAbility } from '@casl/vue'
import type { Candidato, ChecklistContratacion, Postulacion } from '@/types/reclutamiento'
import { extraerMensajeErrorApi, formatearFechaHoraGuatemala } from '@/utils/entrevistasGuatemala'

const props = withDefaults(defineProps<{
  postulacion: Postulacion
  refreshKey?: number
}>(), {
  refreshKey: 0,
})

const emit = defineEmits<{ (e: 'actualizado', postulacion: Postulacion): void }>()
const { get, post } = useClienteRequest()
const { showToastSuccess } = useToast()
const ability = useAbility()
const puedeEditar = computed(() => ability.can('editar postulaciones', 'Postulacion'))
const puedeVerCandidato = computed(() => ability.can('ver candidatos', 'Candidato'))
const checklist = ref<ChecklistContratacion | null>(null)
const candidato = ref<Candidato | null>(null)
const cargando = ref(false)
const guardando = ref(false)
const error = ref<string | null>(null)
const errorDocumentos = ref<string | null>(null)
const fechaIngreso = ref('')
const fechaEditadaManualmente = ref(false)
const observaciones = ref('')
const confirmar = ref(false)

let solicitud: AbortController | undefined

const colecciones = [
  { nombre: 'Currículum', clave: 'curriculum' },
  { nombre: 'DPI', clave: 'dpi' },
  { nombre: 'Títulos académicos', clave: 'titulos_academicos' },
  { nombre: 'Otros documentos', clave: 'otros_documentos' },
]

const documentos = computed(() => colecciones.map(coleccion => ({
  ...coleccion,
  cantidad: candidato.value?.media?.filter(archivo => archivo.collection_name === coleccion.clave).length ?? 0,
})))

const contratada = computed(() => props.postulacion.estado === 'Contratada' || !!checklist.value?.contratacion?.confirmada_at)
const puedeConfirmar = computed(() => puedeEditar.value && checklist.value?.puede_confirmar === true && !contratada.value && !cargando.value)

const cargar = async () => {
  solicitud?.abort()

  const controlador = new AbortController()
  const { signal } = controlador

  solicitud = controlador
  cargando.value = true
  error.value = null
  errorDocumentos.value = null
  checklist.value = null
  candidato.value = null
  try {
    const respuesta = await get<{ data: ChecklistContratacion }>(`/api/postulaciones/${props.postulacion.id}/contratacion`, { signal })
    if (signal.aborted)
      return
    if (!respuesta.data || !Array.isArray(respuesta.data.bloqueos)) {
      error.value = 'El resumen de contratación no tiene el formato esperado.'

      return
    }

    checklist.value = respuesta.data
    if (respuesta.data.contratacion?.fecha_ingreso) {
      fechaIngreso.value = respuesta.data.contratacion.fecha_ingreso.slice(0, 10)
      fechaEditadaManualmente.value = false
    }
    else if (!fechaEditadaManualmente.value || !fechaIngreso.value) {
      fechaIngreso.value = respuesta.data.fecha_ingreso_propuesta?.slice(0, 10) || ''
    }
  }
  catch (err) {
    if (!signal.aborted)
      error.value = extraerMensajeErrorApi(err, 'No fue posible consultar los requisitos de contratación.')
  }
  finally {
    if (!signal.aborted)
      cargando.value = false
  }

  if (!puedeVerCandidato.value || signal.aborted)
    return
  try {
    const respuesta = await get<{ data: Candidato }>(`/api/candidatos/${props.postulacion.candidato_id}`, { signal })
    if (signal.aborted)
      return
    if (!respuesta.data?.id) {
      errorDocumentos.value = 'No fue posible obtener el expediente del candidato.'

      return
    }

    candidato.value = respuesta.data
  }
  catch (err) {
    if (!signal.aborted)
      errorDocumentos.value = extraerMensajeErrorApi(err, 'No fue posible consultar los documentos del candidato.')
  }
}

const confirmarContratacion = async () => {
  if (!puedeConfirmar.value || guardando.value)
    return
  if (!fechaIngreso.value) {
    error.value = 'Confirme la fecha de ingreso antes de contratar.'

    return
  }

  guardando.value = true
  error.value = null
  try {
    const respuesta = await post<{ data: Postulacion; message: string }>(`/api/postulaciones/${props.postulacion.id}/contratacion`, {
      fecha_ingreso: fechaIngreso.value,
      observaciones: observaciones.value.trim() || null,
    })

    if (!respuesta.data?.id) {
      confirmar.value = false
      await cargar()
      error.value = 'El servidor no confirmó la contratación. Revise el resumen antes de intentar otra vez.'

      return
    }

    confirmar.value = false
    showToastSuccess(respuesta.message)
    emit('actualizado', respuesta.data)
    await cargar()
  }
  catch (err) {
    error.value = extraerMensajeErrorApi(err, 'No fue posible confirmar la contratación.')
  }
  finally {
    guardando.value = false
  }
}

watch(() => props.postulacion.id, () => {
  fechaIngreso.value = ''
  fechaEditadaManualmente.value = false
  observaciones.value = ''
  candidato.value = null
  confirmar.value = false
  cargar()
}, { immediate: true })

watch(
  [
    () => props.refreshKey,
    () => props.postulacion.estado,
    () => props.postulacion.etapa_reclutamiento_id,
    () => props.postulacion.contratada_at,
  ],
  () => {
    cargar()
  },
)
onBeforeUnmount(() => solicitud?.abort())
</script>

<template>
  <div class="contratacion-panel">
    <!-- Encabezado con estado y acción -->
    <div class="d-flex flex-wrap justify-space-between align-center gap-2 mb-4">
      <div>
        <div class="d-flex align-center flex-wrap gap-2">
          <VIcon
            icon="tabler-user-check"
            size="22"
            color="primary"
          />
          <h3 class="text-subtitle-1 font-weight-bold mb-0">
            Cierre de contratación
          </h3>
          <VChip
            v-if="contratada"
            color="info"
            size="x-small"
            variant="tonal"
            class="font-weight-bold"
            prepend-icon="tabler-circle-check"
          >
            Contratada
          </VChip>
          <VChip
            v-else-if="puedeConfirmar"
            color="success"
            size="x-small"
            variant="tonal"
            class="font-weight-bold"
            prepend-icon="tabler-sparkles"
          >
            Listo para contratación
          </VChip>
          <VChip
            v-else-if="checklist?.bloqueos.length"
            color="warning"
            size="x-small"
            variant="tonal"
            class="font-weight-bold"
            prepend-icon="tabler-alert-triangle"
          >
            Requisitos pendientes
          </VChip>
        </div>
        <p class="text-caption text-medium-emphasis mb-0 mt-1">
          Formalización del ingreso del candidato seleccionado y asignación de plaza en la vacante.
        </p>
      </div>

      <VBtn
        variant="tonal"
        size="small"
        color="secondary"
        prepend-icon="tabler-refresh"
        :loading="cargando"
        :disabled="guardando"
        @click="cargar"
      >
        Actualizar
      </VBtn>
    </div>

    <VAlert
      v-if="error"
      type="error"
      variant="tonal"
      density="compact"
      class="mb-4"
    >
      {{ error }}
    </VAlert>

    <VProgressLinear
      v-if="cargando"
      indeterminate
      color="primary"
      class="mb-4"
    />

    <template v-if="checklist">
      <!-- Tarjeta ejecutiva si ya está contratada -->
      <div
        v-if="contratada"
        class="contratacion-completada-card mb-5"
      >
        <div class="d-flex align-start gap-3">
          <div class="tt-avatar tt-avatar--lg flex-shrink-0">
            <VIcon
              icon="tabler-user-check"
              size="26"
              color="success"
            />
          </div>
          <div class="flex-grow-1 min-w-0">
            <div class="d-flex flex-wrap align-center gap-2 mb-1">
              <h4 class="text-subtitle-1 font-weight-bold mb-0 text-success">
                Proceso de contratación finalizado
              </h4>
            </div>
            <p class="text-body-2 text-medium-emphasis mb-3">
              Esta postulación ha sido cerrada como Contratada. La plaza correspondiente ha sido ocupada en la vacante.
            </p>

            <VRow
              dense
              class="contratacion-metas"
            >
              <VCol
                v-if="checklist.contratacion?.fecha_ingreso"
                cols="12"
                sm="4"
              >
                <div class="meta-item">
                  <span class="meta-label">Fecha de ingreso</span>
                  <strong class="meta-value">{{ checklist.contratacion.fecha_ingreso.slice(0, 10) }}</strong>
                </div>
              </VCol>
              <VCol
                v-if="checklist.contratacion?.confirmada_at"
                cols="12"
                sm="4"
              >
                <div class="meta-item">
                  <span class="meta-label">Confirmación</span>
                  <strong class="meta-value">{{ formatearFechaHoraGuatemala(checklist.contratacion.confirmada_at) }}</strong>
                </div>
              </VCol>
              <VCol
                v-if="checklist.contratacion?.confirmada_por"
                cols="12"
                sm="4"
              >
                <div class="meta-item">
                  <span class="meta-label">Confirmado por</span>
                  <strong class="meta-value">{{ checklist.contratacion.confirmada_por.nombres }} {{ checklist.contratacion.confirmada_por.apellidos }}</strong>
                </div>
              </VCol>
              <VCol
                v-if="!checklist.contratacion?.confirmada_at"
                cols="12"
              >
                <span class="text-caption text-disabled">
                  * Registro anterior: contratación registrada previo al sistema de cierre auditado.
                </span>
              </VCol>
            </VRow>
          </div>
        </div>
      </div>

      <!-- Tarjetas de estado clave (Oferta y Capacidad) -->
      <VRow
        dense
        class="mb-4"
      >
        <VCol
          cols="12"
          sm="6"
        >
          <div class="tt-detail-box d-flex flex-column justify-space-between h-100">
            <div>
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-caption font-weight-bold text-uppercase">Oferta laboral</span>
                <VIcon
                  :icon="checklist.oferta_aceptada ? 'tabler-circle-check' : 'tabler-clock'"
                  :color="checklist.oferta_aceptada ? 'success' : 'warning'"
                  size="18"
                />
              </div>
              <strong
                class="text-body-1 font-weight-bold"
                :class="checklist.oferta_aceptada ? 'text-success' : 'text-warning'"
              >
                {{ checklist.oferta_aceptada ? 'Aceptada por el candidato' : 'Pendiente de aceptación' }}
              </strong>
            </div>
            <div class="text-caption text-medium-emphasis mt-2">
              <template v-if="checklist.fecha_ingreso_propuesta">
                Ingreso propuesto en oferta: <strong>{{ checklist.fecha_ingreso_propuesta.slice(0, 10) }}</strong>
              </template>
              <template v-else>
                Sin propuesta de ingreso registrada
              </template>
            </div>
          </div>
        </VCol>

        <VCol
          cols="12"
          sm="6"
        >
          <div class="tt-detail-box d-flex flex-column justify-space-between h-100">
            <div>
              <div class="d-flex justify-space-between align-center mb-1">
                <span class="text-caption font-weight-bold text-uppercase">
                  Plazas · Vacante {{ checklist.vacante_estado }}
                </span>
                <VChip
                  size="x-small"
                  :color="checklist.plazas_disponibles > 0 ? 'success' : 'error'"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ checklist.plazas_disponibles }} {{ checklist.plazas_disponibles === 1 ? 'disponible' : 'disponibles' }}
                </VChip>
              </div>
              <strong class="text-body-1 font-weight-bold">
                {{ checklist.plazas_ocupadas }} de {{ checklist.plazas_total }} plazas ocupadas
              </strong>
            </div>
            <div class="mt-2">
              <VProgressLinear
                :model-value="checklist.plazas_total > 0 ? (checklist.plazas_ocupadas / checklist.plazas_total) * 100 : 0"
                :color="checklist.plazas_disponibles > 0 ? 'primary' : 'error'"
                height="6"
                rounded
              />
            </div>
          </div>
        </VCol>
      </VRow>

      <!-- Alertas de requisitos pendientes (bloqueos) -->
      <VAlert
        v-if="checklist.bloqueos.length && !contratada"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        <div class="font-weight-bold mb-1">
          Requisitos para formalizar la contratación:
        </div>
        <ul class="ps-4 mb-0 text-caption">
          <li
            v-for="bloqueo in checklist.bloqueos"
            :key="bloqueo"
          >
            {{ bloqueo }}
          </li>
        </ul>
      </VAlert>

      <!-- Sección de Documentos del expediente -->
      <section class="tt-subpanel mb-4">
        <div class="d-flex flex-wrap justify-space-between align-center gap-2 mb-3">
          <div>
            <div class="d-flex align-center gap-2">
              <VIcon
                icon="tabler-folders"
                size="18"
                color="primary"
              />
              <h4 class="text-subtitle-2 font-weight-bold mb-0">
                Documentos del expediente
              </h4>
            </div>
            <p class="text-caption text-medium-emphasis mb-0 mt-1">
              Revisión informativa de los adjuntos del candidato. No condicionan el cierre de contratación.
            </p>
          </div>

          <VBtn
            v-if="puedeVerCandidato"
            :to="`/admin/candidatos/show/${postulacion.candidato_id}`"
            variant="tonal"
            size="x-small"
            color="primary"
            prepend-icon="tabler-folder-open"
          >
            Ver expediente
          </VBtn>
        </div>

        <VAlert
          v-if="errorDocumentos"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ errorDocumentos }}
        </VAlert>

        <p
          v-else-if="!candidato"
          class="text-caption text-medium-emphasis mb-2"
        >
          {{ puedeVerCandidato ? 'Consultando documentos del expediente…' : 'No tiene permiso para consultar los documentos del candidato.' }}
        </p>

        <div
          v-if="candidato"
          class="d-flex flex-wrap gap-2"
        >
          <div
            v-for="doc in documentos"
            :key="doc.clave"
            class="doc-chip"
            :class="{ 'doc-chip--active': doc.cantidad > 0 }"
          >
            <VIcon
              :icon="doc.cantidad > 0 ? 'tabler-file-check' : 'tabler-file-text'"
              size="15"
              :color="doc.cantidad > 0 ? 'success' : 'secondary'"
            />
            <span>{{ doc.nombre }}:</span>
            <strong>{{ doc.cantidad }}</strong>
          </div>
        </div>
      </section>

      <!-- Formulario de Formalización -->
      <section
        v-if="!contratada && puedeEditar"
        class="tt-subpanel mb-4"
      >
        <div class="d-flex align-center gap-2 mb-3">
          <VIcon
            icon="tabler-calendar-plus"
            size="18"
            color="primary"
          />
          <h4 class="text-subtitle-2 font-weight-bold mb-0">
            Formalización y fecha de ingreso
          </h4>
        </div>

        <VRow dense>
          <VCol
            cols="12"
            sm="5"
          >
            <AppTextField
              v-model="fechaIngreso"
              type="date"
              label="Fecha de ingreso confirmada *"
              :disabled="guardando"
              @update:model-value="fechaEditadaManualmente = true"
            />
          </VCol>
          <VCol
            cols="12"
            sm="7"
          >
            <AppTextarea
              v-model="observaciones"
              label="Nota interna del cierre (opcional)"
              placeholder="Ej. Ingreso confirmado para la fecha acordada; asignación de plaza completa."
              :counter="2000"
              rows="2"
              :disabled="guardando"
            />
          </VCol>
        </VRow>

        <VAlert
          type="info"
          variant="tonal"
          density="compact"
          class="mt-3 mb-4"
        >
          Al confirmar la contratación se ocupa una plaza en la vacante y se programa el correo de bienvenida al candidato. La vacante se marcará <strong>Cubierta</strong> automáticamente solo cuando se ocupen todas sus plazas.
        </VAlert>

        <div class="d-flex justify-end">
          <VBtn
            color="success"
            prepend-icon="tabler-user-check"
            :disabled="!puedeConfirmar || !fechaIngreso || guardando"
            :loading="guardando"
            @click="confirmar = true"
          >
            Confirmar contratación
          </VBtn>
        </div>
      </section>
    </template>

    <VDialog
      v-model="confirmar"
      max-width="500"
      :persistent="guardando"
    >
      <VCard title="Confirmar contratación">
        <VCardText>
          Se finalizará la selección de esta persona, con ingreso el <strong>{{ fechaIngreso }}</strong>.
          Se registrará tu usuario y la fecha de confirmación.
          <VAlert
            v-if="error"
            type="error"
            variant="tonal"
            class="mt-3"
          >
            {{ error }}
          </VAlert>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn
            :disabled="guardando"
            @click="confirmar = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="success"
            :loading="guardando"
            :disabled="!puedeConfirmar"
            @click="confirmarContratacion"
          >
            Confirmar y finalizar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
@import '@styles/reclutamiento-talent.scss';

.contratacion-panel {
  padding-top: 4px;
}

.tt-subpanel {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(23, 42, 39, 0.09);
  background: rgb(var(--v-theme-surface));
}

.v-theme--dark .tt-subpanel {
  border-color: rgba(255, 255, 255, 0.09);
}

.contratacion-completada-card {
  padding: 16px 18px;
  border-radius: 12px;
  background: rgba(33, 130, 104, 0.08);
  border: 1px solid rgba(33, 130, 104, 0.22);
}

.v-theme--dark .contratacion-completada-card {
  background: rgba(33, 130, 104, 0.14);
  border-color: rgba(33, 130, 104, 0.35);
}

.contratacion-metas {
  margin-top: 4px;
}

.meta-item {
  padding: 8px 12px;
  background: rgba(var(--v-theme-surface), 0.7);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.08);
  border-radius: 8px;
}

.meta-label {
  display: block;
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  color: rgba(var(--v-theme-on-surface), 0.58);
}

.meta-value {
  display: block;
  font-size: 13.5px;
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
  margin-top: 2px;
}

.doc-chip {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 8px;
  background: #f8fbf9;
  border: 1px solid #e6eeea;
  font-size: 12.5px;
  color: rgba(var(--v-theme-on-surface), 0.7);
}

.doc-chip--active {
  background: rgba(33, 130, 104, 0.08);
  border-color: rgba(33, 130, 104, 0.25);
  color: rgb(var(--v-theme-on-surface));
}

.v-theme--dark .doc-chip {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.09);
}

.v-theme--dark .doc-chip--active {
  background: rgba(33, 130, 104, 0.16);
  border-color: rgba(33, 130, 104, 0.4);
}
</style>
