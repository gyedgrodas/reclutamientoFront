<script setup lang="ts">
import { useAbility } from '@casl/vue'
import { requiredValidator } from '@core/utils/validators'
import type {
  Entrevista,
  ModalidadEntrevista,
  PayloadCancelarEntrevista,
  PayloadProgramarEntrevista,
  PayloadResultadoEntrevista,
  RecomendacionEntrevista,
  UsuarioResumen,
} from '@/types/reclutamiento'
import {
  DURACION_ENTREVISTA_MINUTOS,
  MODALIDADES_ENTREVISTA,
  RECOMENDACIONES_ENTREVISTA,
  colorEstadoEntrevista,
  colorEstadoGoogleCalendar,
  colorRecomendacionEntrevista,
  construirIsoGuatemala,
  entrevistaGoogleRequiereAtencion,
  esUrlGoogleMeetValida,
  esUrlValida,
  etiquetaEstadoGoogleCalendar,
  extraerErroresCamposApi,
  extraerFechaHoraGuatemala,
  extraerMensajeErrorApi,
  fechaHoraSugeridaGuatemala,
  formatearDuracionMinutos,
  formatearFechaHoraGuatemala,
  formatearRangoHorarioGuatemala,
  iconoEstadoGoogleCalendar,
  iconoModalidadEntrevista,
  placeholderLugarModalidad,
  puedeReintentarGoogleCalendar,
} from '@/utils/entrevistasGuatemala'
import { nombreCompletoPersona, permiteProgramarEntrevistaEnEtapa } from '@/utils/reclutamientoUx'

const props = defineProps<{
  postulacionId: number
  etapaNombre?: string | null
  refreshKey?: number
}>()

const emit = defineEmits<{
  (e: 'entrevistaActualizada', entrevista: Entrevista): void
}>()

const { get, post, put } = useClienteRequest()
const { showToastError, showToastSuccess, showToastWarning } = useToast()
const ability = useAbility()
const can = (action: string, subject: string) => ability.can(action, subject)

const puedeVer = computed(() => can('ver entrevistas', 'Entrevista'))
const puedeGestionar = computed(() => can('gestionar entrevistas', 'Entrevista'))
const puedeProgramarEnEtapa = computed(() => permiteProgramarEntrevistaEnEtapa(props.etapaNombre))

const entrevistas = ref<Entrevista[]>([])
const cargando = ref(false)
const errorCarga = ref<string | null>(null)

const TAMANO_PAGINA_USUARIOS = 50
const TAMANO_BUSQUEDA_USUARIOS = 30

const usuariosPaginados = ref<UsuarioResumen[]>([])
const paginaUsuarios = ref(0)
const ultimaPaginaUsuarios = ref(1)
const totalUsuarios = ref<number | null>(null)
const usuariosBusqueda = ref<UsuarioResumen[]>([])
const usuarioSeleccionadoCache = ref<UsuarioResumen | null>(null)
const busquedaEntrevistador = ref('')
const modoBusquedaEntrevistador = ref(false)
const busquedaPosiblementeTruncada = ref(false)
const cargandoEntrevistadores = ref(false)
const cargandoMasEntrevistadores = ref(false)
const errorEntrevistadores = ref<string | null>(null)

type ModoFormulario = 'crear' | 'editar' | 'resultado' | 'cancelar' | null

const modoFormulario = ref<ModoFormulario>(null)
const entrevistaActiva = ref<Entrevista | null>(null)
const guardando = ref(false)
const reintentandoMeetId = ref<number | null>(null)
const errorAccion = ref<string | null>(null)
const erroresCampos = ref<Record<string, string[]>>({})

const formProgramacionRef = ref<{ validate: () => Promise<{ valid: boolean }>; resetValidation: () => void } | null>(null)
const formResultadoRef = ref<{ validate: () => Promise<{ valid: boolean }>; resetValidation: () => void } | null>(null)
const formCancelacionRef = ref<{ validate: () => Promise<{ valid: boolean }>; resetValidation: () => void } | null>(null)

const formProgramacion = reactive<{
  fecha: string
  hora: string
  entrevistadorId: number | null
  modalidad: ModalidadEntrevista
  lugar: string
}>({
  fecha: '',
  hora: '',
  entrevistadorId: null,
  modalidad: 'Presencial',
  lugar: '',
})

const formResultado = reactive<{
  recomendacion: RecomendacionEntrevista | null
  puntuacion: number
  observaciones: string
}>({
  recomendacion: null,
  puntuacion: 4,
  observaciones: '',
})

const formCancelacion = reactive<{
  motivo: string
}>({
  motivo: '',
})

let solicitudLista: AbortController | undefined
let solicitudSecuencia = 0
let solicitudEntrevistadores: AbortController | undefined
let solicitudEntrevistadoresSecuencia = 0
let temporizadorBusqueda: ReturnType<typeof setTimeout> | undefined

const etiquetaUsuario = (usuario: UsuarioResumen) =>
  `${usuario.nombres} ${usuario.apellidos} (${usuario.usuario_dominio})`

interface PaginaUsuarios {
  items: UsuarioResumen[]
  paginaActual: number
  ultimaPagina: number
  total: number | null
}

const extraerPaginaUsuarios = (respuesta: any): PaginaUsuarios | null => {
  if (!respuesta || typeof respuesta !== 'object' || respuesta.success === false)
    return null

  if (Array.isArray(respuesta.data)) {
    return {
      items: respuesta.data,
      paginaActual: 1,
      ultimaPagina: 1,
      total: respuesta.data.length,
    }
  }

  const paginado = respuesta.data
  if (!paginado || typeof paginado !== 'object' || !Array.isArray(paginado.data))
    return null

  return {
    items: paginado.data,
    paginaActual: Number(paginado.current_page || 1),
    ultimaPagina: Number(paginado.last_page || 1),
    total: typeof paginado.total === 'number' ? paginado.total : null,
  }
}

const combinarUsuariosUnicos = (...grupos: UsuarioResumen[][]): UsuarioResumen[] => {
  const mapa = new Map<number, UsuarioResumen>()

  for (const grupo of grupos) {
    for (const usuario of grupo) {
      if (usuario && typeof usuario.id === 'number')
        mapa.set(usuario.id, usuario)
    }
  }

  return Array.from(mapa.values())
}

const entrevistadoresOpciones = computed<UsuarioResumen[]>(() => {
  const base = modoBusquedaEntrevistador.value ? usuariosBusqueda.value : usuariosPaginados.value
  const extras: UsuarioResumen[] = []

  if (usuarioSeleccionadoCache.value)
    extras.push(usuarioSeleccionadoCache.value)
  if (entrevistaActiva.value?.entrevistador)
    extras.push(entrevistaActiva.value.entrevistador)

  return combinarUsuariosUnicos(base, extras)
})

const hayMasPaginasUsuarios = computed(() =>
  !modoBusquedaEntrevistador.value && paginaUsuarios.value < ultimaPaginaUsuarios.value,
)

const etiquetasPuntuacion: Record<number, string> = {
  1: 'Deficiente',
  2: 'Por debajo',
  3: 'Aceptable',
  4: 'Sobresaliente',
  5: 'Excepcional',
}

const cancelarSolicitudesEntrevistadores = () => {
  solicitudEntrevistadoresSecuencia += 1
  if (temporizadorBusqueda) {
    clearTimeout(temporizadorBusqueda)
    temporizadorBusqueda = undefined
  }
  solicitudEntrevistadores?.abort()
  solicitudEntrevistadores = undefined
  cargandoEntrevistadores.value = false
  cargandoMasEntrevistadores.value = false
}

const limpiarErroresAccion = () => {
  errorAccion.value = null
  erroresCampos.value = {}
}

const cerrarFormulario = () => {
  cancelarSolicitudesEntrevistadores()
  modoFormulario.value = null
  entrevistaActiva.value = null
  busquedaEntrevistador.value = ''
  modoBusquedaEntrevistador.value = false
  busquedaPosiblementeTruncada.value = false
  usuariosBusqueda.value = []
  errorEntrevistadores.value = null
  limpiarErroresAccion()
}

const cargarPaginaEntrevistadores = async (pagina = 1, reiniciar = false) => {
  if (!puedeGestionar.value)
    return
  if (!reiniciar && pagina === 1 && usuariosPaginados.value.length > 0)
    return

  cancelarSolicitudesEntrevistadores()

  const controlador = new AbortController()
  const { signal } = controlador
  const secuenciaActual = solicitudEntrevistadoresSecuencia

  solicitudEntrevistadores = controlador
  errorEntrevistadores.value = null

  if (pagina === 1)
    cargandoEntrevistadores.value = true
  else
    cargandoMasEntrevistadores.value = true

  try {
    const respuesta = await get<any>('/api/users', {
      params: {
        'page[number]': pagina,
        'page[size]': TAMANO_PAGINA_USUARIOS,
        'sort': 'nombres',
      },
      signal,
    })

    if (signal.aborted || secuenciaActual !== solicitudEntrevistadoresSecuencia)
      return

    const resultado = extraerPaginaUsuarios(respuesta)
    if (!resultado) {
      errorEntrevistadores.value = 'La respuesta de usuarios del servidor no tiene el formato esperado.'

      return
    }

    usuariosPaginados.value = reiniciar || pagina === 1
      ? resultado.items
      : combinarUsuariosUnicos(usuariosPaginados.value, resultado.items)
    paginaUsuarios.value = resultado.paginaActual
    ultimaPaginaUsuarios.value = resultado.ultimaPagina
    totalUsuarios.value = resultado.total
  }
  catch (error) {
    if (signal.aborted || secuenciaActual !== solicitudEntrevistadoresSecuencia)
      return

    errorEntrevistadores.value = extraerMensajeErrorApi(error, 'No fue posible cargar la lista de entrevistadores.')
  }
  finally {
    if (!signal.aborted && secuenciaActual === solicitudEntrevistadoresSecuencia) {
      cargandoEntrevistadores.value = false
      cargandoMasEntrevistadores.value = false
    }
  }
}

const buscarEntrevistadores = async (terminoRaw: string) => {
  if (!puedeGestionar.value)
    return

  const termino = terminoRaw.trim()
  if (!termino) {
    cancelarSolicitudesEntrevistadores()
    modoBusquedaEntrevistador.value = false
    busquedaPosiblementeTruncada.value = false
    usuariosBusqueda.value = []
    errorEntrevistadores.value = null
    await cargarPaginaEntrevistadores(1)

    return
  }

  cancelarSolicitudesEntrevistadores()

  const controlador = new AbortController()
  const { signal } = controlador
  const secuenciaActual = solicitudEntrevistadoresSecuencia

  solicitudEntrevistadores = controlador
  modoBusquedaEntrevistador.value = true
  busquedaPosiblementeTruncada.value = false
  cargandoEntrevistadores.value = true
  errorEntrevistadores.value = null

  try {
    const consultas: Promise<any>[] = [
      get<any>('/api/users', {
        params: { 'filter[nombres]': termino, 'page[size]': TAMANO_BUSQUEDA_USUARIOS, 'sort': 'nombres' },
        signal,
      }),
      get<any>('/api/users', {
        params: { 'filter[apellidos]': termino, 'page[size]': TAMANO_BUSQUEDA_USUARIOS, 'sort': 'nombres' },
        signal,
      }),
      get<any>('/api/users', {
        params: { 'filter[usuario_dominio]': termino, 'page[size]': TAMANO_BUSQUEDA_USUARIOS, 'sort': 'nombres' },
        signal,
      }),
    ]

    const tokens = termino.split(/\s+/).filter(Boolean)
    if (tokens.length >= 2) {
      consultas.push(
        get<any>('/api/users', {
          params: {
            'filter[nombres]': tokens[0],
            'filter[apellidos]': tokens.slice(1).join(' '),
            'page[size]': TAMANO_BUSQUEDA_USUARIOS,
            'sort': 'nombres',
          },
          signal,
        }),
      )
    }

    const respuestas = await Promise.all(consultas)
    if (signal.aborted || secuenciaActual !== solicitudEntrevistadoresSecuencia)
      return

    const paginas = respuestas.map(extraerPaginaUsuarios)
    if (paginas.includes(null)) {
      usuariosBusqueda.value = []
      busquedaPosiblementeTruncada.value = false
      errorEntrevistadores.value = 'La respuesta de búsqueda de usuarios no tiene el formato esperado.'

      return
    }

    const paginasValidas = paginas as PaginaUsuarios[]

    busquedaPosiblementeTruncada.value = paginasValidas.some(p =>
      p.paginaActual < p.ultimaPagina
      || (p.total !== null && p.items.length < p.total)
      || p.items.length >= TAMANO_BUSQUEDA_USUARIOS,
    )

    const combinados = combinarUsuariosUnicos(...paginasValidas.map(p => p.items))

    combinados.sort((a, b) =>
      `${a.nombres} ${a.apellidos}`.localeCompare(`${b.nombres} ${b.apellidos}`, 'es'),
    )
    usuariosBusqueda.value = combinados
  }
  catch (error) {
    if (signal.aborted || secuenciaActual !== solicitudEntrevistadoresSecuencia)
      return

    usuariosBusqueda.value = []
    busquedaPosiblementeTruncada.value = false
    errorEntrevistadores.value = extraerMensajeErrorApi(error, 'No fue posible buscar entrevistadores.')
  }
  finally {
    if (!signal.aborted && secuenciaActual === solicitudEntrevistadoresSecuencia)
      cargandoEntrevistadores.value = false
  }
}

const alCambiarBusquedaEntrevistador = (texto: string) => {
  const actual = texto || ''
  const seleccionado = entrevistadoresOpciones.value.find(u => u.id === formProgramacion.entrevistadorId)

  if (seleccionado && actual.trim() === etiquetaUsuario(seleccionado))
    return

  cancelarSolicitudesEntrevistadores()
  busquedaEntrevistador.value = actual
  errorEntrevistadores.value = null

  if (!actual.trim()) {
    modoBusquedaEntrevistador.value = false
    busquedaPosiblementeTruncada.value = false
    usuariosBusqueda.value = []
    if (!usuariosPaginados.value.length)
      cargarPaginaEntrevistadores(1)

    return
  }

  modoBusquedaEntrevistador.value = true
  busquedaPosiblementeTruncada.value = false
  temporizadorBusqueda = setTimeout(() => {
    buscarEntrevistadores(actual)
  }, 300)
}

const reintentarEntrevistadores = () => {
  if (modoBusquedaEntrevistador.value && busquedaEntrevistador.value.trim()) {
    buscarEntrevistadores(busquedaEntrevistador.value)

    return
  }

  const paginaObjetivo = usuariosPaginados.value.length > 0 && paginaUsuarios.value < ultimaPaginaUsuarios.value
    ? paginaUsuarios.value + 1
    : 1

  cargarPaginaEntrevistadores(paginaObjetivo, paginaObjetivo === 1)
}

const cargarMasEntrevistadores = () => {
  if (!hayMasPaginasUsuarios.value || cargandoMasEntrevistadores.value)
    return

  cargarPaginaEntrevistadores(paginaUsuarios.value + 1)
}

watch(() => formProgramacion.entrevistadorId, nuevoId => {
  if (!nuevoId) {
    usuarioSeleccionadoCache.value = null

    return
  }

  const encontrado = entrevistadoresOpciones.value.find(u => u.id === nuevoId)
  if (encontrado)
    usuarioSeleccionadoCache.value = encontrado
})

const cargarEntrevistas = async () => {
  if (!puedeVer.value || !props.postulacionId) {
    entrevistas.value = []
    cargando.value = false
    errorCarga.value = null

    return
  }

  solicitudLista?.abort()

  const controlador = new AbortController()
  const { signal } = controlador
  const postulacionObjetivo = props.postulacionId
  const secuenciaActual = ++solicitudSecuencia

  solicitudLista = controlador
  cargando.value = true
  errorCarga.value = null

  try {
    const respuesta = await get<{ success?: boolean; data?: Entrevista[] }>(
      `/api/postulaciones/${postulacionObjetivo}/entrevistas`,
      { signal },
    )

    if (signal.aborted || postulacionObjetivo !== props.postulacionId || secuenciaActual !== solicitudSecuencia)
      return

    if (respuesta?.success === false || !Array.isArray(respuesta?.data)) {
      errorCarga.value = 'La respuesta del servidor no tiene el formato esperado.'

      return
    }

    entrevistas.value = respuesta.data
  }
  catch (error) {
    if (signal.aborted || postulacionObjetivo !== props.postulacionId || secuenciaActual !== solicitudSecuencia)
      return

    errorCarga.value = extraerMensajeErrorApi(error, 'No fue posible cargar las entrevistas de esta postulación.')
  }
  finally {
    if (!signal.aborted && secuenciaActual === solicitudSecuencia)
      cargando.value = false
  }
}

const abrirCrear = () => {
  if (!puedeProgramarEnEtapa.value)
    return

  const sugerida = fechaHoraSugeridaGuatemala()

  cancelarSolicitudesEntrevistadores()
  entrevistaActiva.value = null
  usuarioSeleccionadoCache.value = null
  busquedaEntrevistador.value = ''
  modoBusquedaEntrevistador.value = false
  busquedaPosiblementeTruncada.value = false
  usuariosBusqueda.value = []
  formProgramacion.fecha = sugerida.fecha
  formProgramacion.hora = sugerida.hora
  formProgramacion.entrevistadorId = null
  formProgramacion.modalidad = 'Presencial'
  formProgramacion.lugar = ''
  limpiarErroresAccion()
  modoFormulario.value = 'crear'
  cargarPaginaEntrevistadores(1)
  nextTick(() => formProgramacionRef.value?.resetValidation())
}

const abrirReprogramar = (entrevista: Entrevista) => {
  const partes = extraerFechaHoraGuatemala(entrevista.fecha_hora)

  cancelarSolicitudesEntrevistadores()
  entrevistaActiva.value = entrevista
  usuarioSeleccionadoCache.value = entrevista.entrevistador ?? null
  busquedaEntrevistador.value = ''
  modoBusquedaEntrevistador.value = false
  busquedaPosiblementeTruncada.value = false
  usuariosBusqueda.value = []
  formProgramacion.fecha = partes.fecha
  formProgramacion.hora = partes.hora
  formProgramacion.entrevistadorId = entrevista.entrevistador_id
  formProgramacion.modalidad = entrevista.modalidad
  formProgramacion.lugar = entrevista.lugar ?? ''
  limpiarErroresAccion()
  modoFormulario.value = 'editar'
  cargarPaginaEntrevistadores(1)
  nextTick(() => formProgramacionRef.value?.resetValidation())
}

const abrirResultado = (entrevista: Entrevista) => {
  entrevistaActiva.value = entrevista
  formResultado.recomendacion = entrevista.recomendacion ?? 'Avanzar'
  formResultado.puntuacion = entrevista.puntuacion ?? 4
  formResultado.observaciones = entrevista.observaciones ?? ''
  limpiarErroresAccion()
  modoFormulario.value = 'resultado'
  nextTick(() => formResultadoRef.value?.resetValidation())
}

const abrirCancelar = (entrevista: Entrevista) => {
  entrevistaActiva.value = entrevista
  formCancelacion.motivo = ''
  limpiarErroresAccion()
  modoFormulario.value = 'cancelar'
  nextTick(() => formCancelacionRef.value?.resetValidation())
}

const validarFechaGt = (valor: string) => {
  if (!valor)
    return 'La fecha es obligatoria'

  return construirIsoGuatemala(valor, formProgramacion.hora || '09:00') !== null || 'Ingrese una fecha válida'
}

const validarHoraGt = (valor: string) => {
  if (!valor)
    return 'La hora es obligatoria'

  return /^\d{2}:\d{2}$/.test(valor) || 'Ingrese una hora válida'
}

const validarTextoRequerido = (mensaje: string, max = 2000) => (valor: unknown) => {
  const texto = String(valor ?? '').trim()
  if (!texto.length)
    return mensaje
  if (texto.length > max)
    return `Máximo ${max} caracteres`

  return true
}

const validarLugarOpcional = (valor: unknown) => {
  const texto = String(valor ?? '').trim()

  return texto.length <= 500 || 'Máximo 500 caracteres'
}

const guardarProgramacion = async () => {
  if (guardando.value || !puedeGestionar.value)
    return

  limpiarErroresAccion()

  const validacion = await formProgramacionRef.value?.validate()
  if (!validacion?.valid)
    return

  const fechaHoraIso = construirIsoGuatemala(formProgramacion.fecha, formProgramacion.hora)
  if (!fechaHoraIso) {
    errorAccion.value = 'La fecha u hora ingresada en zona de Guatemala no es válida.'

    return
  }

  if (!formProgramacion.entrevistadorId) {
    errorAccion.value = 'Debe seleccionar un entrevistador.'

    return
  }

  const payload: PayloadProgramarEntrevista = {
    fecha_hora: fechaHoraIso,
    entrevistador_id: Number(formProgramacion.entrevistadorId),
    modalidad: formProgramacion.modalidad,
    lugar: formProgramacion.lugar.trim() || null,
  }

  guardando.value = true

  try {
    const esEdicion = modoFormulario.value === 'editar' && entrevistaActiva.value

    const respuesta = esEdicion
      ? await put<{ data: Entrevista; message?: string }>(`/api/entrevistas/${entrevistaActiva.value!.id}`, payload)
      : await post<{ data: Entrevista; message?: string }>(`/api/postulaciones/${props.postulacionId}/entrevistas`, payload)

    if (entrevistaGoogleRequiereAtencion(respuesta.data)) {
      const detalleGoogle = respuesta.data?.google_calendar?.error?.mensaje

      const mensajeBase = respuesta.message
        || (esEdicion ? 'Entrevista reprogramada, pero Google Meet requiere atención.' : 'Entrevista guardada, pero Google Meet requiere atención.')

      showToastWarning(detalleGoogle && !mensajeBase.includes(detalleGoogle) ? `${mensajeBase} ${detalleGoogle}` : mensajeBase)
    }
    else {
      showToastSuccess(respuesta.message || (esEdicion ? 'Entrevista reprogramada con éxito.' : 'Entrevista programada con éxito.'))
    }

    cerrarFormulario()
    if (respuesta.data)
      emit('entrevistaActualizada', respuesta.data)
    await cargarEntrevistas()
  }
  catch (error) {
    erroresCampos.value = extraerErroresCamposApi(error)
    errorAccion.value = extraerMensajeErrorApi(error, 'No fue posible guardar la entrevista.')
  }
  finally {
    guardando.value = false
  }
}

const guardarResultado = async () => {
  if (guardando.value || !entrevistaActiva.value || !puedeGestionar.value)
    return

  limpiarErroresAccion()

  const validacion = await formResultadoRef.value?.validate()
  if (!validacion?.valid)
    return

  const puntuacionEntera = Math.round(Number(formResultado.puntuacion))
  if (!Number.isInteger(puntuacionEntera) || puntuacionEntera < 1 || puntuacionEntera > 5) {
    errorAccion.value = 'La puntuación debe ser un número entero entre 1 y 5.'

    return
  }

  if (!formResultado.recomendacion) {
    errorAccion.value = 'Debe seleccionar una recomendación.'

    return
  }

  const payload: PayloadResultadoEntrevista = {
    recomendacion: formResultado.recomendacion,
    puntuacion: puntuacionEntera,
    observaciones: formResultado.observaciones.trim(),
  }

  guardando.value = true

  try {
    const respuesta = await post<{ data: Entrevista; message?: string }>(
      `/api/entrevistas/${entrevistaActiva.value.id}/resultado`,
      payload,
    )

    showToastSuccess(respuesta.message || 'Resultado de entrevista registrado con éxito.')
    cerrarFormulario()
    if (respuesta.data)
      emit('entrevistaActualizada', respuesta.data)
    await cargarEntrevistas()
  }
  catch (error) {
    erroresCampos.value = extraerErroresCamposApi(error)
    errorAccion.value = extraerMensajeErrorApi(error, 'No fue posible registrar el resultado de la entrevista.')
  }
  finally {
    guardando.value = false
  }
}

const confirmarCancelacion = async () => {
  if (guardando.value || !entrevistaActiva.value || !puedeGestionar.value)
    return

  limpiarErroresAccion()

  const validacion = await formCancelacionRef.value?.validate()
  if (!validacion?.valid)
    return

  const payload: PayloadCancelarEntrevista = {
    motivo: formCancelacion.motivo.trim(),
  }

  guardando.value = true

  try {
    const respuesta = await post<{ data: Entrevista; message?: string }>(
      `/api/entrevistas/${entrevistaActiva.value.id}/cancelar`,
      payload,
    )

    if (entrevistaGoogleRequiereAtencion(respuesta.data))
      showToastWarning(respuesta.message || 'Entrevista cancelada, pero no fue posible eliminar el evento en Google Calendar.')
    else
      showToastSuccess(respuesta.message || 'Entrevista cancelada con éxito.')

    cerrarFormulario()
    if (respuesta.data)
      emit('entrevistaActualizada', respuesta.data)
    await cargarEntrevistas()
  }
  catch (error) {
    erroresCampos.value = extraerErroresCamposApi(error)
    errorAccion.value = extraerMensajeErrorApi(error, 'No fue posible cancelar la entrevista.')
  }
  finally {
    guardando.value = false
  }
}

const reintentarGoogleMeet = async (entrevista: Entrevista) => {
  if (reintentandoMeetId.value !== null || !puedeGestionar.value || !puedeReintentarGoogleCalendar(entrevista))
    return

  reintentandoMeetId.value = entrevista.id

  try {
    const respuesta = await post<{ success?: boolean; data?: Entrevista; message?: string }>(
      `/api/entrevistas/${entrevista.id}/google-calendar/sincronizar`,
      {},
    )

    if (respuesta?.success === false || !respuesta?.data) {
      showToastError(respuesta?.message || 'No fue posible reintentar la sincronización con Google Meet.')

      return
    }

    const actualizada = respuesta.data
    const gc = actualizada.google_calendar

    if (gc?.estado === 'Sincronizada' && esUrlGoogleMeetValida(gc.meet_url))
      showToastSuccess(respuesta.message || 'Enlace de Google Meet sincronizado correctamente.')
    else
      showToastWarning(respuesta.message || gc?.error?.mensaje || 'La sincronización con Google Meet aún requiere atención.')

    emit('entrevistaActualizada', actualizada)
    await cargarEntrevistas()
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
    reintentandoMeetId.value = null
  }
}

const horarioProgramacionPreview = computed<string | null>(() => {
  const iso = construirIsoGuatemala(formProgramacion.fecha, formProgramacion.hora)
  if (!iso)
    return null

  return formatearRangoHorarioGuatemala(iso, null, DURACION_ENTREVISTA_MINUTOS)
})

const conteoProgramadas = computed(() => entrevistas.value.filter(e => e.estado === 'Programada').length)

watch(() => props.postulacionId, () => {
  solicitudLista?.abort()
  entrevistas.value = []
  errorCarga.value = null
  cerrarFormulario()
  cargarEntrevistas()
})

watch(() => props.refreshKey, () => {
  cargarEntrevistas()
})

watch(puedeProgramarEnEtapa, permitido => {
  if (!permitido && modoFormulario.value === 'crear')
    cerrarFormulario()
})

onMounted(() => {
  cargarEntrevistas()
})

onBeforeUnmount(() => {
  solicitudLista?.abort()
  cancelarSolicitudesEntrevistadores()
})
</script>

<template>
  <section
    v-if="puedeVer"
    class="entrevistas-panel"
  >
    <!-- Cabecera del panel -->
    <div class="d-flex flex-wrap align-center justify-space-between gap-2 mb-3">
      <div>
        <span class="tt-eyebrow">CENTRO DE ENTREVISTAS</span>
        <div class="d-flex align-center flex-wrap gap-2 mt-1">
          <h3 class="text-subtitle-1 font-weight-bold mb-0">
            Agenda y evaluaciones
          </h3>
          <VChip
            v-if="entrevistas.length"
            size="x-small"
            color="primary"
            variant="tonal"
            class="font-weight-bold"
          >
            {{ entrevistas.length }} {{ entrevistas.length === 1 ? 'entrevista' : 'entrevistas' }}
          </VChip>
          <VChip
            v-if="conteoProgramadas"
            size="x-small"
            color="warning"
            variant="tonal"
            class="font-weight-bold"
          >
            {{ conteoProgramadas }} {{ conteoProgramadas === 1 ? 'programada' : 'programadas' }}
          </VChip>
        </div>
      </div>

      <div class="d-flex flex-wrap align-center gap-2">
        <VBtn
          v-if="puedeGestionar && puedeProgramarEnEtapa && modoFormulario !== 'crear'"
          size="small"
          color="primary"
          prepend-icon="tabler-calendar-plus"
          @click="abrirCrear"
        >
          Programar entrevista
        </VBtn>
        <VChip
          v-else-if="puedeGestionar && !puedeProgramarEnEtapa"
          size="small"
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-info-circle"
        >
          Programación habilitada en etapas de entrevista u oferta y cierre
        </VChip>
      </div>
    </div>

    <!-- Formulario inline: Programar / Reprogramar -->
    <VExpandTransition>
      <div
        v-if="modoFormulario === 'crear' || modoFormulario === 'editar'"
        class="tt-detail-box mb-4"
      >
        <div class="d-flex flex-wrap justify-space-between align-center gap-2 mb-3">
          <div>
            <strong class="mt-0">
              {{ modoFormulario === 'editar' ? 'Reprogramar entrevista' : 'Programar nueva entrevista' }}
            </strong>
            <div class="text-caption text-medium-emphasis d-flex align-center gap-1 mt-1">
              <VIcon
                icon="tabler-world-clock"
                size="14"
              />
              <span>Hora de Guatemala (UTC-06:00)</span>
            </div>
          </div>
          <VBtn
            size="x-small"
            variant="text"
            color="secondary"
            :disabled="guardando"
            @click="cerrarFormulario"
          >
            Cancelar
          </VBtn>
        </div>

        <VAlert
          v-if="errorAccion"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ errorAccion }}
        </VAlert>

        <VAlert
          v-if="errorEntrevistadores"
          type="warning"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          <div class="d-flex align-center justify-space-between flex-wrap gap-2">
            <span>{{ errorEntrevistadores }}</span>
            <VBtn
              size="x-small"
              variant="text"
              @click="reintentarEntrevistadores"
            >
              Reintentar
            </VBtn>
          </div>
        </VAlert>

        <VForm
          ref="formProgramacionRef"
          @submit.prevent="guardarProgramacion"
        >
          <VRow dense>
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="formProgramacion.fecha"
                label="Fecha (Guatemala) *"
                type="date"
                :rules="[validarFechaGt]"
                :error-messages="erroresCampos.fecha_hora"
              />
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="formProgramacion.hora"
                label="Hora (Guatemala -06:00) *"
                type="time"
                :rules="[validarHoraGt]"
              />
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <AppAutocomplete
                v-model="formProgramacion.entrevistadorId"
                label="Entrevistador *"
                placeholder="Buscar por nombre, apellido o usuario..."
                :items="entrevistadoresOpciones"
                :item-title="etiquetaUsuario"
                item-value="id"
                :loading="cargandoEntrevistadores"
                :no-filter="modoBusquedaEntrevistador"
                :no-data-text="cargandoEntrevistadores ? 'Buscando usuarios...' : 'No se encontraron usuarios'"
                :rules="[requiredValidator]"
                :error-messages="erroresCampos.entrevistador_id"
                clearable
                @update:search="alCambiarBusquedaEntrevistador"
              >
                <template
                  v-if="hayMasPaginasUsuarios || (modoBusquedaEntrevistador && busquedaPosiblementeTruncada)"
                  #append-item
                >
                  <VDivider />
                  <div
                    v-if="hayMasPaginasUsuarios"
                    class="d-flex align-center justify-space-between gap-2 px-3 py-2"
                  >
                    <span class="text-caption text-medium-emphasis">
                      Mostrando {{ usuariosPaginados.length }}<template v-if="totalUsuarios !== null">
                        de {{ totalUsuarios }}
                      </template>
                    </span>
                    <VBtn
                      size="x-small"
                      variant="tonal"
                      color="primary"
                      :loading="cargandoMasEntrevistadores"
                      @click.stop.prevent="cargarMasEntrevistadores"
                    >
                      Cargar más
                    </VBtn>
                  </div>
                  <div
                    v-else
                    class="px-3 py-2 text-caption text-warning d-flex align-center gap-1"
                  >
                    <VIcon
                      icon="tabler-alert-circle"
                      size="14"
                      class="flex-shrink-0"
                    />
                    <span>
                      Resultados parciales (hasta {{ TAMANO_BUSQUEDA_USUARIOS }} por criterio); escribe un término más específico si no encuentras al usuario.
                    </span>
                  </div>
                </template>
              </AppAutocomplete>
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="formProgramacion.modalidad"
                label="Modalidad *"
                :items="MODALIDADES_ENTREVISTA"
                :rules="[requiredValidator]"
                :error-messages="erroresCampos.modalidad"
              />
            </VCol>

            <VCol
              v-if="formProgramacion.modalidad === 'Virtual'"
              cols="12"
            >
              <VAlert
                type="info"
                variant="tonal"
                density="compact"
                icon="tabler-video"
              >
                <div class="text-caption">
                  <strong>Google Meet automático · Duración fija de 1 hora (60 min)</strong>
                  <template v-if="horarioProgramacionPreview">
                    ({{ horarioProgramacionPreview }} GT)
                  </template>
                  . Si la cuenta compartida de Google está conectada, el enlace de Meet se generará automáticamente al guardar (sin enviar datos personales ni invitaciones). El campo <em>Lugar o enlace</em> sigue disponible como respaldo manual.
                </div>
              </VAlert>
            </VCol>

            <VCol cols="12">
              <AppTextField
                v-model="formProgramacion.lugar"
                label="Lugar o enlace (opcional)"
                :placeholder="placeholderLugarModalidad(formProgramacion.modalidad)"
                :rules="[validarLugarOpcional]"
                :counter="500"
                :error-messages="erroresCampos.lugar"
                clearable
              />
            </VCol>

            <VCol
              cols="12"
              class="d-flex justify-end gap-2 mt-2"
            >
              <VBtn
                size="small"
                variant="tonal"
                color="secondary"
                :disabled="guardando"
                @click="cerrarFormulario"
              >
                Cancelar
              </VBtn>
              <VBtn
                size="small"
                type="submit"
                color="primary"
                prepend-icon="tabler-check"
                :loading="guardando"
              >
                {{ modoFormulario === 'editar' ? 'Guardar reprogramación' : 'Confirmar entrevista' }}
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </div>
    </VExpandTransition>

    <!-- Formulario inline: Registrar resultado -->
    <VExpandTransition>
      <div
        v-if="modoFormulario === 'resultado' && entrevistaActiva"
        class="tt-detail-box mb-4"
      >
        <div class="d-flex flex-wrap justify-space-between align-center gap-2 mb-3">
          <div>
            <strong class="mt-0">Registrar resultado de entrevista</strong>
            <div class="text-caption text-medium-emphasis mt-1">
              {{ formatearFechaHoraGuatemala(entrevistaActiva.fecha_hora) }} (GT) · {{ entrevistaActiva.modalidad }}
            </div>
          </div>
          <VBtn
            size="x-small"
            variant="text"
            color="secondary"
            :disabled="guardando"
            @click="cerrarFormulario"
          >
            Cancelar
          </VBtn>
        </div>

        <VAlert
          type="info"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          El resultado quedará registrado en el expediente sin cambiar automáticamente la etapa de la postulación.
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

        <VForm
          ref="formResultadoRef"
          @submit.prevent="guardarResultado"
        >
          <VRow dense>
            <VCol
              cols="12"
              sm="6"
            >
              <AppSelect
                v-model="formResultado.recomendacion"
                label="Recomendación *"
                :items="RECOMENDACIONES_ENTREVISTA"
                :rules="[requiredValidator]"
                :error-messages="erroresCampos.recomendacion"
              />
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <span class="d-block text-body-2 mb-1">
                Puntuación (1 a 5) *
              </span>
              <div class="d-flex align-center flex-wrap gap-1">
                <VBtn
                  v-for="nota in [1, 2, 3, 4, 5]"
                  :key="nota"
                  size="small"
                  :variant="formResultado.puntuacion === nota ? 'flat' : 'tonal'"
                  :color="formResultado.puntuacion === nota ? 'primary' : 'secondary'"
                  min-width="36"
                  @click="formResultado.puntuacion = nota"
                >
                  {{ nota }}
                </VBtn>
                <span class="text-caption text-medium-emphasis ms-2">
                  {{ etiquetasPuntuacion[formResultado.puntuacion] }}
                </span>
              </div>
              <div
                v-if="erroresCampos.puntuacion?.length"
                class="text-caption text-error mt-1"
              >
                {{ erroresCampos.puntuacion[0] }}
              </div>
            </VCol>

            <VCol cols="12">
              <AppTextarea
                v-model="formResultado.observaciones"
                label="Observaciones de evaluación *"
                placeholder="Fortalezas, hallazgos técnicos, ajuste cultural y conclusiones clave..."
                rows="3"
                :rules="[validarTextoRequerido('Las observaciones son obligatorias')]"
                :error-messages="erroresCampos.observaciones"
              />
            </VCol>

            <VCol
              cols="12"
              class="d-flex justify-end gap-2 mt-2"
            >
              <VBtn
                size="small"
                variant="tonal"
                color="secondary"
                :disabled="guardando"
                @click="cerrarFormulario"
              >
                Cancelar
              </VBtn>
              <VBtn
                size="small"
                type="submit"
                color="success"
                prepend-icon="tabler-clipboard-check"
                :loading="guardando"
              >
                Guardar resultado
              </VBtn>
            </VCol>
          </VRow>
        </VForm>
      </div>
    </VExpandTransition>

    <!-- Formulario inline: Cancelar entrevista -->
    <VExpandTransition>
      <div
        v-if="modoFormulario === 'cancelar' && entrevistaActiva"
        class="tt-alert-card mb-4"
      >
        <div class="d-flex flex-wrap justify-space-between align-center gap-2 mb-2">
          <div>
            <strong class="text-body-2 font-weight-bold d-block">
              Cancelar entrevista programada
            </strong>
            <span class="text-caption text-medium-emphasis">
              {{ formatearFechaHoraGuatemala(entrevistaActiva.fecha_hora) }} (GT) · {{ nombreCompletoPersona(entrevistaActiva.entrevistador) }}
            </span>
          </div>
          <VBtn
            size="x-small"
            variant="text"
            color="secondary"
            :disabled="guardando"
            @click="cerrarFormulario"
          >
            Volver
          </VBtn>
        </div>

        <VAlert
          v-if="errorAccion"
          type="error"
          variant="tonal"
          density="compact"
          class="mb-3"
        >
          {{ errorAccion }}
        </VAlert>

        <VForm
          ref="formCancelacionRef"
          @submit.prevent="confirmarCancelacion"
        >
          <AppTextarea
            v-model="formCancelacion.motivo"
            label="Motivo de cancelación *"
            placeholder="Ej. El candidato solicitó reprogramar para la próxima semana..."
            rows="2"
            :rules="[validarTextoRequerido('Debe indicar el motivo de la cancelación')]"
            :error-messages="erroresCampos.motivo"
          />

          <div class="d-flex justify-end gap-2 mt-3">
            <VBtn
              size="small"
              variant="tonal"
              color="secondary"
              :disabled="guardando"
              @click="cerrarFormulario"
            >
              Conservar entrevista
            </VBtn>
            <VBtn
              size="small"
              type="submit"
              color="error"
              prepend-icon="tabler-calendar-x"
              :loading="guardando"
            >
              Confirmar cancelación
            </VBtn>
          </div>
        </VForm>
      </div>
    </VExpandTransition>

    <!-- Estado de carga -->
    <div
      v-if="cargando"
      role="status"
      class="py-3"
    >
      <p class="text-caption text-medium-emphasis mb-2">
        Cargando entrevistas de la postulación…
      </p>
      <VProgressLinear
        indeterminate
        color="primary"
        rounded
        aria-label="Cargando entrevistas"
      />
    </div>

    <!-- Estado de error -->
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
          @click="cargarEntrevistas"
        >
          Reintentar
        </VBtn>
      </div>
    </VAlert>

    <!-- Estado vacío -->
    <div
      v-else-if="!entrevistas.length"
      class="tt-detail-box text-center py-6"
      role="status"
    >
      <VIcon
        icon="tabler-calendar-event"
        size="28"
        class="text-disabled mb-2"
      />
      <p class="text-body-2 text-medium-emphasis mb-2">
        Aún no hay entrevistas registradas para esta postulación.
      </p>
      <VBtn
        v-if="puedeGestionar && modoFormulario !== 'crear'"
        size="small"
        color="primary"
        variant="tonal"
        prepend-icon="tabler-calendar-plus"
        @click="abrirCrear"
      >
        Programar primera entrevista
      </VBtn>
    </div>

    <!-- Lista de entrevistas -->
    <div
      v-else
      class="d-flex flex-column gap-3"
    >
      <article
        v-for="entrevista in entrevistas"
        :key="entrevista.id"
        class="entrevista-card"
        :class="{ 'entrevista-card--programada': entrevista.estado === 'Programada' }"
      >
        <div class="d-flex flex-wrap align-start justify-space-between gap-2">
          <div class="min-w-0">
            <div class="d-flex flex-wrap align-center gap-2">
              <VChip
                size="x-small"
                :color="colorEstadoEntrevista(entrevista.estado)"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ entrevista.estado }}
              </VChip>
              <VChip
                size="x-small"
                color="secondary"
                variant="outlined"
                :prepend-icon="iconoModalidadEntrevista(entrevista.modalidad)"
              >
                {{ entrevista.modalidad }}
              </VChip>
              <VChip
                v-if="entrevista.recomendacion"
                size="x-small"
                :color="colorRecomendacionEntrevista(entrevista.recomendacion)"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ entrevista.recomendacion }}
              </VChip>
              <VChip
                v-if="entrevista.google_calendar && entrevista.google_calendar.estado !== 'NoAplica'"
                size="x-small"
                :color="colorEstadoGoogleCalendar(entrevista.google_calendar.estado)"
                variant="tonal"
                :prepend-icon="iconoEstadoGoogleCalendar(entrevista.google_calendar.estado)"
                class="font-weight-bold"
              >
                {{ etiquetaEstadoGoogleCalendar(entrevista.google_calendar.estado) }}
              </VChip>
            </div>

            <div class="d-flex flex-wrap align-center gap-1 mt-2 text-body-2 font-weight-bold">
              <VIcon
                icon="tabler-clock"
                size="15"
                class="text-primary flex-shrink-0"
              />
              <span>{{ formatearFechaHoraGuatemala(entrevista.fecha_hora) }}</span>
              <span class="text-caption text-medium-emphasis font-weight-regular">
                ({{ formatearRangoHorarioGuatemala(entrevista.fecha_hora, entrevista.fecha_fin, entrevista.duracion_minutos) }} GT · {{ formatearDuracionMinutos(entrevista.duracion_minutos) }})
              </span>
            </div>
          </div>

          <!-- Acciones solo para Programada y con permiso gestionar -->
          <div
            v-if="entrevista.estado === 'Programada' && puedeGestionar"
            class="d-flex flex-wrap gap-1"
          >
            <VBtn
              v-if="esUrlGoogleMeetValida(entrevista.google_calendar?.meet_url)"
              size="x-small"
              color="success"
              variant="flat"
              prepend-icon="tabler-video"
              append-icon="tabler-external-link"
              :href="entrevista.google_calendar!.meet_url!"
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir Meet
            </VBtn>
            <VBtn
              v-if="puedeReintentarGoogleCalendar(entrevista)"
              size="x-small"
              color="warning"
              variant="tonal"
              prepend-icon="tabler-refresh"
              :loading="reintentandoMeetId === entrevista.id"
              :disabled="reintentandoMeetId !== null && reintentandoMeetId !== entrevista.id"
              @click="reintentarGoogleMeet(entrevista)"
            >
              Reintentar Meet
            </VBtn>
            <VBtn
              size="x-small"
              color="success"
              variant="tonal"
              prepend-icon="tabler-clipboard-check"
              @click="abrirResultado(entrevista)"
            >
              Resultado
            </VBtn>
            <VBtn
              size="x-small"
              color="primary"
              variant="tonal"
              prepend-icon="tabler-calendar-time"
              @click="abrirReprogramar(entrevista)"
            >
              Reprogramar
            </VBtn>
            <VBtn
              size="x-small"
              color="error"
              variant="text"
              prepend-icon="tabler-calendar-x"
              @click="abrirCancelar(entrevista)"
            >
              Cancelar
            </VBtn>
          </div>
          <div
            v-else-if="entrevista.estado === 'Programada' && esUrlGoogleMeetValida(entrevista.google_calendar?.meet_url)"
            class="d-flex flex-wrap gap-1"
          >
            <VBtn
              size="x-small"
              color="success"
              variant="flat"
              prepend-icon="tabler-video"
              append-icon="tabler-external-link"
              :href="entrevista.google_calendar!.meet_url!"
              target="_blank"
              rel="noopener noreferrer"
            >
              Abrir Meet
            </VBtn>
          </div>
        </div>

        <!-- Estado / error de sincronización Google Meet -->
        <VAlert
          v-if="entrevista.google_calendar && (entrevista.google_calendar.estado === 'Error' || entrevista.google_calendar.estado === 'MeetPendiente' || entrevista.google_calendar.estado === 'Pendiente')"
          :type="entrevista.google_calendar.estado === 'Error' ? 'error' : 'warning'"
          variant="tonal"
          density="compact"
          class="mt-2"
        >
          <div class="text-caption">
            <strong>{{ etiquetaEstadoGoogleCalendar(entrevista.google_calendar.estado) }}</strong>
            <template v-if="entrevista.google_calendar.error?.mensaje">
              : {{ entrevista.google_calendar.error.mensaje }}
            </template>
            <template v-else-if="entrevista.google_calendar.estado === 'MeetPendiente'">
              : Google Calendar aceptó el evento, pero aún no ha generado el enlace de Meet.
            </template>
            <template v-else>
              : La sincronización con Google Calendar está pendiente.
            </template>
            <span
              v-if="entrevista.google_calendar.proximo_intento_at"
              class="d-block mt-1"
            >
              Próximo reintento automático: {{ formatearFechaHoraGuatemala(entrevista.google_calendar.proximo_intento_at) }} (GT)
            </span>
          </div>
        </VAlert>

        <div class="d-flex flex-wrap gap-x-4 gap-y-1 mt-2 text-caption text-medium-emphasis">
          <div class="d-flex align-center gap-1">
            <VIcon
              icon="tabler-user-check"
              size="14"
            />
            <span>
              Entrevistador: <strong>{{ nombreCompletoPersona(entrevista.entrevistador) }}</strong>
            </span>
          </div>

          <div
            v-if="entrevista.lugar"
            class="d-flex align-center gap-1 min-w-0"
          >
            <VIcon
              :icon="iconoModalidadEntrevista(entrevista.modalidad)"
              size="14"
              class="flex-shrink-0"
            />
            <a
              v-if="esUrlValida(entrevista.lugar)"
              :href="entrevista.lugar"
              target="_blank"
              rel="noopener noreferrer"
              class="text-primary text-truncate"
            >
              {{ entrevista.lugar }}
            </a>
            <span
              v-else
              class="text-truncate"
            >
              {{ entrevista.lugar }}
            </span>
          </div>
        </div>

        <!-- Evaluación registrada (Realizada) -->
        <div
          v-if="entrevista.estado === 'Realizada'"
          class="resultado-box mt-3"
        >
          <div class="d-flex flex-wrap align-center justify-space-between gap-2 mb-1">
            <span class="text-caption font-weight-bold text-medium-emphasis">
              Evaluación registrada
            </span>
            <div
              v-if="entrevista.puntuacion"
              class="d-flex align-center gap-1"
            >
              <VIcon
                v-for="estrella in 5"
                :key="estrella"
                :icon="estrella <= entrevista.puntuacion ? 'tabler-star-filled' : 'tabler-star'"
                :color="estrella <= entrevista.puntuacion ? 'warning' : 'disabled'"
                size="14"
              />
              <span class="text-caption font-weight-bold ms-1">
                {{ entrevista.puntuacion }}/5
              </span>
            </div>
          </div>
          <p
            v-if="entrevista.observaciones"
            class="text-body-2 mb-0 texto-pre"
          >
            {{ entrevista.observaciones }}
          </p>
        </div>

        <!-- Motivo de cancelación -->
        <div
          v-if="entrevista.estado === 'Cancelada' && entrevista.motivo_cancelacion"
          class="cancelacion-box mt-3"
        >
          <span class="text-caption font-weight-bold d-block mb-1">
            Motivo de cancelación
          </span>
          <p class="text-body-2 mb-0 texto-pre">
            {{ entrevista.motivo_cancelacion }}
          </p>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
@import '@styles/reclutamiento-talent.scss';

.entrevista-card {
  background: rgba(var(--v-theme-on-surface), 0.02);
  border: 1px solid rgba(var(--v-theme-on-surface), 0.09);
  border-radius: 11px;
  padding: 13px 14px;
}

.entrevista-card--programada {
  border-left: 3px solid rgb(var(--v-theme-primary));
}

.resultado-box {
  padding: 9px 11px;
  border-radius: 8px;
  background: rgba(var(--v-theme-surface), 0.92);
  border-left: 3px solid #218268;
}

.cancelacion-box {
  padding: 9px 11px;
  border-radius: 8px;
  background: rgba(var(--v-theme-error), 0.06);
  border-left: 3px solid rgb(var(--v-theme-error));
}

.texto-pre {
  overflow-wrap: anywhere;
  white-space: pre-wrap;
}
</style>
