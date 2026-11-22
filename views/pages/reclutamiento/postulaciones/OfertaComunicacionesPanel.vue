<script setup lang="ts">
import { useAbility } from '@casl/vue'
import type { ComunicacionPostulacion, OfertaLaboral, Postulacion } from '@/types/reclutamiento'
import { extraerMensajeErrorApi, formatearFechaHoraGuatemala } from '@/utils/entrevistasGuatemala'

const props = defineProps<{ postulacion: Postulacion }>()
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

const monedaFormateada = computed(() => {
  const importe = Number(form.monto_bruto)

  return Number.isFinite(importe) ? new Intl.NumberFormat('es-GT', { style: 'currency', currency: form.moneda }).format(importe) : ''
})

const colorEstado = (estado: string) => {
  if (['Enviada', 'Aceptada'].includes(estado))
    return 'success'
  if (['Error', 'Incierta', 'Rechazada'].includes(estado))
    return 'error'

  return 'warning'
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
    if (ofertaResp.data && (!cargaCompleta.value || bloqueada.value)) {
      const actual = ofertaResp.data

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
    else if (!ofertaResp.data && !cargaCompleta.value) {
      form.puesto = props.postulacion.vacante?.puesto?.nombre || ''
    }
    comunicaciones.value = correosResp.data.data
    ultimaPagina.value = correosResp.data.last_page
    cargaCompleta.value = true
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
    showToastSuccess(resp.message)
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
    const resp = await post<{ message: string }>(`/api/postulaciones/${props.postulacion.id}/oferta/respuesta`, {
      estado: respuesta.value,
      observaciones: observacionesRespuesta.value.trim(),
    })

    confirmarRespuesta.value = false
    showToastSuccess(resp.message)
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
  <div>
    <VAlert type="info" variant="tonal" class="mb-4">
      Prepare la oferta antes de pasar a Oferta laboral. Al guardar esa etapa, el sistema prepara su envío automático.
      La aceptación se registra a partir de la respuesta por correo; no confirma automáticamente la contratación.
    </VAlert>
    <VAlert v-if="error" type="error" variant="tonal" class="mb-4">
      {{ error }}
    </VAlert>
    <VProgressLinear v-if="cargando" indeterminate class="mb-4" />
    <div class="d-flex justify-space-between align-center mb-3">
      <h3 class="text-subtitle-1 font-weight-bold">
        Oferta laboral
      </h3>
      <VChip v-if="oferta" :color="colorEstado(oferta.estado)" size="small">
        {{ oferta.estado }}
      </VChip>
    </div>
    <VAlert v-if="esOferta && !bloqueada" type="warning" variant="tonal" class="mb-3">
      Esta postulación ya está en Oferta laboral. Guardar las condiciones prepara el correo para su envío.
    </VAlert>
    <VRow dense>
      <VCol cols="12">
        <AppSelect v-model="form.periodicidad" label="Periodicidad del salario" :items="['Mensual', 'Quincenal', 'Semanal', 'Anual', 'No especificada']" :disabled="!puedeEditar || bloqueada || cargando" />
      </VCol>
      <VCol cols="12">
        <AppTextField v-model="form.puesto" label="Puesto ofrecido" :disabled="!puedeEditar || bloqueada || cargando" />
      </VCol>
      <VCol cols="12" sm="4">
        <AppSelect v-model="form.moneda" label="Moneda" :items="['GTQ', 'USD']" :disabled="!puedeEditar || bloqueada || cargando" />
      </VCol>
      <VCol cols="12" sm="8">
        <AppTextField v-model="form.monto_bruto" type="number" min="0.01" step="0.01" label="Monto bruto" :disabled="!puedeEditar || bloqueada || cargando" />
      </VCol>
      <VCol cols="12">
        <AppTextField v-model="form.descripcion" label="Concepto del monto (mensual, anual, etc.)" :disabled="!puedeEditar || bloqueada || cargando" />
      </VCol>
      <VCol cols="12" sm="6">
        <AppTextField v-model="form.fecha_inicio" type="date" label="Fecha propuesta de ingreso" :disabled="!puedeEditar || bloqueada || cargando" />
      </VCol>
      <VCol cols="12" sm="6">
        <AppTextField v-model="form.fecha_vencimiento" type="date" label="Fecha límite para responder" :disabled="!puedeEditar || bloqueada || cargando" />
      </VCol>
      <VCol cols="12">
        <AppTextarea v-model="form.condiciones" label="Condiciones visibles para el candidato" rows="4" :disabled="!puedeEditar || bloqueada || cargando" />
      </VCol>
    </VRow>
    <div class="tt-detail-box my-4">
      <span>Resumen de condiciones para el candidato</span>
      <strong>{{ form.puesto || 'Puesto por definir' }} · {{ monedaFormateada }} · {{ form.periodicidad }}</strong>
      <p class="mb-1">
        {{ form.descripcion }}
      </p>
      <p class="mb-1">
        Ingreso: {{ form.fecha_inicio || 'Por definir' }} · Respuesta hasta: {{ form.fecha_vencimiento || 'Por definir' }}
      </p>
      <p class="mb-0" style="white-space: pre-wrap;">
        {{ form.condiciones }}
      </p>
    </div>
    <div class="d-flex flex-wrap gap-2 mb-4">
      <VBtn v-if="puedeEditar && !bloqueada" :loading="guardando" :disabled="cargando || !cargaCompleta" @click="guardar">
        {{ esOferta ? 'Guardar oferta y preparar envío' : 'Guardar borrador de oferta' }}
      </VBtn>
      <VBtn v-if="puedeEditar && oferta?.estado === 'Enviada'" color="success" :disabled="guardando" @click="confirmarRespuesta = true">
        Registrar respuesta del candidato
      </VBtn>
      <VBtn variant="tonal" :loading="cargando" @click="cargar">
        Actualizar
      </VBtn>
    </div>
    <VAlert v-if="oferta?.estado === 'Aceptada'" type="success" variant="tonal" class="mb-4">
      Oferta aceptada. Confirme la contratación desde Seguimiento cuando haya completado los pendientes.
    </VAlert>
    <p v-if="oferta?.observaciones" class="text-body-2">
      Respuesta registrada: {{ oferta.observaciones }}
    </p>
    <h3 class="text-subtitle-1 font-weight-bold mb-2">
      Correos del proceso
    </h3>
    <p class="text-caption text-medium-emphasis">
      Envíos de evaluación, entrevista con RRHH, oferta y cierre. Las entrevistas virtuales esperan el enlace de Meet.
      No se envían calificaciones ni notas internas.
    </p>
    <p v-if="!cargando && !comunicaciones.length && !error" class="text-body-2 text-medium-emphasis">
      No hay comunicaciones registradas.
    </p>
    <div v-for="correo in comunicaciones" :key="correo.id" class="tt-detail-box mb-2">
      <div class="d-flex flex-wrap justify-space-between align-center gap-2">
        <strong>{{ correo.asunto || correo.tipo }}</strong>
        <VChip :color="colorEstado(correo.estado)" size="small">
          {{ correo.estado }}
        </VChip>
      </div>
      <p class="text-caption mb-1">
        {{ correo.destinatario || 'Destinatario pendiente' }} · {{ formatearFechaHoraGuatemala(correo.enviada_at || correo.created_at) }}
      </p>
      <p v-if="correo.error_mensaje" class="text-error text-caption mb-1">
        {{ correo.error_mensaje }}
      </p>
      <VBtn v-if="puedeEditar && correo.estado === 'Error'" size="small" variant="tonal" :loading="guardando" @click="reintentar(correo)">
        Reintentar envío
      </VBtn>
      <p v-if="correo.estado === 'Incierta'" class="text-caption mb-0">
        Verifique la carpeta Enviados de Google antes de repetir; el servidor no puede confirmar si Google recibió el correo.
      </p>
      <VBtn v-if="puedeEditar && correo.estado === 'Incierta'" size="small" variant="tonal" class="mt-2" :disabled="guardando" @click="correoResolver = correo">
        Registrar verificación en Gmail
      </VBtn>
    </div>
    <VPagination v-if="ultimaPagina > 1" v-model="pagina" :length="ultimaPagina" :disabled="cargando" />
    <VDialog v-model="confirmarRespuesta" max-width="500">
      <VCard title="Registrar respuesta recibida por correo">
        <VCardText>
          <AppSelect v-model="respuesta" label="Respuesta del candidato" :items="['Aceptada', 'Rechazada']" class="mb-3" />
          <AppTextarea v-model="observacionesRespuesta" label="Resumen de la respuesta recibida" rows="3" />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn :disabled="guardando" @click="confirmarRespuesta = false">
            Cancelar
          </VBtn>
          <VBtn color="primary" :loading="guardando" @click="registrarRespuesta">
            Confirmar registro
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
    <VDialog :model-value="!!correoResolver" max-width="500" @update:model-value="!$event && (correoResolver = null)">
      <VCard title="Resolver envío incierto">
        <VCardText>
          <VAlert type="warning" variant="tonal" class="mb-3">
            Compruebe la carpeta Enviados de la cuenta de Google antes de continuar.
            Si confirma que no se envió, el sistema lo volverá a poner en cola solo si sigue vigente.
          </VAlert>
          <AppSelect
            v-model="resultadoResolucion"
            label="Resultado de la verificación"
            :items="[{ title: 'Confirmé que se envió', value: 'enviada' }, { title: 'Confirmé que no se envió', value: 'no_enviada' }]"
            class="mb-3"
          />
          <AppTextarea v-model="notaResolucion" label="Evidencia de la verificación (obligatoria)" rows="3" :counter="2000" />
          <VAlert v-if="error" type="error" variant="tonal" class="mt-3">
            {{ error }}
          </VAlert>
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn :disabled="guardando" @click="correoResolver = null">
            Cancelar
          </VBtn>
          <VBtn color="primary" :loading="guardando" @click="resolverIncierto">
            Registrar verificación
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
