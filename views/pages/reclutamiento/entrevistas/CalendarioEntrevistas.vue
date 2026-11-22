<script setup lang="ts">
import FullCalendar from '@fullcalendar/vue3'
import dayGridPlugin from '@fullcalendar/daygrid'
import interactionPlugin from '@fullcalendar/interaction'
import listPlugin from '@fullcalendar/list'
import timeGridPlugin from '@fullcalendar/timegrid'
import esLocale from '@fullcalendar/core/locales/es'
import type { CalendarApi, CalendarOptions, DatesSetArg, EventClickArg, EventInput } from '@fullcalendar/core'
import { useDisplay } from 'vuetify'
import { useAbility } from '@casl/vue'
import type {
  Entrevista,
  EstadoEntrevista,
  EtapaReclutamiento,
  IntegracionGoogleCalendarEstado,
  ModalidadEntrevista,
  Postulacion,
  RespuestaCalendarioEntrevistas,
} from '@/types/reclutamiento'
import GoogleCalendarIntegracionCard from '@/views/pages/reclutamiento/entrevistas/GoogleCalendarIntegracionCard.vue'
import DetalleSeguimientoDialog from '@/views/pages/reclutamiento/postulaciones/DetalleSeguimientoDialog.vue'
import {
  MODALIDADES_ENTREVISTA,
  calcularFechaFinIso,
  colorEstadoEntrevista,
  colorEstadoGoogleCalendar,
  colorEstadoIntegracionGoogle,
  colorRecomendacionEntrevista,
  esUrlGoogleMeetValida,
  esUrlValida,
  etiquetaEstadoGoogleCalendar,
  etiquetaEstadoIntegracionGoogle,
  extraerFechaHoraGuatemala,
  extraerMensajeErrorApi,
  formatearDuracionMinutos,
  formatearFechaCortaGuatemala,
  formatearFechaHoraGuatemala,
  formatearHoraGuatemala,
  formatearRangoHorarioGuatemala,
  iconoEstadoGoogleCalendar,
  iconoModalidadEntrevista,
  puedeReintentarGoogleCalendar,
} from '@/utils/entrevistasGuatemala'
import {
  inicialesPersona,
  nombreCompletoPersona,
  obtenerEtapaNombre,
} from '@/utils/reclutamientoUx'

const route = useRoute()
const router = useRouter()
const { get, post } = useClienteRequest()
const { showToastError, showToastSuccess, showToastWarning } = useToast()
const { mdAndUp } = useDisplay()
const ability = useAbility()
const can = (action: string, subject: string) => ability.can(action, subject)

const puedeVer = computed(() => can('ver entrevistas', 'Entrevista'))
const puedeGestionar = computed(() => can('gestionar entrevistas', 'Entrevista'))

const mostrarPanelGoogle = ref(false)
const estadoGoogleCalendar = ref<IntegracionGoogleCalendarEstado | null>(null)
const callbackGoogleEstado = ref<'conectado' | 'error' | null>(null)
const callbackGoogleCodigo = ref<string | null>(null)
const reintentandoMeetDetalle = ref(false)

const MAX_DIAS_POR_TRAMO = 42
const TAMANO_PAGINA = 100
const MAX_PAGINAS_POR_TRAMO = 20

const ESTADOS_CALENDARIO: { valor: EstadoEntrevista; etiqueta: string; color: string }[] = [
  { valor: 'Programada', etiqueta: 'Programadas', color: 'primary' },
  { valor: 'Realizada', etiqueta: 'Realizadas', color: 'success' },
  { valor: 'Cancelada', etiqueta: 'Canceladas', color: 'secondary' },
]

const refCalendar = ref<InstanceType<typeof FullCalendar> | null>(null)
const sidebarAbierto = ref(true)

const cargando = ref(false)
const errorCarga = ref<string | null>(null)
const avisoParcial = ref<string | null>(null)

const entrevistas = ref<Entrevista[]>([])
const rangoActual = ref<{ desde: string; hasta: string } | null>(null)
const totalReportado = ref<number>(0)

const estadosSeleccionados = ref<EstadoEntrevista[]>(['Programada', 'Realizada', 'Cancelada'])
const filtroModalidad = ref<ModalidadEntrevista | null>(null)
const busquedaTexto = ref('')
const fechaSalto = ref('')

const modalDetalleEntrevista = ref(false)
const entrevistaSeleccionada = ref<Entrevista | null>(null)
const abriendoSeguimiento = ref(false)

const modalSeguimiento = ref(false)
const postulacionActiva = ref<Postulacion | null>(null)
const etapas = ref<EtapaReclutamiento[]>([])

let solicitudCalendario: AbortController | undefined
let secuenciaCalendario = 0

watch(mdAndUp, esEscritorio => {
  sidebarAbierto.value = esEscritorio
}, { immediate: true })

const obtenerCalendarApi = (): CalendarApi | null =>
  refCalendar.value?.getApi() ?? null

const formatearYmdLocal = (fecha: Date): string => {
  const anio = fecha.getFullYear()
  const mes = String(fecha.getMonth() + 1).padStart(2, '0')
  const dia = String(fecha.getDate()).padStart(2, '0')

  return `${anio}-${mes}-${dia}`
}

const parsearYmd = (ymd: string): Date => {
  const [anio, mes, dia] = ymd.split('-').map(Number)

  return new Date(anio, mes - 1, dia)
}

const sumarDiasYmd = (ymd: string, dias: number): string => {
  const fecha = parsearYmd(ymd)

  fecha.setDate(fecha.getDate() + dias)

  return formatearYmdLocal(fecha)
}

const dividirRangoEnTramos = (desde: string, hasta: string): Array<{ desde: string; hasta: string }> => {
  const tramos: Array<{ desde: string; hasta: string }> = []
  let inicio = desde

  while (inicio <= hasta) {
    const finTentativo = sumarDiasYmd(inicio, MAX_DIAS_POR_TRAMO - 1)
    const fin = finTentativo <= hasta ? finTentativo : hasta

    tramos.push({ desde: inicio, hasta: fin })
    inicio = sumarDiasYmd(fin, 1)
  }

  return tramos
}

const esEntrevistaVencidaSinResultado = (entrevista: Entrevista): boolean => {
  if (entrevista.estado !== 'Programada')
    return false

  const ms = new Date(entrevista.fecha_hora).getTime()

  return !Number.isNaN(ms) && ms < Date.now()
}

const verTodosEstados = computed({
  get: () => estadosSeleccionados.value.length === ESTADOS_CALENDARIO.length,
  set: (activo: boolean) => {
    estadosSeleccionados.value = activo
      ? ESTADOS_CALENDARIO.map(e => e.valor)
      : []
  },
})

const entrevistasFiltradas = computed(() => {
  const estadosActivos = new Set(estadosSeleccionados.value)
  const texto = busquedaTexto.value.trim().toLowerCase()

  return entrevistas.value.filter(item => {
    if (!estadosActivos.has(item.estado))
      return false
    if (filtroModalidad.value && item.modalidad !== filtroModalidad.value)
      return false
    if (texto) {
      const candidato = nombreCompletoPersona(item.postulacion?.candidato).toLowerCase()
      const puesto = (item.postulacion?.vacante?.puesto?.nombre || '').toLowerCase()
      const entrevistador = nombreCompletoPersona(item.entrevistador).toLowerCase()
      const lugar = (item.lugar || '').toLowerCase()

      if (
        !candidato.includes(texto)
        && !puesto.includes(texto)
        && !entrevistador.includes(texto)
        && !lugar.includes(texto)
      )
        return false
    }

    return true
  })
})

const conteosEstado = computed(() => {
  const conteo: Record<EstadoEntrevista, number> = {
    Programada: 0,
    Realizada: 0,
    Cancelada: 0,
  }

  for (const item of entrevistas.value)
    conteo[item.estado] = (conteo[item.estado] || 0) + 1

  return conteo
})

const pendientesResultadoEnRango = computed(() =>
  entrevistas.value
    .filter(esEntrevistaVencidaSinResultado)
    .sort((a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime()),
)

const etiquetaRangoVisible = computed(() => {
  if (!rangoActual.value)
    return 'Rango activo'

  const { desde, hasta } = rangoActual.value

  return desde === hasta ? desde : `${desde} al ${hasta}`
})

const claseEventoCalendario = (entrevista: Entrevista): string[] => {
  if (entrevista.estado === 'Realizada')
    return ['bg-light-success', 'text-success', 'entrevista-fc-event']
  if (entrevista.estado === 'Cancelada')
    return ['bg-light-secondary', 'text-secondary', 'entrevista-fc-event', 'entrevista-fc-event--cancelada']
  if (esEntrevistaVencidaSinResultado(entrevista))
    return ['bg-light-warning', 'text-warning', 'entrevista-fc-event']

  return ['bg-light-primary', 'text-primary', 'entrevista-fc-event']
}

const eventosCalendario = computed<EventInput[]>(() => {
  const items: EventInput[] = []

  for (const entrevista of entrevistasFiltradas.value) {
    const partes = extraerFechaHoraGuatemala(entrevista.fecha_hora)
    if (!partes.fecha || !partes.hora)
      continue

    const finIso = calcularFechaFinIso(entrevista.fecha_hora, entrevista.fecha_fin, entrevista.duracion_minutos)
    const partesFin = finIso ? extraerFechaHoraGuatemala(finIso) : { fecha: '', hora: '' }

    const candidato = nombreCompletoPersona(entrevista.postulacion?.candidato)
    const puesto = entrevista.postulacion?.vacante?.puesto?.nombre
    const titulo = puesto ? `${candidato} · ${puesto}` : candidato

    items.push({
      id: String(entrevista.id),
      title: titulo,
      start: `${partes.fecha}T${partes.hora}:00`,
      end: partesFin.fecha && partesFin.hora ? `${partesFin.fecha}T${partesFin.hora}:00` : undefined,
      allDay: false,
      classNames: claseEventoCalendario(entrevista),
      extendedProps: {
        entrevista,
        horaGt: formatearHoraGuatemala(entrevista.fecha_hora),
      },
    })
  }

  return items
})

const cargarRango = async (desde: string, hasta: string) => {
  if (!puedeVer.value)
    return

  solicitudCalendario?.abort()

  const controlador = new AbortController()
  const { signal } = controlador
  const secuenciaActual = ++secuenciaCalendario

  solicitudCalendario = controlador
  rangoActual.value = { desde, hasta }
  entrevistas.value = []
  totalReportado.value = 0
  cargando.value = true
  errorCarga.value = null
  avisoParcial.value = null

  const tramos = dividirRangoEnTramos(desde, hasta)
  const acumuladas = new Map<number, Entrevista>()
  let totalEsperado = 0
  let truncadoPorLimite = false

  try {
    for (const tramo of tramos) {
      let pagina = 1
      let ultimaPagina = 1

      do {
        const respuesta = await get<RespuestaCalendarioEntrevistas>(
          '/api/entrevistas/calendario',
          {
            params: {
              'desde': tramo.desde,
              'hasta': tramo.hasta,
              'page[number]': pagina,
              'page[size]': TAMANO_PAGINA,
            },
            signal,
          },
        )

        if (signal.aborted || secuenciaActual !== secuenciaCalendario)
          return

        const paginador = respuesta?.data
        if (respuesta?.success === false || !paginador || !Array.isArray(paginador.data))
          throw new Error('La respuesta del calendario de entrevistas no tiene el formato paginado esperado.')

        if (pagina === 1)
          totalEsperado += Number(paginador.total) || paginador.data.length

        ultimaPagina = Math.max(1, Number(paginador.last_page) || 1)

        for (const item of paginador.data) {
          if (item && typeof item.id === 'number')
            acumuladas.set(item.id, item)
        }

        if (pagina >= MAX_PAGINAS_POR_TRAMO && pagina < ultimaPagina) {
          truncadoPorLimite = true
          break
        }

        pagina += 1
      } while (pagina <= ultimaPagina)
    }

    if (signal.aborted || secuenciaActual !== secuenciaCalendario)
      return

    const listaOrdenada = Array.from(acumuladas.values()).sort(
      (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime(),
    )

    entrevistas.value = listaOrdenada
    totalReportado.value = Math.max(totalEsperado, listaOrdenada.length)

    if (truncadoPorLimite)
      avisoParcial.value = `Se cargaron ${listaOrdenada.length} de ${totalReportado.value} entrevistas en el rango visible. Acerca la vista a semana o día para ver el detalle completo.`
    else if (totalEsperado > listaOrdenada.length)
      avisoParcial.value = `Se muestran ${listaOrdenada.length} entrevistas únicas de ${totalEsperado} reportadas en el rango visible.`

    if (entrevistaSeleccionada.value) {
      const actualizada = listaOrdenada.find(e => e.id === entrevistaSeleccionada.value?.id)
      if (actualizada)
        entrevistaSeleccionada.value = actualizada
    }
  }
  catch (error: any) {
    if (signal.aborted || secuenciaActual !== secuenciaCalendario)
      return

    if (acumuladas.size > 0) {
      entrevistas.value = Array.from(acumuladas.values()).sort(
        (a, b) => new Date(a.fecha_hora).getTime() - new Date(b.fecha_hora).getTime(),
      )
      avisoParcial.value = `Carga interrumpida: se muestran ${entrevistas.value.length} entrevistas cargadas parcialmente antes del error.`
    }
    else {
      entrevistas.value = []
      totalReportado.value = 0
    }

    errorCarga.value = extraerMensajeErrorApi(error, 'No fue posible cargar el calendario de entrevistas.')
  }
  finally {
    if (!signal.aborted && secuenciaActual === secuenciaCalendario)
      cargando.value = false
  }
}

const recargarRangoActual = () => {
  if (!rangoActual.value)
    return

  cargarRango(rangoActual.value.desde, rangoActual.value.hasta)
}

const alCambiarFechas = (arg: DatesSetArg) => {
  const inicio = new Date(arg.start)
  const finExclusivo = new Date(arg.end)

  finExclusivo.setDate(finExclusivo.getDate() - 1)

  const desde = formatearYmdLocal(inicio)
  const hasta = finExclusivo >= inicio ? formatearYmdLocal(finExclusivo) : desde

  if (rangoActual.value?.desde === desde && rangoActual.value?.hasta === hasta)
    return

  cargarRango(desde, hasta)
}

const abrirDetalleEntrevista = (entrevista: Entrevista) => {
  entrevistaSeleccionada.value = entrevista
  modalDetalleEntrevista.value = true
}

const alHacerClicEvento = (info: EventClickArg) => {
  const entrevista = info.event.extendedProps?.entrevista as Entrevista | undefined
  if (entrevista)
    abrirDetalleEntrevista(entrevista)
}

const abrirSeguimientoEntrevista = async (entrevista: Entrevista) => {
  if (abriendoSeguimiento.value)
    return

  abriendoSeguimiento.value = true

  try {
    const resp = await get<{ success?: boolean; data?: Postulacion }>(
      `/api/postulaciones/${entrevista.postulacion_id}?include=candidato,vacante.puesto,vacante.unidad,etapaReclutamiento,responsable`,
    )

    if (resp?.success === false || !resp?.data?.id) {
      showToastError('No fue posible obtener los datos completos de la postulación.')

      return
    }

    postulacionActiva.value = resp.data
    modalDetalleEntrevista.value = false
    modalSeguimiento.value = true
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    abriendoSeguimiento.value = false
  }
}

const irAFecha = (fecha: string) => {
  if (!fecha)
    return

  obtenerCalendarApi()?.gotoDate(fecha)
}

const irAHoy = () => {
  obtenerCalendarApi()?.today()
}

const alActualizarDesdeDialogo = async (postulacionActualizada?: Postulacion) => {
  if (postulacionActualizada && postulacionActiva.value?.id === postulacionActualizada.id)
    postulacionActiva.value = postulacionActualizada

  recargarRangoActual()
}

const calendarOptions = computed<CalendarOptions>(() => ({
  plugins: [dayGridPlugin, interactionPlugin, timeGridPlugin, listPlugin],
  locale: esLocale,
  initialView: 'dayGridMonth',
  timeZone: 'local',
  firstDay: 1,
  height: 'auto',
  dayMaxEvents: 3,
  moreLinkText: cantidad => `+${cantidad} más`,
  defaultTimedEventDuration: '01:00:00',
  displayEventEnd: true,
  navLinks: true,
  editable: false,
  selectable: false,
  eventDisplay: 'block',
  eventTimeFormat: {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  },
  buttonText: {
    today: 'Hoy',
    month: 'Mes',
    week: 'Semana',
    day: 'Día',
    list: 'Lista',
  },
  customButtons: {
    drawerToggler: {
      text: 'Filtros',
      click() {
        sidebarAbierto.value = !sidebarAbierto.value
      },
    },
  },
  headerToolbar: {
    start: 'drawerToggler,prev,next,today title',
    end: 'dayGridMonth,timeGridWeek,timeGridDay,listMonth',
  },
  events: eventosCalendario.value,
  datesSet: alCambiarFechas,
  eventClick: alHacerClicEvento,
}))

const procesarCallbackGoogle = () => {
  const resultado = typeof route.query.google_calendar === 'string' ? route.query.google_calendar : null
  if (resultado !== 'conectado' && resultado !== 'error')
    return

  callbackGoogleEstado.value = resultado
  callbackGoogleCodigo.value = typeof route.query.codigo === 'string' ? route.query.codigo : null
  mostrarPanelGoogle.value = true

  const queryLimpio = { ...route.query }

  delete queryLimpio.google_calendar
  delete queryLimpio.codigo
  router.replace({ query: queryLimpio })
}

const limpiarCallbackGoogle = () => {
  callbackGoogleEstado.value = null
  callbackGoogleCodigo.value = null
}

const reintentarGoogleMeetDetalle = async () => {
  const entrevista = entrevistaSeleccionada.value
  if (!entrevista || reintentandoMeetDetalle.value || !puedeGestionar.value || !puedeReintentarGoogleCalendar(entrevista))
    return

  reintentandoMeetDetalle.value = true

  try {
    const respuesta = await post<{ success?: boolean; data?: Entrevista; message?: string }>(
      `/api/entrevistas/${entrevista.id}/google-calendar/sincronizar`,
      {},
    )

    if (respuesta?.success === false || !respuesta?.data) {
      showToastError(respuesta?.message || 'No fue posible reintentar la sincronización con Google Meet.')

      return
    }

    entrevistaSeleccionada.value = respuesta.data

    const gc = respuesta.data.google_calendar
    if (gc?.estado === 'Sincronizada' && esUrlGoogleMeetValida(gc.meet_url))
      showToastSuccess(respuesta.message || 'Enlace de Google Meet sincronizado correctamente.')
    else
      showToastWarning(respuesta.message || gc?.error?.mensaje || 'La sincronización con Google Meet aún requiere atención.')

    recargarRangoActual()
  }
  catch (error: any) {
    const status = error?.response?.status

    const msg = extraerMensajeErrorApi(
      error,
      status === 409
        ? 'Ya hay una sincronización con Google Calendar en curso para esta entrevista.'
        : 'No fue posible sincronizar el enlace de Google Meet.',
    )

    if (status === 409 || status === 422)
      showToastWarning(msg)
    else
      showToastError(msg)
  }
  finally {
    reintentandoMeetDetalle.value = false
  }
}

const cargarCatalogoEtapas = async () => {
  try {
    const resp = await get<any>('/api/catalogo/etapas-reclutamiento?limit=100')

    etapas.value = Array.isArray(resp?.data) ? resp.data : (resp?.data?.data || [])
  }
  catch {
    // El diálogo de seguimiento tiene fallback propio si el catálogo no cargó previamente
  }
}

onMounted(() => {
  procesarCallbackGoogle()
  cargarCatalogoEtapas()
})

onBeforeUnmount(() => {
  solicitudCalendario?.abort()
})
</script>

<template>
  <div
    v-if="puedeVer"
    class="calendario-entrevistas-page"
  >
    <!-- Encabezado institucional -->
    <header class="tt-page-header">
      <div>
        <span class="tt-eyebrow">CENTRO DE ENTREVISTAS · HORA GUATEMALA (UTC-06:00)</span>
        <h1 class="tt-page-title">
          Calendario de entrevistas
        </h1>
        <p class="tt-page-subtitle">
          Organiza tus entrevistas por mes, semana, día o lista y accede al seguimiento completo de cada postulación.
        </p>
      </div>

      <div class="d-flex flex-wrap align-center gap-2">
        <VChip
          size="small"
          color="primary"
          variant="tonal"
          class="font-weight-bold"
        >
          {{ conteosEstado.Programada }} {{ conteosEstado.Programada === 1 ? 'programada' : 'programadas' }}
        </VChip>
        <VChip
          size="small"
          color="success"
          variant="tonal"
          class="font-weight-bold"
        >
          {{ conteosEstado.Realizada }} {{ conteosEstado.Realizada === 1 ? 'realizada' : 'realizadas' }}
        </VChip>
        <VChip
          v-if="conteosEstado.Cancelada"
          size="small"
          color="secondary"
          variant="tonal"
          class="font-weight-bold"
        >
          {{ conteosEstado.Cancelada }} {{ conteosEstado.Cancelada === 1 ? 'cancelada' : 'canceladas' }}
        </VChip>
        <VBtn
          size="small"
          :variant="mostrarPanelGoogle ? 'flat' : 'tonal'"
          :color="estadoGoogleCalendar ? colorEstadoIntegracionGoogle(estadoGoogleCalendar.estado) : 'secondary'"
          prepend-icon="tabler-brand-google"
          @click="mostrarPanelGoogle = !mostrarPanelGoogle"
        >
          Google Meet<template v-if="estadoGoogleCalendar">
            : {{ etiquetaEstadoIntegracionGoogle(estadoGoogleCalendar.estado) }}
          </template>
        </VBtn>
        <VBtn
          size="small"
          variant="tonal"
          color="secondary"
          prepend-icon="tabler-refresh"
          :loading="cargando"
          @click="recargarRangoActual"
        >
          Actualizar
        </VBtn>
      </div>
    </header>

    <!-- Panel de estado y administración de Google Calendar / Meet compartido -->
    <VExpandTransition>
      <div
        v-show="mostrarPanelGoogle"
        class="mb-4"
      >
        <GoogleCalendarIntegracionCard
          :callback-estado="callbackGoogleEstado"
          :callback-codigo="callbackGoogleCodigo"
          @estado-actualizado="estadoGoogleCalendar = $event"
          @limpiar-callback="limpiarCallbackGoogle"
        />
      </div>
    </VExpandTransition>

    <!-- Calendario estilo plantilla Vuexy -->
    <VCard class="calendario-card">
      <VLayout style="z-index: 0;">
        <!-- Panel lateral de filtros y accesos rápidos -->
        <VNavigationDrawer
          v-model="sidebarAbierto"
          width="292"
          absolute
          touchless
          location="start"
          class="calendario-sidebar"
          :temporary="!mdAndUp"
        >
          <div class="pa-5">
            <div class="d-flex align-center justify-space-between gap-2 mb-3">
              <div>
                <span class="tt-eyebrow">RANGO VISIBLE (GT)</span>
                <div class="text-body-2 font-weight-bold mt-1">
                  {{ etiquetaRangoVisible }}
                </div>
                <div class="text-caption text-medium-emphasis mt-1">
                  Duración estándar de entrevista: 1 hora (60 min).
                </div>
              </div>
              <VBtn
                size="x-small"
                color="primary"
                variant="tonal"
                @click="irAHoy"
              >
                Hoy
              </VBtn>
            </div>

            <AppTextField
              v-model="fechaSalto"
              label="Ir a fecha"
              type="date"
              density="compact"
              hide-details
              class="mb-4"
              @update:model-value="valor => irAFecha(String(valor || ''))"
            />

            <VDivider class="mb-4" />

            <AppTextField
              v-model="busquedaTexto"
              label="Buscar entrevista"
              placeholder="Candidato, puesto o entrevistador..."
              prepend-inner-icon="tabler-search"
              density="compact"
              clearable
              hide-details
              class="mb-4"
            />

            <AppSelect
              v-model="filtroModalidad"
              label="Modalidad"
              placeholder="Todas las modalidades"
              :items="MODALIDADES_ENTREVISTA"
              density="compact"
              clearable
              hide-details
              class="mb-4"
            />

            <VDivider class="mb-4" />

            <p class="text-caption text-uppercase text-disabled font-weight-bold mb-2">
              Estados de entrevista
            </p>

            <div class="d-flex flex-column calendario-filtros-estado">
              <VCheckbox
                v-model="verTodosEstados"
                label="Ver todos"
                density="compact"
                hide-details
                color="primary"
              />
              <VCheckbox
                v-for="estado in ESTADOS_CALENDARIO"
                :key="estado.valor"
                v-model="estadosSeleccionados"
                :value="estado.valor"
                :color="estado.color"
                density="compact"
                hide-details
              >
                <template #label>
                  <div class="d-flex align-center justify-space-between flex-grow-1 gap-2">
                    <span class="text-body-2">{{ estado.etiqueta }}</span>
                    <VChip
                      size="x-small"
                      :color="estado.color"
                      variant="tonal"
                      class="font-weight-bold"
                    >
                      {{ conteosEstado[estado.valor] }}
                    </VChip>
                  </div>
                </template>
              </VCheckbox>
            </div>

            <!-- Pendientes de resultado en el rango visible -->
            <template v-if="pendientesResultadoEnRango.length">
              <VDivider class="my-4" />

              <div class="d-flex align-center justify-space-between mb-2">
                <span class="text-caption text-uppercase text-warning font-weight-bold">
                  Pendientes de resultado
                </span>
                <VChip
                  size="x-small"
                  color="warning"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ pendientesResultadoEnRango.length }}
                </VChip>
              </div>

              <div class="d-flex flex-column gap-2">
                <button
                  v-for="item in pendientesResultadoEnRango.slice(0, 6)"
                  :key="item.id"
                  type="button"
                  class="pendiente-mini-card text-start"
                  @click="abrirDetalleEntrevista(item)"
                >
                  <div class="text-body-2 font-weight-bold text-truncate">
                    {{ nombreCompletoPersona(item.postulacion?.candidato) }}
                  </div>
                  <div class="text-caption text-medium-emphasis text-truncate">
                    {{ formatearFechaCortaGuatemala(item.fecha_hora) }} · {{ formatearHoraGuatemala(item.fecha_hora) }} (GT)
                  </div>
                </button>
              </div>
            </template>
          </div>
        </VNavigationDrawer>

        <!-- Área principal del calendario -->
        <VMain>
          <VProgressLinear
            v-if="cargando"
            indeterminate
            color="primary"
            height="3"
            aria-label="Cargando entrevistas del rango"
          />

          <div
            v-if="errorCarga || avisoParcial"
            class="px-5 pt-4 d-flex flex-column gap-2"
          >
            <VAlert
              v-if="errorCarga"
              type="error"
              variant="tonal"
              density="compact"
            >
              <div class="d-flex align-center justify-space-between flex-wrap gap-2">
                <span>{{ errorCarga }}</span>
                <VBtn
                  size="small"
                  variant="text"
                  @click="recargarRangoActual"
                >
                  Reintentar
                </VBtn>
              </div>
            </VAlert>

            <VAlert
              v-if="avisoParcial"
              type="warning"
              variant="tonal"
              density="compact"
            >
              {{ avisoParcial }}
            </VAlert>
          </div>

          <VCard flat>
            <FullCalendar
              ref="refCalendar"
              :options="calendarOptions"
            />
          </VCard>
        </VMain>
      </VLayout>
    </VCard>

    <!-- Diálogo de detalle rápido del evento seleccionado -->
    <VDialog
      v-model="modalDetalleEntrevista"
      max-width="580"
    >
      <VCard
        v-if="entrevistaSeleccionada"
        class="tt-panel"
      >
        <div class="d-flex justify-space-between align-start pa-5 pb-4">
          <div class="d-flex align-center gap-3 min-w-0">
            <div class="tt-avatar tt-avatar--lg">
              {{ inicialesPersona(entrevistaSeleccionada.postulacion?.candidato?.nombres, entrevistaSeleccionada.postulacion?.candidato?.apellidos) }}
            </div>
            <div class="min-w-0">
              <div class="d-flex align-center flex-wrap gap-2">
                <h2 class="text-h6 font-weight-bold mb-0 text-truncate">
                  {{ nombreCompletoPersona(entrevistaSeleccionada.postulacion?.candidato) }}
                </h2>
                <VChip
                  size="x-small"
                  :color="colorEstadoEntrevista(entrevistaSeleccionada.estado)"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ entrevistaSeleccionada.estado }}
                </VChip>
                <VChip
                  v-if="esEntrevistaVencidaSinResultado(entrevistaSeleccionada)"
                  size="x-small"
                  color="warning"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  Pendiente de resultado
                </VChip>
              </div>
              <p class="text-body-2 text-medium-emphasis mb-0 mt-1 text-truncate">
                {{ entrevistaSeleccionada.postulacion?.vacante?.puesto?.nombre || `Postulación #${entrevistaSeleccionada.postulacion_id}` }}
                <template v-if="entrevistaSeleccionada.postulacion">
                  · {{ obtenerEtapaNombre(entrevistaSeleccionada.postulacion) }}
                </template>
              </p>
            </div>
          </div>

          <VBtn
            icon="tabler-x"
            variant="tonal"
            color="secondary"
            size="small"
            @click="modalDetalleEntrevista = false"
          />
        </div>

        <VDivider />

        <VCardText class="pa-5">
          <VRow dense>
            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Fecha y hora (Guatemala)</span>
                <strong>{{ formatearFechaHoraGuatemala(entrevistaSeleccionada.fecha_hora) }} (GT)</strong>
                <span class="d-block text-caption text-medium-emphasis mt-1">
                  {{ formatearRangoHorarioGuatemala(entrevistaSeleccionada.fecha_hora, entrevistaSeleccionada.fecha_fin, entrevistaSeleccionada.duracion_minutos) }} · {{ formatearDuracionMinutos(entrevistaSeleccionada.duracion_minutos) }}
                </span>
              </div>
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Modalidad</span>
                <strong class="d-flex align-center gap-1">
                  <VIcon
                    :icon="iconoModalidadEntrevista(entrevistaSeleccionada.modalidad)"
                    size="16"
                  />
                  {{ entrevistaSeleccionada.modalidad }}
                </strong>
              </div>
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Entrevistador</span>
                <strong>{{ nombreCompletoPersona(entrevistaSeleccionada.entrevistador) }}</strong>
              </div>
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Lugar o enlace</span>
                <strong
                  v-if="entrevistaSeleccionada.lugar && esUrlValida(entrevistaSeleccionada.lugar)"
                  class="text-truncate"
                >
                  <a
                    :href="entrevistaSeleccionada.lugar"
                    target="_blank"
                    rel="noopener noreferrer"
                    class="text-primary text-decoration-none"
                  >
                    Abrir enlace registrado
                    <VIcon
                      icon="tabler-external-link"
                      size="14"
                      class="ms-1"
                    />
                  </a>
                </strong>
                <strong v-else>
                  {{ entrevistaSeleccionada.lugar || 'Sin especificar' }}
                </strong>
              </div>
            </VCol>

            <VCol
              v-if="entrevistaSeleccionada.google_calendar && entrevistaSeleccionada.google_calendar.estado !== 'NoAplica'"
              cols="12"
            >
              <div class="tt-detail-box">
                <div class="d-flex flex-wrap align-center justify-space-between gap-2">
                  <div>
                    <span>Google Meet compartido</span>
                    <div class="mt-1">
                      <VChip
                        size="x-small"
                        :color="colorEstadoGoogleCalendar(entrevistaSeleccionada.google_calendar.estado)"
                        variant="tonal"
                        :prepend-icon="iconoEstadoGoogleCalendar(entrevistaSeleccionada.google_calendar.estado)"
                        class="font-weight-bold"
                      >
                        {{ etiquetaEstadoGoogleCalendar(entrevistaSeleccionada.google_calendar.estado) }}
                      </VChip>
                    </div>
                  </div>

                  <div class="d-flex flex-wrap gap-2">
                    <VBtn
                      v-if="esUrlGoogleMeetValida(entrevistaSeleccionada.google_calendar.meet_url)"
                      size="small"
                      color="success"
                      variant="flat"
                      prepend-icon="tabler-video"
                      append-icon="tabler-external-link"
                      :href="entrevistaSeleccionada.google_calendar.meet_url!"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Abrir Meet
                    </VBtn>
                    <VBtn
                      v-if="puedeGestionar && puedeReintentarGoogleCalendar(entrevistaSeleccionada)"
                      size="small"
                      color="warning"
                      variant="tonal"
                      prepend-icon="tabler-refresh"
                      :loading="reintentandoMeetDetalle"
                      @click="reintentarGoogleMeetDetalle"
                    >
                      Reintentar Meet
                    </VBtn>
                  </div>
                </div>

                <VAlert
                  v-if="entrevistaSeleccionada.google_calendar.estado === 'Error' || entrevistaSeleccionada.google_calendar.estado === 'MeetPendiente' || entrevistaSeleccionada.google_calendar.estado === 'Pendiente'"
                  :type="entrevistaSeleccionada.google_calendar.estado === 'Error' ? 'error' : 'warning'"
                  variant="tonal"
                  density="compact"
                  class="mt-2"
                >
                  <div class="text-caption">
                    <template v-if="entrevistaSeleccionada.google_calendar.error?.mensaje">
                      {{ entrevistaSeleccionada.google_calendar.error.mensaje }}
                    </template>
                    <template v-else-if="entrevistaSeleccionada.google_calendar.estado === 'MeetPendiente'">
                      Google Calendar aceptó el evento, pero el enlace de Google Meet aún está pendiente.
                    </template>
                    <template v-else>
                      La sincronización con Google Calendar está pendiente.
                    </template>
                    <span
                      v-if="entrevistaSeleccionada.google_calendar.proximo_intento_at"
                      class="d-block mt-1"
                    >
                      Próximo reintento automático: {{ formatearFechaHoraGuatemala(entrevistaSeleccionada.google_calendar.proximo_intento_at) }} (GT)
                    </span>
                  </div>
                </VAlert>
              </div>
            </VCol>

            <VCol
              v-if="entrevistaSeleccionada.estado === 'Realizada'"
              cols="12"
            >
              <div class="tt-detail-box">
                <span>Evaluación registrada</span>
                <div class="d-flex flex-wrap align-center gap-2 mt-1">
                  <VChip
                    v-if="entrevistaSeleccionada.recomendacion"
                    size="x-small"
                    :color="colorRecomendacionEntrevista(entrevistaSeleccionada.recomendacion)"
                    variant="tonal"
                    class="font-weight-bold"
                  >
                    {{ entrevistaSeleccionada.recomendacion }}
                  </VChip>
                  <VChip
                    v-if="entrevistaSeleccionada.puntuacion"
                    size="x-small"
                    color="primary"
                    variant="tonal"
                    class="font-weight-bold"
                  >
                    Puntuación: {{ entrevistaSeleccionada.puntuacion }}/5
                  </VChip>
                </div>
                <p
                  v-if="entrevistaSeleccionada.observaciones"
                  class="text-body-2 mt-2 mb-0"
                >
                  {{ entrevistaSeleccionada.observaciones }}
                </p>
              </div>
            </VCol>

            <VCol
              v-if="entrevistaSeleccionada.estado === 'Cancelada' && entrevistaSeleccionada.motivo_cancelacion"
              cols="12"
            >
              <div class="tt-detail-box">
                <span>Motivo de cancelación</span>
                <strong class="font-weight-regular">{{ entrevistaSeleccionada.motivo_cancelacion }}</strong>
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4 d-flex flex-wrap justify-space-between gap-2">
          <VBtn
            v-if="entrevistaSeleccionada.postulacion?.candidato_id && can('ver candidatos', 'Candidato')"
            size="small"
            variant="tonal"
            color="secondary"
            prepend-icon="tabler-id"
            :to="`/admin/candidatos/show/${entrevistaSeleccionada.postulacion.candidato_id}`"
          >
            Ver expediente
          </VBtn>
          <VSpacer v-else />

          <div class="d-flex flex-wrap gap-2">
            <VBtn
              size="small"
              variant="text"
              color="secondary"
              @click="modalDetalleEntrevista = false"
            >
              Cerrar
            </VBtn>
            <VBtn
              size="small"
              color="primary"
              :loading="abriendoSeguimiento"
              :prepend-icon="esEntrevistaVencidaSinResultado(entrevistaSeleccionada) && puedeGestionar ? 'tabler-clipboard-check' : 'tabler-arrow-right'"
              @click="abrirSeguimientoEntrevista(entrevistaSeleccionada)"
            >
              {{ esEntrevistaVencidaSinResultado(entrevistaSeleccionada) && puedeGestionar ? 'Registrar resultado y gestionar' : 'Abrir seguimiento y entrevistas' }}
            </VBtn>
          </div>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Diálogo completo de seguimiento y acciones de entrevistas -->
    <DetalleSeguimientoDialog
      v-model="modalSeguimiento"
      :postulacion="postulacionActiva"
      :etapas="etapas"
      seccion-inicial="entrevistas"
      @actualizado="alActualizarDesdeDialogo"
      @entrevista-actualizada="recargarRangoActual"
    />
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/libs/full-calendar";

.calendario-entrevistas-page {
  .calendario-card {
    overflow: hidden;
  }

  .calendario-sidebar {
    border-inline-end: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));
  }

  .calendario-filtros-estado {
    .v-selection-control__wrapper {
      margin-inline-end: 0.25rem;
    }

    .v-label {
      inline-size: 100%;
    }
  }

  .entrevista-fc-event {
    border-radius: 6px;
    font-weight: 500;
  }

  .entrevista-fc-event--cancelada {
    opacity: 0.72;
    text-decoration: line-through;
  }
}
</style>

<style scoped>
@import '@styles/reclutamiento-talent.scss';

.pendiente-mini-card {
  width: 100%;
  background: rgba(208, 131, 40, 0.08);
  border: 1px solid rgba(208, 131, 40, 0.28);
  border-radius: 8px;
  padding: 8px 10px;
  cursor: pointer;
  transition: border-color 0.14s ease, background-color 0.14s ease;
}

.pendiente-mini-card:hover {
  background: rgba(208, 131, 40, 0.14);
  border-color: rgba(208, 131, 40, 0.55);
}
</style>
