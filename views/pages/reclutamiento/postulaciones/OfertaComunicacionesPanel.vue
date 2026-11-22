<script setup lang="ts">
import { useAbility } from '@casl/vue'
import type { ComunicacionPostulacion, OfertaLaboral, Postulacion } from '@/types/reclutamiento'
import { extraerMensajeErrorApi, formatearFechaHoraGuatemala } from '@/utils/entrevistasGuatemala'

const props = defineProps<{ postulacion: Postulacion }>()

const emit = defineEmits<{
  (e: 'ofertaActualizada', oferta: OfertaLaboral | null): void
  (e: 'abrirContratacion'): void
}>()

const { get, put, post } = useClienteRequest()
const { showToastSuccess } = useToast()
const ability = useAbility()
const puedeEditar = computed(() => ability.can('editar postulaciones', 'Postulacion'))
const oferta = ref<OfertaLaboral | null>(null)
const comunicaciones = ref<ComunicacionPostulacion[]>([])
const cargando = ref(false)
const guardando = ref(false)
const error = ref<string | null>(null)
const pagina = ref(1)
const ultimaPagina = ref(1)
const respuesta = ref<'Aceptada' | 'Rechazada'>('Aceptada')
const observacionesRespuesta = ref('')
const confirmarRespuesta = ref(false)
const correoResolver = ref<ComunicacionPostulacion | null>(null)
const resultadoResolucion = ref<'enviada' | 'no_enviada'>('enviada')
const notaResolucion = ref('')
const cargaCompleta = ref(false)
const editandoOferta = ref(false)
const verVistaPrevia = ref(false)

let solicitudCarga: AbortController | undefined

const form = reactive({
  moneda: 'GTQ' as 'GTQ' | 'USD',
  monto_bruto: '',
  periodicidad: 'Mensual',
  descripcion: 'Salario bruto mensual',
  puesto: '',
  fecha_inicio: '',
  fecha_vencimiento: '',
  condiciones: '',
})

const bloqueada = computed(() => !!oferta.value && oferta.value.estado !== 'Borrador')
const esOferta = computed(() => (props.postulacion.etapaReclutamiento?.nombre || props.postulacion.etapa_reclutamiento?.nombre || '').toLowerCase().includes('oferta'))

const formatearMoneda = (monto: string | number | null | undefined, moneda: 'GTQ' | 'USD' = 'GTQ') => {
  const importe = Number(monto)

  return Number.isFinite(importe) && importe > 0
    ? new Intl.NumberFormat('es-GT', { style: 'currency', currency: moneda }).format(importe)
    : ''
}

const monedaFormateada = computed(() => formatearMoneda(form.monto_bruto, form.moneda))

const montoOfertaFormateado = computed(() => oferta.value
  ? formatearMoneda(oferta.value.monto_bruto, oferta.value.moneda)
  : '')

const colorEstado = (estado: string) => {
  if (['Enviada', 'Aceptada'].includes(estado))
    return 'success'
  if (['Error', 'Incierta', 'Rechazada'].includes(estado))
    return 'error'
  if (estado === 'Cancelada')
    return 'secondary'

  return 'warning'
}

const iconoEstadoCorreo = (estado: string) => {
  if (estado === 'Enviada')
    return 'tabler-mail-check'
  if (estado === 'Error')
    return 'tabler-mail-x'
  if (estado === 'Incierta')
    return 'tabler-help-circle'
  if (estado === 'Cancelada')
    return 'tabler-mail-off'

  return 'tabler-clock'
}

const sincronizarFormularioDesdeOferta = (actual: OfertaLaboral) => {
  Object.assign(form, {
    moneda: actual.moneda,
    monto_bruto: String(actual.monto_bruto),
    periodicidad: actual.periodicidad || 'No especificada',
    descripcion: actual.descripcion,
    puesto: actual.puesto,
    fecha_inicio: actual.fecha_inicio?.slice(0, 10),
    fecha_vencimiento: actual.fecha_vencimiento?.slice(0, 10),
    condiciones: actual.condiciones,
  })
}

const iniciarEdicion = () => {
  if (!puedeEditar.value || bloqueada.value)
    return
  if (oferta.value)
    sincronizarFormularioDesdeOferta(oferta.value)
  else if (!form.puesto)
    form.puesto = props.postulacion.vacante?.puesto?.nombre || ''
  editandoOferta.value = true
}

const cancelarEdicion = () => {
  if (oferta.value)
    sincronizarFormularioDesdeOferta(oferta.value)
  editandoOferta.value = false
  verVistaPrevia.value = false
  error.value = null
}

const cargar = async () => {
  solicitudCarga?.abort()

  const controlador = new AbortController()
  const { signal } = controlador

  solicitudCarga = controlador
  cargando.value = true
  error.value = null
  try {
    const [ofertaResp, correosResp] = await Promise.all([
      get<{ data: OfertaLaboral | null }>(`/api/postulaciones/${props.postulacion.id}/oferta`, { signal }),
      get<{ data: { data: ComunicacionPostulacion[]; last_page: number } }>(
        `/api/postulaciones/${props.postulacion.id}/comunicaciones?page[number]=${pagina.value}&page[size]=10`,
        { signal },
      ),
    ])

    if (signal.aborted)
      return

    if ((ofertaResp.data !== null && !ofertaResp.data?.id) || !Array.isArray(correosResp.data?.data)) {
      error.value = 'La respuesta de oferta o comunicaciones no tiene el formato esperado.'
      cargaCompleta.value = false

      return
    }

    oferta.value = ofertaResp.data
    if (ofertaResp.data && (!cargaCompleta.value || bloqueada.value))
      sincronizarFormularioDesdeOferta(ofertaResp.data)
    else if (!ofertaResp.data && !cargaCompleta.value)
      form.puesto = props.postulacion.vacante?.puesto?.nombre || ''

    if (bloqueada.value || !puedeEditar.value)
      editandoOferta.value = false
    else if (!ofertaResp.data && !cargaCompleta.value && esOferta.value)
      editandoOferta.value = true

    comunicaciones.value = correosResp.data.data
    ultimaPagina.value = correosResp.data.last_page
    cargaCompleta.value = true
    emit('ofertaActualizada', oferta.value)
  }
  catch (err) {
    if (signal.aborted)
      return

    error.value = extraerMensajeErrorApi(err, 'No fue posible consultar la oferta y las comunicaciones.')
  }
  finally {
    if (!signal.aborted)
      cargando.value = false
  }
}

const guardar = async () => {
  if (!puedeEditar.value || guardando.value || bloqueada.value || !cargaCompleta.value)
    return
  if (!form.monto_bruto || Number(form.monto_bruto) <= 0 || !form.puesto.trim() || !form.condiciones.trim() || !form.fecha_inicio || !form.fecha_vencimiento) {
    error.value = 'Complete el puesto, salario mayor que cero, fechas y condiciones de la oferta.'

    return
  }

  guardando.value = true
  error.value = null
  try {
    const resp = await put<{ data: OfertaLaboral; message: string }>(`/api/postulaciones/${props.postulacion.id}/oferta`, form)

    oferta.value = resp.data
    editandoOferta.value = false
    verVistaPrevia.value = false
    showToastSuccess(resp.message)
    emit('ofertaActualizada', resp.data)
    await cargar()
  }
  catch (err) {
    error.value = extraerMensajeErrorApi(err, 'No fue posible guardar la oferta.')
  }
  finally {
    guardando.value = false
  }
}

const registrarRespuesta = async () => {
  if (!puedeEditar.value || guardando.value || oferta.value?.estado !== 'Enviada')
    return

  guardando.value = true
  error.value = null
  try {
    const observaciones = observacionesRespuesta.value.trim()

    const resp = await post<{ data?: OfertaLaboral; message: string }>(`/api/postulaciones/${props.postulacion.id}/oferta/respuesta`, {
      estado: respuesta.value,
      observaciones,
    })

    confirmarRespuesta.value = false
    if (resp.data?.id) {
      oferta.value = resp.data
    }
    else if (oferta.value) {
      oferta.value = {
        ...oferta.value,
        estado: respuesta.value,
        observaciones: observaciones || oferta.value.observaciones,
      }
    }
    observacionesRespuesta.value = ''
    showToastSuccess(resp.message)
    emit('ofertaActualizada', oferta.value)
    await cargar()
  }
  catch (err) {
    error.value = extraerMensajeErrorApi(err, 'No fue posible registrar la respuesta.')
  }
  finally {
    guardando.value = false
  }
}

const reintentar = async (correo: ComunicacionPostulacion) => {
  if (!puedeEditar.value || guardando.value || correo.estado !== 'Error')
    return

  guardando.value = true
  error.value = null
  try {
    const resp = await post<{ message: string }>(`/api/comunicaciones/${correo.id}/reintentar`, {})

    showToastSuccess(resp.message)
    await cargar()
  }

  catch (err) {
    error.value = extraerMensajeErrorApi(err, 'No fue posible reintentar el correo.')
  }
  finally {
    guardando.value = false
  }
}

const resolverIncierto = async () => {
  if (!puedeEditar.value || guardando.value || !correoResolver.value)
    return
  if (!notaResolucion.value.trim()) {
    error.value = 'Registre cómo verificó el envío en Gmail.'

    return
  }

  guardando.value = true
  error.value = null
  try {
    const resp = await post<{ message: string }>(`/api/comunicaciones/${correoResolver.value.id}/resolver`, {
      resultado: resultadoResolucion.value,
      nota: notaResolucion.value.trim(),
    })

    correoResolver.value = null
    notaResolucion.value = ''
    showToastSuccess(resp.message)
    await cargar()
  }
  catch (err) {
    error.value = extraerMensajeErrorApi(err, 'No fue posible resolver el envío incierto.')
  }
  finally {
    guardando.value = false
  }
}

watch(() => props.postulacion.id, () => {
  cargaCompleta.value = false
  oferta.value = null
  editandoOferta.value = false
  verVistaPrevia.value = false
  Object.assign(form, {
    moneda: 'GTQ',
    monto_bruto: '',
    periodicidad: 'Mensual',
    descripcion: 'Salario bruto mensual',
    puesto: '',
    fecha_inicio: '',
    fecha_vencimiento: '',
    condiciones: '',
  })
  pagina.value = 1
  cargar()
}, { immediate: true })
watch(pagina, cargar)
onBeforeUnmount(() => solicitudCarga?.abort())
</script>

<template>
  <div class="oferta-comunicaciones-panel">
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

    <!-- Sección 1: Oferta laboral -->
    <section class="tt-subpanel mb-5">
      <div class="d-flex flex-wrap justify-space-between align-center gap-2 mb-3">
        <div class="d-flex align-center flex-wrap gap-2">
          <VIcon
            icon="tabler-file-certificate"
            size="20"
            color="primary"
          />
          <h3 class="text-subtitle-1 font-weight-bold mb-0">
            Oferta laboral
          </h3>
          <VChip
            v-if="oferta"
            :color="colorEstado(oferta.estado)"
            size="x-small"
            variant="tonal"
            class="font-weight-bold"
          >
            {{ oferta.estado }}
          </VChip>
          <VChip
            v-else-if="cargaCompleta"
            color="secondary"
            size="x-small"
            variant="tonal"
          >
            Sin borrador
          </VChip>
        </div>

        <div class="d-flex align-center gap-2">
          <VBtn
            v-if="puedeEditar && !bloqueada && oferta && !editandoOferta"
            size="small"
            variant="tonal"
            color="primary"
            prepend-icon="tabler-edit"
            :disabled="cargando || guardando"
            @click="iniciarEdicion"
          >
            Editar borrador
          </VBtn>
          <VBtn
            size="small"
            variant="text"
            color="secondary"
            prepend-icon="tabler-refresh"
            :loading="cargando"
            :disabled="guardando"
            @click="cargar"
          >
            Actualizar
          </VBtn>
        </div>
      </div>

      <!-- Estado aceptada: CTA directo a Contratación -->
      <VAlert
        v-if="oferta?.estado === 'Aceptada'"
        type="success"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        <div class="d-flex flex-wrap justify-space-between align-center gap-2">
          <span>Oferta aceptada por el candidato. Puede continuar con el cierre de contratación.</span>
          <VBtn
            size="small"
            color="success"
            variant="flat"
            prepend-icon="tabler-user-check"
            @click="emit('abrirContratacion')"
          >
            Ir a Contratación
          </VBtn>
        </div>
      </VAlert>

      <!-- Aviso contextual cuando ya está en etapa Oferta y aún no se bloquea -->
      <VAlert
        v-else-if="esOferta && !bloqueada"
        type="warning"
        variant="tonal"
        density="compact"
        class="mb-4"
      >
        Esta postulación ya está en etapa de Oferta laboral. Guardar las condiciones preparará su envío por correo.
      </VAlert>

      <!-- Modo edición (borrador nuevo o editando borrador) -->
      <div v-if="puedeEditar && !bloqueada && editandoOferta">
        <p class="text-caption text-medium-emphasis mb-3">
          Defina las condiciones visibles para el candidato. El correo se programa automáticamente al avanzar a Oferta laboral.
        </p>
        <VRow dense>
          <VCol
            cols="12"
            sm="7"
          >
            <AppTextField
              v-model="form.puesto"
              label="Puesto ofrecido"
              :disabled="cargando || guardando"
            />
          </VCol>
          <VCol
            cols="12"
            sm="5"
          >
            <AppSelect
              v-model="form.periodicidad"
              label="Periodicidad"
              :items="['Mensual', 'Quincenal', 'Semanal', 'Anual', 'No especificada']"
              :disabled="cargando || guardando"
            />
          </VCol>
          <VCol
            cols="12"
            sm="3"
          >
            <AppSelect
              v-model="form.moneda"
              label="Moneda"
              :items="['GTQ', 'USD']"
              :disabled="cargando || guardando"
            />
          </VCol>
          <VCol
            cols="12"
            sm="4"
          >
            <AppTextField
              v-model="form.monto_bruto"
              type="number"
              min="0.01"
              step="0.01"
              label="Monto bruto"
              :disabled="cargando || guardando"
            />
          </VCol>
          <VCol
            cols="12"
            sm="5"
          >
            <AppTextField
              v-model="form.descripcion"
              label="Concepto del monto"
              :disabled="cargando || guardando"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <AppTextField
              v-model="form.fecha_inicio"
              type="date"
              label="Fecha propuesta de ingreso"
              :disabled="cargando || guardando"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <AppTextField
              v-model="form.fecha_vencimiento"
              type="date"
              label="Fecha límite para responder"
              :disabled="cargando || guardando"
            />
          </VCol>
          <VCol cols="12">
            <AppTextarea
              v-model="form.condiciones"
              label="Condiciones visibles para el candidato"
              rows="3"
              :disabled="cargando || guardando"
            />
          </VCol>
        </VRow>

        <div class="d-flex flex-wrap justify-space-between align-center gap-2 mt-3">
          <VBtn
            size="small"
            variant="text"
            color="secondary"
            :prepend-icon="verVistaPrevia ? 'tabler-eye-off' : 'tabler-eye'"
            @click="verVistaPrevia = !verVistaPrevia"
          >
            {{ verVistaPrevia ? 'Ocultar vista previa' : 'Vista previa para el candidato' }}
          </VBtn>

          <div class="d-flex flex-wrap gap-2">
            <VBtn
              v-if="oferta || !esOferta"
              size="small"
              variant="tonal"
              color="secondary"
              :disabled="guardando"
              @click="cancelarEdicion"
            >
              Cancelar
            </VBtn>
            <VBtn
              size="small"
              color="primary"
              prepend-icon="tabler-device-floppy"
              :loading="guardando"
              :disabled="cargando || !cargaCompleta"
              @click="guardar"
            >
              {{ esOferta ? 'Guardar y preparar envío' : 'Guardar borrador' }}
            </VBtn>
          </div>
        </div>

        <VExpandTransition>
          <div
            v-if="verVistaPrevia"
            class="tt-detail-box mt-3"
          >
            <span>Vista previa para el candidato</span>
            <strong>{{ form.puesto || 'Puesto por definir' }} · {{ monedaFormateada || 'Monto por definir' }} · {{ form.periodicidad }}</strong>
            <p class="text-body-2 mt-1 mb-1">
              {{ form.descripcion }}
            </p>
            <p class="text-caption text-medium-emphasis mb-2">
              Ingreso propuesto: {{ form.fecha_inicio || 'Por definir' }} · Responder hasta: {{ form.fecha_vencimiento || 'Por definir' }}
            </p>
            <p class="text-body-2 mb-0 oferta-condiciones">
              {{ form.condiciones || 'Sin condiciones registradas.' }}
            </p>
          </div>
        </VExpandTransition>
      </div>

      <!-- Modo lectura / resumen limpio cuando existe oferta -->
      <div v-else-if="oferta">
        <div class="oferta-resumen-head mb-3">
          <div>
            <div class="text-subtitle-2 font-weight-bold">
              {{ oferta.puesto }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ oferta.descripcion }} · {{ oferta.periodicidad || 'No especificada' }}
            </div>
          </div>
          <div class="text-h6 font-weight-bold text-primary">
            {{ montoOfertaFormateado }}
          </div>
        </div>

        <VRow
          dense
          class="mb-3"
        >
          <VCol
            cols="12"
            sm="6"
          >
            <div class="tt-detail-box">
              <span>Ingreso propuesto</span>
              <strong>{{ oferta.fecha_inicio?.slice(0, 10) || 'Por definir' }}</strong>
            </div>
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <div class="tt-detail-box">
              <span>Fecha límite para responder</span>
              <strong>{{ oferta.fecha_vencimiento?.slice(0, 10) || 'Por definir' }}</strong>
            </div>
          </VCol>
          <VCol cols="12">
            <div class="tt-detail-box">
              <span>Condiciones visibles para el candidato</span>
              <p class="text-body-2 mt-1 mb-0 oferta-condiciones">
                {{ oferta.condiciones }}
              </p>
            </div>
          </VCol>
        </VRow>

        <div
          v-if="oferta.observaciones"
          class="tt-detail-box mb-3"
        >
          <span>Respuesta registrada</span>
          <p class="text-body-2 mt-1 mb-0 oferta-condiciones">
            {{ oferta.observaciones }}
          </p>
        </div>

        <div
          v-if="puedeEditar && oferta.estado === 'Enviada'"
          class="d-flex flex-wrap align-center justify-space-between gap-2 pt-1"
        >
          <span class="text-caption text-medium-emphasis">
            Registre la aceptación o rechazo recibido por correo; esto no confirma automáticamente la contratación.
          </span>
          <VBtn
            color="success"
            size="small"
            prepend-icon="tabler-mail-opened"
            :disabled="guardando"
            @click="confirmarRespuesta = true"
          >
            Registrar respuesta del candidato
          </VBtn>
        </div>
      </div>

      <!-- Estado vacío limpio cuando aún no existe oferta -->
      <div
        v-else-if="cargaCompleta"
        class="d-flex flex-wrap justify-space-between align-center gap-3 py-2"
      >
        <div>
          <div class="text-body-2 font-weight-medium">
            Aún no hay una oferta laboral preparada.
          </div>
          <div class="text-caption text-medium-emphasis">
            Prepare el borrador antes de avanzar a Oferta laboral para habilitar su envío automático.
          </div>
        </div>
        <VBtn
          v-if="puedeEditar"
          size="small"
          color="primary"
          variant="tonal"
          prepend-icon="tabler-plus"
          :disabled="cargando || guardando"
          @click="iniciarEdicion"
        >
          Preparar borrador
        </VBtn>
      </div>
    </section>

    <!-- Sección 2: Correos del proceso -->
    <section class="tt-subpanel">
      <div class="d-flex flex-wrap justify-space-between align-center gap-2 mb-3">
        <div>
          <div class="d-flex align-center gap-2">
            <VIcon
              icon="tabler-mail"
              size="20"
              color="primary"
            />
            <h3 class="text-subtitle-1 font-weight-bold mb-0">
              Correos del proceso
            </h3>
            <span
              v-if="comunicaciones.length"
              class="tt-count-pill"
            >
              {{ comunicaciones.length }}
            </span>
          </div>
          <p class="text-caption text-medium-emphasis mb-0 mt-1">
            Envíos de evaluación, entrevista con RRHH, oferta y cierre. Sin calificaciones ni notas internas.
          </p>
        </div>
      </div>

      <div
        v-if="!cargando && !comunicaciones.length && !error"
        class="text-body-2 text-medium-emphasis py-3 text-center"
      >
        No hay comunicaciones registradas para esta postulación.
      </div>

      <div
        v-else
        class="d-flex flex-column gap-2"
      >
        <div
          v-for="correo in comunicaciones"
          :key="correo.id"
          class="correo-item"
        >
          <div class="d-flex flex-wrap justify-space-between align-start gap-2">
            <div class="d-flex align-start gap-2 flex-grow-1 min-w-0">
              <VIcon
                :icon="iconoEstadoCorreo(correo.estado)"
                :color="colorEstado(correo.estado)"
                size="18"
                class="mt-1 flex-shrink-0"
              />
              <div class="min-w-0">
                <div class="d-flex flex-wrap align-center gap-2">
                  <strong class="text-body-2 font-weight-bold">
                    {{ correo.asunto || correo.tipo }}
                  </strong>
                  <VChip
                    v-if="correo.asunto && correo.tipo"
                    size="x-small"
                    variant="outlined"
                    color="secondary"
                  >
                    {{ correo.tipo }}
                  </VChip>
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  {{ correo.destinatario || 'Destinatario pendiente' }} · {{ formatearFechaHoraGuatemala(correo.enviada_at || correo.created_at) }}
                </div>
              </div>
            </div>

            <VChip
              :color="colorEstado(correo.estado)"
              size="x-small"
              variant="tonal"
              class="font-weight-bold flex-shrink-0"
            >
              {{ correo.estado }}
            </VChip>
          </div>

          <div
            v-if="correo.error_mensaje"
            class="text-error text-caption mt-2"
          >
            {{ correo.error_mensaje }}
          </div>

          <div
            v-if="correo.estado === 'Incierta'"
            class="text-caption text-warning mt-2"
          >
            Verifique la carpeta Enviados de Google antes de repetir; el servidor no pudo confirmar la recepción.
          </div>

          <div
            v-if="puedeEditar && (correo.estado === 'Error' || correo.estado === 'Incierta')"
            class="d-flex flex-wrap gap-2 mt-2"
          >
            <VBtn
              v-if="correo.estado === 'Error'"
              size="x-small"
              variant="tonal"
              color="error"
              prepend-icon="tabler-refresh"
              :loading="guardando"
              @click="reintentar(correo)"
            >
              Reintentar envío
            </VBtn>
            <VBtn
              v-if="correo.estado === 'Incierta'"
              size="x-small"
              variant="tonal"
              color="warning"
              prepend-icon="tabler-mail-search"
              :disabled="guardando"
              @click="correoResolver = correo"
            >
              Registrar verificación en Gmail
            </VBtn>
          </div>
        </div>
      </div>

      <div
        v-if="ultimaPagina > 1"
        class="d-flex justify-center mt-3"
      >
        <VPagination
          v-model="pagina"
          :length="ultimaPagina"
          density="compact"
          :disabled="cargando"
        />
      </div>
    </section>

    <VDialog
      v-model="confirmarRespuesta"
      max-width="500"
      :persistent="guardando"
    >
      <VCard title="Registrar respuesta recibida por correo">
        <VCardText>
          <AppSelect
            v-model="respuesta"
            label="Respuesta del candidato"
            :items="['Aceptada', 'Rechazada']"
            class="mb-3"
          />
          <AppTextarea
            v-model="observacionesRespuesta"
            label="Resumen de la respuesta recibida"
            rows="3"
          />
          <VAlert
            v-if="error"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ error }}
          </VAlert>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn
            :disabled="guardando"
            @click="confirmarRespuesta = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            :loading="guardando"
            @click="registrarRespuesta"
          >
            Confirmar registro
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <VDialog
      :model-value="!!correoResolver"
      max-width="500"
      :persistent="guardando"
      @update:model-value="!$event && !guardando && (correoResolver = null)"
    >
      <VCard title="Resolver envío incierto">
        <VCardText>
          <VAlert
            type="warning"
            variant="tonal"
            density="compact"
            class="mb-3"
          >
            Compruebe la carpeta Enviados de la cuenta de Google antes de continuar.
            Si confirma que no se envió, el sistema lo volverá a poner en cola solo si sigue vigente.
          </VAlert>
          <AppSelect
            v-model="resultadoResolucion"
            label="Resultado de la verificación"
            :items="[{ title: 'Confirmé que se envió', value: 'enviada' }, { title: 'Confirmé que no se envió', value: 'no_enviada' }]"
            class="mb-3"
          />
          <AppTextarea
            v-model="notaResolucion"
            label="Evidencia de la verificación (obligatoria)"
            rows="3"
            :counter="2000"
          />
          <VAlert
            v-if="error"
            type="error"
            variant="tonal"
            density="compact"
            class="mt-3"
          >
            {{ error }}
          </VAlert>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn
            :disabled="guardando"
            @click="correoResolver = null"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            :loading="guardando"
            @click="resolverIncierto"
          >
            Registrar verificación
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
.tt-subpanel {
  padding: 16px;
  border-radius: 12px;
  border: 1px solid rgba(23, 42, 39, 0.09);
  background: rgb(var(--v-theme-surface));
}

.v-theme--dark .tt-subpanel {
  border-color: rgba(255, 255, 255, 0.09);
}

.oferta-resumen-head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 12px 14px;
  border-radius: 10px;
  background: rgba(var(--v-theme-primary), 0.06);
  border: 1px solid rgba(var(--v-theme-primary), 0.14);
}

.oferta-condiciones {
  white-space: pre-wrap;
}

.correo-item {
  padding: 12px 14px;
  border-radius: 10px;
  background: #f8fbf9;
  border: 1px solid #e6eeea;
}

.v-theme--dark .correo-item {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.09);
}
</style>
