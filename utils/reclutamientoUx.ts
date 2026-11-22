import type { EtapaReclutamiento, Postulacion } from '@/types/reclutamiento'

export const UMBRAL_DIAS_ATENCION = 5

export const inicialesPersona = (nombres?: string | null, apellidos?: string | null): string => {
  const n = (nombres || '').trim()
  const a = (apellidos || '').trim()
  if (!n && !a)
    return 'TH'

  const p1 = n ? n[0] : ''
  const p2 = a ? a[0] : (n.split(/\s+/)[1]?.[0] || '')

  return `${p1}${p2}`.toUpperCase() || 'TH'
}

export const nombreCompletoPersona = (persona?: { nombres?: string | null; apellidos?: string | null } | null): string => {
  if (!persona)
    return 'Sin asignar'

  return `${persona.nombres || ''} ${persona.apellidos || ''}`.trim() || 'Sin asignar'
}

export const obtenerEtapaPostulacion = (postulacion?: Postulacion | null): EtapaReclutamiento | undefined => {
  if (!postulacion)
    return undefined

  return postulacion.etapaReclutamiento || postulacion.etapa_reclutamiento
}

export const obtenerEtapaNombre = (postulacion?: Postulacion | null): string => {
  return obtenerEtapaPostulacion(postulacion)?.nombre || 'Solicitud recibida'
}

export const diasSinActualizar = (postulacion?: Pick<Postulacion, 'fecha_ultima_actualizacion' | 'fecha_postulacion'> | null): number => {
  if (!postulacion)
    return 0

  const fuente = postulacion.fecha_ultima_actualizacion || postulacion.fecha_postulacion
  if (!fuente)
    return 0

  const fecha = new Date(fuente.length === 10 ? `${fuente}T00:00:00` : fuente)
  if (Number.isNaN(fecha.getTime()))
    return 0

  const ahora = new Date()
  const inicioHoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime()
  const inicioFecha = new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate()).getTime()
  const diff = Math.floor((inicioHoy - inicioFecha) / 86400000)

  return Math.max(0, diff)
}

export const etiquetaDiasSinActualizar = (dias: number): string => {
  if (dias <= 0)
    return 'Actualizado hoy'
  if (dias === 1)
    return 'Actualizado ayer'

  return `${dias} días sin actualizar`
}

export const necesitaAtencionPostulacion = (postulacion?: Postulacion | null): boolean => {
  if (!postulacion || postulacion.estado !== 'En proceso')
    return false

  return diasSinActualizar(postulacion) >= UMBRAL_DIAS_ATENCION
}

export const esEtapaEntrevista = (etapaNombre: string): boolean => {
  return etapaNombre.toLowerCase().includes('entrevista')
}

export const colorPuntoEtapa = (etapaNombre: string): string => {
  const n = etapaNombre.toLowerCase()
  if (n.includes('solicitud') || n.includes('recib'))
    return '#4a90b8'
  if (n.includes('preselec') || n.includes('revisi') || n.includes('psicom') || n.includes('evalua'))
    return '#218268'
  if (n.includes('entrevista'))
    return '#d08328'
  if (n.includes('referencia') || n.includes('oferta'))
    return '#6a67c9'
  if (n.includes('contrat'))
    return '#15803d'
  if (n.includes('descart'))
    return '#c53030'

  return '#218268'
}

export const proximaAccionSugerida = (etapaNombre: string, estado: string): string => {
  if (estado === 'Contratada')
    return 'Coordinar inducción institucional, expediente laboral y cierre formal de plaza.'
  if (estado === 'Descartada')
    return 'Confirmar envío de agradecimiento cordial de cierre al candidato.'
  if (estado === 'Retirada')
    return 'Registrar motivo de retiro voluntario y reactivar terna de candidatos.'

  const n = etapaNombre.toLowerCase()
  if (n.includes('solicitud') || n.includes('recib'))
    return 'Revisar CV, cumplimiento de requisitos y validar filtro inicial.'
  if (n.includes('preselec'))
    return 'Contactar al candidato para validación telefónica y pruebas iniciales.'
  if (n.includes('psicom') || n.includes('evalua'))
    return 'Revisar resultados de pruebas psicométricas y agendar entrevista con RRHH.'
  if (n.includes('rrhh'))
    return 'Consolidar informe de competencias y coordinar entrevista técnica con jefatura.'
  if (n.includes('técnica') || n.includes('tecnica') || n.includes('entrevista'))
    return 'Recopilar dictamen del líder solicitante y avanzar a verificación de referencias.'
  if (n.includes('referencia'))
    return 'Validar referencias laborales y preparar propuesta económica.'
  if (n.includes('oferta'))
    return 'Presentar carta oferta al candidato y acordar fecha tentativa de ingreso.'

  return 'Actualizar seguimiento y comunicar avances oportunamente al candidato.'
}

export const saludoEquipoTalento = (): string => {
  const hora = new Date().getHours()
  if (hora < 12)
    return 'Buen día, equipo de talento'
  if (hora < 19)
    return 'Buenas tardes, equipo de talento'

  return 'Buenas noches, equipo de talento'
}

export const tiempoRelativoCorto = (iso?: string | null): string => {
  if (!iso)
    return 'Reciente'

  const fecha = new Date(iso)
  if (Number.isNaN(fecha.getTime()))
    return 'Reciente'

  const diffMin = Math.floor((Date.now() - fecha.getTime()) / 60000)
  if (diffMin < 2)
    return 'Hace un momento'
  if (diffMin < 60)
    return `Hace ${diffMin} min`

  const diffHoras = Math.floor(diffMin / 60)
  if (diffHoras < 24)
    return `Hace ${diffHoras} h`

  const diffDias = Math.floor(diffHoras / 24)
  if (diffDias === 1)
    return 'Ayer'
  if (diffDias < 7)
    return `Hace ${diffDias} días`

  return new Intl.DateTimeFormat('es-GT', { day: '2-digit', month: 'short' }).format(fecha)
}
