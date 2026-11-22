import type {
  EstadoEntrevista,
  ModalidadEntrevista,
  RecomendacionEntrevista,
} from '@/types/reclutamiento'

export const ZONA_GUATEMALA = 'America/Guatemala'
export const OFFSET_GUATEMALA = '-06:00'

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
    return 'Ej. Enlace de Teams, Meet o Zoom'
  if (modalidad === 'Telefónica')
    return 'Ej. Número telefónico o extensión'

  return 'Ej. Sala de reuniones, agencia u oficina'
}

export const esUrlValida = (valor?: string | null): boolean => {
  if (!valor)
    return false

  return /^https?:\/\/\S+$/i.test(valor.trim())
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
