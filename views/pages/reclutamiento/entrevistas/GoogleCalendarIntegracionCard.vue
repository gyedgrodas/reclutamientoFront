<script setup lang="ts">
import { useAbility } from '@casl/vue'
import type {
  IntegracionGoogleCalendarEstado,
  RespuestaAutorizarGoogleCalendar,
} from '@/types/reclutamiento'
import {
  colorEstadoIntegracionGoogle,
  esUrlAutorizacionGoogleValida,
  etiquetaEstadoIntegracionGoogle,
  extraerMensajeErrorApi,
  formatearFechaHoraGuatemala,
  mensajeCallbackGoogleCalendar,
} from '@/utils/entrevistasGuatemala'

const props = defineProps<{
  callbackEstado?: 'conectado' | 'error' | null
  callbackCodigo?: string | null
}>()

const emit = defineEmits<{
  (e: 'estadoActualizado', estado: IntegracionGoogleCalendarEstado | null): void
  (e: 'limpiarCallback'): void
}>()

const { get, post, deleted } = useClienteRequest()
const { showToastError, showToastSuccess, showToastWarning } = useToast()
const ability = useAbility()
const can = (action: string, subject: string) => ability.can(action, subject)

const puedeVer = computed(() =>
  can('ver entrevistas', 'Entrevista') || can('administrar google calendar', 'Entrevista'),
)

const estado = ref<IntegracionGoogleCalendarEstado | null>(null)
const cargando = ref(false)
const errorCarga = ref<string | null>(null)

const autorizando = ref(false)
const desconectando = ref(false)
const confirmarDesconexion = ref(false)
const errorAccion = ref<string | null>(null)

let solicitudEstado: AbortController | undefined

const puedeAdministrar = computed(() => {
  if (!estado.value)
    return false

  return Boolean(estado.value.puede_administrar) || can('administrar google calendar', 'Entrevista')
})

const soportaDesconexion = computed(() =>
  Boolean(estado.value?.conectada) && estado.value?.soporta_desconexion !== false,
)

const etiquetaBotonAutorizar = computed(() => {
  if (!estado.value)
    return 'Conectar cuenta compartida'
  if (estado.value.estado === 'RequiereReautorizacion' || estado.value.estado === 'Error')
    return 'Reautorizar cuenta Google'
  if (estado.value.conectada)
    return 'Reconectar cuenta Google'

  return 'Conectar cuenta compartida de Google'
})

const nombreConectadoPor = computed(() => {
  const persona = estado.value?.conectada_por
  if (!persona)
    return null

  return `${persona.nombres || ''} ${persona.apellidos || ''}`.trim() || null
})

const mensajeCallback = computed<{ tipo: 'success' | 'warning' | 'error'; texto: string } | null>(() => {
  if (!props.callbackEstado)
    return null

  if (props.callbackEstado === 'error') {
    return {
      tipo: 'error',
      texto: mensajeCallbackGoogleCalendar(props.callbackCodigo),
    }
  }

  if (cargando.value) {
    return {
      tipo: 'warning',
      texto: 'Verificando el estado actual de la conexión con Google Calendar...',
    }
  }

  if (estado.value?.conectada) {
    return {
      tipo: 'success',
      texto: 'Cuenta compartida de Google conectada correctamente para generar enlaces de Google Meet.',
    }
  }

  return {
    tipo: 'warning',
    texto: 'Google completó el retorno, pero la integración aún no figura como conectada. Revisa el estado y los errores abajo.',
  }
})

const cargarEstado = async () => {
  if (!puedeVer.value)
    return

  solicitudEstado?.abort()

  const controlador = new AbortController()
  const { signal } = controlador

  solicitudEstado = controlador
  cargando.value = true
  errorCarga.value = null

  try {
    const respuesta = await get<{ success?: boolean; data?: IntegracionGoogleCalendarEstado }>(
      '/api/integraciones/google-calendar/estado',
      { signal },
    )

    if (signal.aborted)
      return

    if (respuesta?.success === false || !respuesta?.data || typeof respuesta.data !== 'object') {
      errorCarga.value = 'La respuesta del estado de Google Calendar no tiene el formato esperado.'
      estado.value = null
      emit('estadoActualizado', null)

      return
    }

    estado.value = respuesta.data
    emit('estadoActualizado', respuesta.data)
  }
  catch (error: any) {
    if (signal.aborted)
      return

    errorCarga.value = extraerMensajeErrorApi(
      error,
      'No fue posible consultar el estado de la integración con Google Calendar.',
    )
    emit('estadoActualizado', null)
  }
  finally {
    if (!signal.aborted)
      cargando.value = false
  }
}

const iniciarAutorizacion = async () => {
  if (autorizando.value || desconectando.value || !puedeAdministrar.value || !estado.value?.configurada)
    return

  errorAccion.value = null
  confirmarDesconexion.value = false
  autorizando.value = true

  try {
    const respuesta = await post<{
      success?: boolean
      data?: RespuestaAutorizarGoogleCalendar
      message?: string
    }>('/api/integraciones/google-calendar/autorizar', {})

    const url = respuesta?.data?.url
    if (respuesta?.success === false || !esUrlAutorizacionGoogleValida(url)) {
      const msg = respuesta?.message || 'El servidor no devolvió una URL válida de autorización de Google.'

      errorAccion.value = msg
      showToastError(msg)

      return
    }

    window.location.assign(url!.trim())
  }
  catch (error: any) {
    const msg = error?.response?.status === 403
      ? 'No tienes permisos para administrar la conexión compartida de Google Calendar.'
      : extraerMensajeErrorApi(error, 'No fue posible iniciar la autorización con Google.')

    errorAccion.value = msg
    showToastError(msg)
  }
  finally {
    autorizando.value = false
  }
}

const ejecutarDesconexion = async () => {
  if (desconectando.value || autorizando.value || !puedeAdministrar.value || !soportaDesconexion.value)
    return

  errorAccion.value = null
  desconectando.value = true

  try {
    const respuesta = await deleted<{
      success?: boolean
      data?: IntegracionGoogleCalendarEstado
      message?: string
    }>('/api/integraciones/google-calendar')

    if (respuesta?.success === false) {
      const msg = respuesta?.message || 'No fue posible desconectar la cuenta compartida de Google.'

      errorAccion.value = msg
      showToastError(msg)

      return
    }

    confirmarDesconexion.value = false
    if (respuesta?.data) {
      estado.value = respuesta.data
      emit('estadoActualizado', respuesta.data)
    }
    else {
      await cargarEstado()
    }

    if (estado.value && !estado.value.conectada)
      showToastSuccess(respuesta?.message || 'Cuenta compartida de Google desconectada.')
    else
      showToastWarning(respuesta?.message || 'Se procesó la desconexión, pero la integración sigue reportando conexión activa.')
  }
  catch (error: any) {
    const msg = error?.response?.status === 403
      ? 'No tienes permisos para desconectar la integración de Google Calendar.'
      : extraerMensajeErrorApi(error, 'No fue posible desconectar la cuenta compartida de Google.')

    errorAccion.value = msg
    showToastError(msg)
  }
  finally {
    desconectando.value = false
  }
}

watch(() => props.callbackEstado, nuevo => {
  if (nuevo)
    cargarEstado()
})

onMounted(() => {
  cargarEstado()
})

onBeforeUnmount(() => {
  solicitudEstado?.abort()
})

defineExpose({
  cargarEstado,
})
</script>

<template>
  <VCard
    v-if="puedeVer"
    class="tt-panel google-integracion-card"
  >
    <VCardText class="pa-5">
      <div class="d-flex flex-wrap justify-space-between align-start gap-3 mb-3">
        <div class="d-flex align-center gap-3">
          <div class="tt-stat-icon">
            <VIcon
              icon="tabler-brand-google"
              size="20"
            />
          </div>
          <div>
            <span class="tt-eyebrow">INTEGRACIÓN GOOGLE MEET COMPARTIDO · DURACIÓN FIJA 1 HORA</span>
            <div class="d-flex flex-wrap align-center gap-2 mt-1">
              <h2 class="text-subtitle-1 font-weight-bold mb-0">
                Google Calendar y enlaces automáticos de Google Meet
              </h2>
              <VChip
                v-if="estado"
                size="x-small"
                :color="colorEstadoIntegracionGoogle(estado.estado)"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ etiquetaEstadoIntegracionGoogle(estado.estado) }}
              </VChip>
            </div>
            <p class="text-caption text-medium-emphasis mb-0 mt-1">
              Autorización OAuth segura gestionada desde el servidor, sin contraseñas ni tokens en el navegador.
              Calendar crea los enlaces de Meet sin invitaciones; Gmail envía por separado los correos del proceso al candidato.
            </p>
          </div>
        </div>

        <VBtn
          size="small"
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="cargando"
          @click="cargarEstado"
        >
          Actualizar estado
        </VBtn>
      </div>

      <!-- Resultado del callback OAuth -->
      <VAlert
        v-if="mensajeCallback"
        :type="mensajeCallback.tipo"
        variant="tonal"
        density="compact"
        closable
        class="mb-3"
        @click:close="emit('limpiarCallback')"
      >
        {{ mensajeCallback.texto }}
      </VAlert>

      <!-- Cargando -->
      <div
        v-if="cargando && !estado"
        role="status"
        class="py-3"
      >
        <p class="text-caption text-medium-emphasis mb-2">
          Consultando configuración de Google Calendar...
        </p>
        <VProgressLinear
          indeterminate
          color="primary"
          rounded
          aria-label="Consultando estado de Google Calendar"
        />
      </div>

      <!-- Error de carga -->
      <VAlert
        v-else-if="errorCarga"
        type="error"
        variant="tonal"
        density="compact"
        class="mb-3"
      >
        <div class="d-flex align-center justify-space-between flex-wrap gap-2">
          <span>{{ errorCarga }}</span>
          <VBtn
            size="x-small"
            variant="text"
            @click="cargarEstado"
          >
            Reintentar
          </VBtn>
        </div>
      </VAlert>

      <!-- Detalle de estado -->
      <template v-else-if="estado">
        <VAlert
          v-if="estado.conectada && !estado.correo_habilitado"
          type="warning"
          variant="tonal"
          class="mb-3"
        >
          Calendar está conectado, pero falta autorizar el envío de correos.
          Habilite Gmail API en Google Cloud, declare el permiso gmail.send y reconecte la misma cuenta desde aquí.
        </VAlert>
        <VChip v-if="estado.correo_habilitado" color="success" class="mb-3">
          Gmail autorizado para enviar correos
        </VChip>
        <VAlert
          v-if="!estado.configurada"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          El servidor aún no tiene configuradas las credenciales OAuth de Google Calendar. Las entrevistas virtuales seguirán guardándose y puedes registrar un enlace manual en el campo Lugar o enlace.
        </VAlert>

        <VAlert
          v-if="estado.ultimo_error?.mensaje"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          <div class="font-weight-bold">
            Último error reportado ({{ estado.ultimo_error.codigo }})
          </div>
          <div>{{ estado.ultimo_error.mensaje }}</div>
          <div
            v-if="estado.ultimo_error.at"
            class="text-caption mt-1"
          >
            Registrado: {{ formatearFechaHoraGuatemala(estado.ultimo_error.at) }} (GT)
          </div>
        </VAlert>

        <VAlert
          v-if="errorAccion"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ errorAccion }}
        </VAlert>

        <VRow
          dense
          class="mb-3"
        >
          <VCol
            cols="12"
            sm="6"
            md="3"
          >
            <div class="tt-detail-box h-100">
              <span>Configuración servidor</span>
              <strong>{{ estado.configurada ? 'Lista' : 'Pendiente' }}</strong>
            </div>
          </VCol>

          <VCol
            cols="12"
            sm="6"
            md="3"
          >
            <div class="tt-detail-box h-100">
              <span>Calendario objetivo</span>
              <strong>{{ estado.calendario || 'primary' }}</strong>
            </div>
          </VCol>

          <VCol
            cols="12"
            sm="6"
            md="3"
          >
            <div class="tt-detail-box h-100">
              <span>Última conexión</span>
              <strong>
                {{ estado.conectada_at ? `${formatearFechaHoraGuatemala(estado.conectada_at)} (GT)` : 'Sin conexión activa' }}
              </strong>
              <span
                v-if="nombreConectadoPor"
                class="d-block text-caption text-medium-emphasis mt-1"
              >
                Por: {{ nombreConectadoPor }}
              </span>
            </div>
          </VCol>

          <VCol
            cols="12"
            sm="6"
            md="3"
          >
            <div class="tt-detail-box h-100">
              <span>Sincronizaciones</span>
              <div class="d-flex flex-wrap gap-1 mt-1">
                <VChip
                  size="x-small"
                  :color="estado.sincronizaciones_pendientes > 0 ? 'warning' : 'secondary'"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ estado.sincronizaciones_pendientes }} pendientes
                </VChip>
                <VChip
                  size="x-small"
                  :color="estado.sincronizaciones_con_error > 0 ? 'error' : 'secondary'"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ estado.sincronizaciones_con_error }} con error
                </VChip>
              </div>
            </div>
          </VCol>
        </VRow>

        <!-- Advertencias del servidor -->
        <VAlert
          v-if="estado.advertencias?.length"
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          <ul class="ps-4 mb-0 text-caption">
            <li
              v-for="(advertencia, idx) in estado.advertencias"
              :key="idx"
            >
              {{ advertencia }}
            </li>
          </ul>
        </VAlert>

        <!-- Confirmación inline de desconexión -->
        <VExpandTransition>
          <div
            v-if="confirmarDesconexion && soportaDesconexion"
            class="tt-alert-card mb-3"
          >
            <div class="text-body-2 font-weight-bold mb-1">
              ¿Desconectar la cuenta compartida de Google?
            </div>
            <p class="text-caption text-medium-emphasis mb-3">
              Se revocarán y eliminarán los permisos almacenados en el servidor. Las entrevistas virtuales nuevas no generarán enlace automático de Google Meet hasta volver a autorizar la cuenta.
            </p>
            <div class="d-flex justify-end gap-2">
              <VBtn
                size="small"
                variant="tonal"
                color="secondary"
                :disabled="desconectando"
                @click="confirmarDesconexion = false"
              >
                Cancelar
              </VBtn>
              <VBtn
                size="small"
                color="error"
                prepend-icon="tabler-plug-x"
                :loading="desconectando"
                @click="ejecutarDesconexion"
              >
                Confirmar desconexión
              </VBtn>
            </div>
          </div>
        </VExpandTransition>

        <!-- Acciones administrativas -->
        <div
          v-if="puedeAdministrar"
          class="d-flex flex-wrap align-center justify-space-between gap-2 pt-1"
        >
          <span class="text-caption text-medium-emphasis">
            Al autorizar, serás redirigido a Google para aprobar el acceso con una cuenta personal autorizada (debes conceder el permiso de eventos del calendario).
          </span>

          <div class="d-flex flex-wrap gap-2">
            <VBtn
              v-if="soportaDesconexion && !confirmarDesconexion"
              size="small"
              color="error"
              variant="tonal"
              prepend-icon="tabler-plug-x"
              :disabled="autorizando || desconectando"
              @click="confirmarDesconexion = true"
            >
              Desconectar
            </VBtn>

            <VBtn
              size="small"
              color="primary"
              prepend-icon="tabler-brand-google"
              :loading="autorizando"
              :disabled="!estado.configurada || desconectando"
              @click="iniciarAutorizacion"
            >
              {{ etiquetaBotonAutorizar }}
            </VBtn>
          </div>
        </div>
      </template>
    </VCardText>
  </VCard>
</template>

<style scoped>
@import '@styles/reclutamiento-talent.scss';
</style>
