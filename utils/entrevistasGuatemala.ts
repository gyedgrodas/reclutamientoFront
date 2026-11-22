import type {
  Entrevista,
  EstadoEntrevista,
  EstadoIntegracionGoogleCalendar,
  EstadoSincronizacionGoogleCalendar,
  ModalidadEntrevista,
  RecomendacionEntrevista,
} from '@/types/reclutamiento'

export const ZONA_GUATEMALA = 'America/Guatemala'
export const OFFSET_GUATEMALA = '-06:00'
export const DURACION_ENTREVISTA_MINUTOS = 60

export const MODALIDADES_ENTREVISTA: ModalidadEntrevista[] = [
  'Presencial',
  'Virtual',
  'Telefónica',
]

export const RECOMENDACIONES_ENTREVISTA: RecomendacionEntrevista[] = [
  'Avanzar',
  'En revisión',
  'No continuar',
]

const formatoFechaHoraGt = new Intl.DateTimeFormat('es-GT', {
  timeZone: ZONA_GUATEMALA,
  dateStyle: 'medium',
  timeStyle: 'short',
})

const formatoHoraGt = new Intl.DateTimeFormat('es-GT', {
  timeZone: ZONA_GUATEMALA,
  hour: '2-digit',
  minute: '2-digit',
  hour12: true,
})

const formatoFechaCortaGt = new Intl.DateTimeFormat('es-GT', {
  timeZone: ZONA_GUATEMALA,
  weekday: 'short',
  day: '2-digit',
  month: 'short',
})

const formatoPartesGt = new Intl.DateTimeFormat('en-CA', {
  timeZone: ZONA_GUATEMALA,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
})

export const extraerFechaHoraGuatemala = (iso?: string | null): { fecha: string; hora: string } => {
  if (!iso)
    return { fecha: '', hora: '' }

  const fechaObj = new Date(iso)
  if (Number.isNaN(fechaObj.getTime()))
    return { fecha: '', hora: '' }

  const partes = formatoPartesGt.formatToParts(fechaObj)
  const valor = (tipo: Intl.DateTimeFormatPartTypes) => partes.find(p => p.type === tipo)?.value || ''

  const anio = valor('year')
  const mes = valor('month')
  const dia = valor('day')
  const horaRaw = valor('hour')
  const horaNormalizada = horaRaw === '24' ? '00' : horaRaw
  const minuto = valor('minute')

  if (!anio || !mes || !dia || !horaNormalizada || !minuto)
    return { fecha: '', hora: '' }

  return {
    fecha: `${anio}-${mes}-${dia}`,
    hora: `${horaNormalizada}:${minuto}`,
  }
}

export const construirIsoGuatemala = (fecha: string, hora: string): string | null => {
  const fechaLimpia = fecha.trim()
  const horaLimpia = hora.trim()

  if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaLimpia) || !/^\d{2}:\d{2}$/.test(horaLimpia))
    return null

  const [anio, mes, dia] = fechaLimpia.split('-').map(Number)
  const [horas, minutos] = horaLimpia.split(':').map(Number)

  if (anio < 1 || horas < 0 || horas > 23 || minutos < 0 || minutos > 59)
    return null

  // Verifica que la fecha exista en el calendario gregoriano (evita 2026-02-30 y años 0..99)
  const prueba = new Date(0)

  prueba.setUTCFullYear(anio, mes - 1, dia)
  if (
    prueba.getUTCFullYear() !== anio
    || prueba.getUTCMonth() !== mes - 1
    || prueba.getUTCDate() !== dia
  )
    return null

  return `${fechaLimpia}T${horaLimpia}:00${OFFSET_GUATEMALA}`
}

export const fechaHoraSugeridaGuatemala = (): { fecha: string; hora: string } => {
  const siguiente = new Date(Date.now() + 60 * 60 * 1000)

  siguiente.setUTCMinutes(0, 0, 0)

  return extraerFechaHoraGuatemala(siguiente.toISOString())
}

export const formatearFechaHoraGuatemala = (iso?: string | null): string => {
  if (!iso)
    return 'Fecha no disponible'

  const fecha = new Date(iso)

  return Number.isNaN(fecha.getTime()) ? 'Fecha no disponible' : formatoFechaHoraGt.format(fecha)
}

export const formatearHoraGuatemala = (iso?: string | null): string => {
  if (!iso)
    return '--:--'

  const fecha = new Date(iso)

  return Number.isNaN(fecha.getTime()) ? '--:--' : formatoHoraGt.format(fecha)
}

export const formatearFechaCortaGuatemala = (iso?: string | null): string => {
  if (!iso)
    return 'Sin fecha'

  const fecha = new Date(iso)

  return Number.isNaN(fecha.getTime()) ? 'Sin fecha' : formatoFechaCortaGt.format(fecha)
}

export const colorEstadoEntrevista = (estado: EstadoEntrevista): string => {
  if (estado === 'Realizada')
    return 'success'
  if (estado === 'Cancelada')
    return 'secondary'

  return 'primary'
}

export const iconoModalidadEntrevista = (modalidad: ModalidadEntrevista): string => {
  if (modalidad === 'Virtual')
    return 'tabler-video'
  if (modalidad === 'Telefónica')
    return 'tabler-phone'

  return 'tabler-building'
}

export const colorRecomendacionEntrevista = (recomendacion?: RecomendacionEntrevista | null): string => {
  if (recomendacion === 'Avanzar')
    return 'success'
  if (recomendacion === 'En revisión')
    return 'warning'
  if (recomendacion === 'No continuar')
    return 'error'

  return 'secondary'
}

export const placeholderLugarModalidad = (modalidad: ModalidadEntrevista): string => {
  if (modalidad === 'Virtual')
    return 'Opcional: enlace alternativo (Google Meet se genera automáticamente si está conectado)'
  if (modalidad === 'Telefónica')
    return 'Ej. Número telefónico o extensión'

  return 'Ej. Sala de reuniones, agencia u oficina'
}

export const esUrlValida = (valor?: string | null): boolean => {
  if (!valor)
    return false

  try {
    const parsed = new URL(valor.trim())

    return parsed.protocol === 'https:' || parsed.protocol === 'http:'
  }
  catch {
    return false
  }
}

export const esUrlGoogleMeetValida = (valor?: string | null): boolean => {
  if (!valor)
    return false

  try {
    const parsed = new URL(valor.trim())

    return parsed.protocol === 'https:'
      && parsed.hostname.toLowerCase() === 'meet.google.com'
      && parsed.pathname.length > 1
  }
  catch {
    return false
  }
}

export const esUrlAutorizacionGoogleValida = (valor?: string | null): boolean => {
  if (!valor)
    return false

  try {
    const parsed = new URL(valor.trim())

    return parsed.protocol === 'https:'
      && parsed.hostname.toLowerCase() === 'accounts.google.com'
  }
  catch {
    return false
  }
}

export const calcularFechaFinIso = (
  inicioIso?: string | null,
  finIso?: string | null,
  duracionMinutos?: number | null,
): string | null => {
  if (finIso) {
    const fin = new Date(finIso)
    if (!Number.isNaN(fin.getTime()))
      return fin.toISOString()
  }

  if (!inicioIso)
    return null

  const inicio = new Date(inicioIso)
  if (Number.isNaN(inicio.getTime()))
    return null

  const minutos = typeof duracionMinutos === 'number' && duracionMinutos > 0
    ? duracionMinutos
    : DURACION_ENTREVISTA_MINUTOS

  return new Date(inicio.getTime() + minutos * 60 * 1000).toISOString()
}

export const formatearDuracionMinutos = (duracionMinutos?: number | null): string => {
  const minutos = typeof duracionMinutos === 'number' && duracionMinutos > 0
    ? duracionMinutos
    : DURACION_ENTREVISTA_MINUTOS

  if (minutos === 60)
    return '1 hora'
  if (minutos % 60 === 0)
    return `${minutos / 60} horas`

  return `${minutos} min`
}

export const formatearRangoHorarioGuatemala = (
  inicioIso?: string | null,
  finIso?: string | null,
  duracionMinutos?: number | null,
): string => {
  if (!inicioIso)
    return '--:--'

  const horaInicio = formatearHoraGuatemala(inicioIso)
  const finCalculado = calcularFechaFinIso(inicioIso, finIso, duracionMinutos)
  if (!finCalculado)
    return horaInicio

  return `${horaInicio} - ${formatearHoraGuatemala(finCalculado)}`
}

export const etiquetaEstadoGoogleCalendar = (estado?: EstadoSincronizacionGoogleCalendar | null): string => {
  switch (estado) {
    case 'Sincronizada':
      return 'Meet sincronizado'
    case 'MeetPendiente':
      return 'Enlace Meet pendiente'
    case 'Pendiente':
      return 'Sincronización pendiente'
    case 'Sincronizando':
      return 'Sincronizando...'
    case 'Error':
      return 'Error de sincronización'
    case 'Eliminada':
      return 'Evento eliminado'
    case 'NoAplica':
    default:
      return 'No aplica'
  }
}

export const colorEstadoGoogleCalendar = (estado?: EstadoSincronizacionGoogleCalendar | null): string => {
  switch (estado) {
    case 'Sincronizada':
      return 'success'
    case 'MeetPendiente':
    case 'Pendiente':
      return 'warning'
    case 'Sincronizando':
      return 'info'
    case 'Error':
      return 'error'
    case 'Eliminada':
    case 'NoAplica':
    default:
      return 'secondary'
  }
}

export const iconoEstadoGoogleCalendar = (estado?: EstadoSincronizacionGoogleCalendar | null): string => {
  switch (estado) {
    case 'Sincronizada':
      return 'tabler-video'
    case 'MeetPendiente':
    case 'Pendiente':
      return 'tabler-clock-pause'
    case 'Sincronizando':
      return 'tabler-refresh'
    case 'Error':
      return 'tabler-alert-triangle'
    case 'Eliminada':
      return 'tabler-video-off'
    case 'NoAplica':
    default:
      return 'tabler-minus'
  }
}

export const etiquetaEstadoIntegracionGoogle = (estado?: EstadoIntegracionGoogleCalendar | null): string => {
  switch (estado) {
    case 'Conectada':
      return 'Conectada'
    case 'Desconectada':
      return 'Desconectada'
    case 'RequiereReautorizacion':
      return 'Requiere reautorización'
    case 'Error':
      return 'Con error'
    case 'NoConfigurada':
    default:
      return 'No configurada'
  }
}

export const colorEstadoIntegracionGoogle = (estado?: EstadoIntegracionGoogleCalendar | null): string => {
  switch (estado) {
    case 'Conectada':
      return 'success'
    case 'Desconectada':
      return 'secondary'
    case 'RequiereReautorizacion':
      return 'warning'
    case 'Error':
      return 'error'
    case 'NoConfigurada':
    default:
      return 'secondary'
  }
}

export const mensajeCallbackGoogleCalendar = (codigo?: string | null): string => {
  switch (codigo) {
    case 'state_invalido':
      return 'La solicitud de autorización de Google no es válida. Intenta iniciar la conexión nuevamente.'
    case 'state_expirado':
      return 'La solicitud de autorización expiró (máximo 10 minutos). Inicia el proceso de conexión nuevamente.'
    case 'acceso_denegado':
      return 'La autorización fue cancelada o denegada en Google.'
    case 'sin_refresh_token':
      return 'Google no devolvió permiso permanente de renovación. Reautoriza la cuenta personal autorizada concediendo el acceso solicitado.'
    case 'scope_insuficiente':
      return 'Debe conceder acceso a los eventos del calendario.'
    case 'intercambio_fallido':
      return 'No fue posible completar el intercambio de autorización con Google. Intenta nuevamente.'
    case 'no_configurada':
      return 'La integración de Google Calendar no está configurada en el servidor.'
    default:
      return 'No fue posible completar la conexión con Google Calendar.'
  }
}

export const puedeReintentarGoogleCalendar = (entrevista?: Entrevista | null): boolean => {
  if (!entrevista || entrevista.modalidad !== 'Virtual' || entrevista.estado !== 'Programada')
    return false

  const estado = entrevista.google_calendar?.estado

  return estado === 'Error' || estado === 'MeetPendiente' || estado === 'Pendiente'
}

export const entrevistaGoogleRequiereAtencion = (entrevista?: Entrevista | null): boolean => {
  if (!entrevista)
    return false

  const estado = entrevista.google_calendar?.estado
  if (!estado || estado === 'NoAplica' || estado === 'Sincronizada' || estado === 'Eliminada')
    return false

  if (entrevista.modalidad === 'Virtual' && entrevista.estado === 'Programada')
    return true

  return estado === 'Error'
}

export const extraerErroresCamposApi = (error: any): Record<string, string[]> => {
  const errores = error?.response?.data?.errors
  if (!errores || typeof errores !== 'object')
    return {}

  const resultado: Record<string, string[]> = {}
  for (const [campo, mensajes] of Object.entries(errores)) {
    if (Array.isArray(mensajes))
      resultado[campo] = mensajes.map(m => String(m))
    else if (typeof mensajes === 'string')
      resultado[campo] = [mensajes]
  }

  return resultado
}

export const extraerMensajeErrorApi = (error: any, fallback: string): string => {
  const errores = extraerErroresCamposApi(error)
  const primerDetalle = Object.values(errores).flat()[0]
  if (primerDetalle)
    return primerDetalle

  const mensaje = error?.response?.data?.message
  if (typeof mensaje === 'string' && mensaje.trim())
    return mensaje.trim()

  return fallback
}
