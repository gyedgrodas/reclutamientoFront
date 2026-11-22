export type MotivoVacante = 'Nueva' | 'Reemplazo'
export type EstadoVacante = 'Abierta' | 'En Proceso' | 'Cubierta' | 'Cancelada'
export type EstadoSolicitudVacante = 'Pendiente' | 'Aprobada' | 'Rechazada'

export interface PuestoResumen {
  id: number
  nombre: string
}

export interface UnidadResumen {
  id: number
  nombre: string
}

export interface UsuarioResumen {
  id: number
  nombres: string
  apellidos: string
  usuario_dominio: string
  correo?: string
}

export interface Vacante {
  id: number
  solicitud_id?: number | null
  puesto_id: number
  unidad_id: number
  solicitante_id: number | null
  numero_plazas: number
  motivo: MotivoVacante
  descripcion: string | null
  requisitos: string | null
  fecha_apertura: string
  fecha_cierre_estimada: string | null
  fecha_cierre_real: string | null
  estado: EstadoVacante
  puesto?: PuestoResumen
  unidad?: UnidadResumen
  solicitante?: UsuarioResumen
  postulaciones_count?: number
}

export interface SolicitudVacante {
  id: number
  puesto_id: number
  unidad_id: number
  solicitante_id: number | null
  aprobador_id: number | null
  numero_plazas: number
  motivo: MotivoVacante
  justificacion: string
  estado: EstadoSolicitudVacante
  observaciones: string | null
  fecha_resolucion: string | null
  created_at?: string | null
  updated_at?: string | null
  puesto?: PuestoResumen
  unidad?: UnidadResumen
  solicitante?: UsuarioResumen
  aprobador?: UsuarioResumen
  vacante?: Vacante | null
}

export interface DatosSolicitudVacante {
  puesto_id: number | null
  unidad_id: number | null
  numero_plazas: number | null
  motivo: MotivoVacante
  justificacion: string
}

export interface DatosResolverSolicitudVacante {
  estado: 'Aprobada' | 'Rechazada'
  observaciones: string
}

export interface DatosCrearVacanteDesdeSolicitud {
  fecha_apertura: string
  fecha_cierre_estimada: string | null
  descripcion: string | null
  requisitos: string | null
}

export interface DatosVacante {
  puesto_id: number | null
  unidad_id: number | null
  solicitante_id: number | null
  numero_plazas: number | null
  motivo: MotivoVacante
  descripcion: string | null
  requisitos: string | null
  fecha_apertura: string
  fecha_cierre_estimada: string | null
  fecha_cierre_real: string | null
  estado: EstadoVacante
}

export type GeneroCandidato = 'Masculino' | 'Femenino' | 'Otro'
export type NivelAcademicoCandidato = 'Primaria' | 'Básico' | 'Diversificado' | 'Universitario' | 'Postgrado'
export type FuenteReclutamientoCandidato = 'Referido' | 'Bolsa de Empleo' | 'Redes Sociales' | 'Feria de Empleo' | 'Otro'
export type EstadoCandidato = 'Activo' | 'Inactivo' | 'Descartado'

export interface MunicipioResumen {
  id: number
  nombre: string
}

export interface MediaArchivo {
  id: number
  collection_name: string
  name: string
  file_name: string
  mime_type: string | null
  size: number
  original_url: string
}

export interface Candidato {
  id: number
  nombres: string
  apellidos: string
  correo: string
  telefono: string | null
  dpi: string | null
  fecha_nacimiento: string | null
  genero: GeneroCandidato | null
  direccion: string | null
  municipio_id: number | null
  nivel_academico: NivelAcademicoCandidato | null
  pretension_salarial: number | null
  fuente_reclutamiento: FuenteReclutamientoCandidato | null
  estado: EstadoCandidato
  observaciones: string | null
  municipio?: MunicipioResumen
  media?: MediaArchivo[]
  postulaciones_count?: number
  postulaciones?: Postulacion[]
}

export interface DatosCandidato {
  nombres: string
  apellidos: string
  correo: string
  telefono: string | null
  dpi: string | null
  fecha_nacimiento: string | null
  genero: GeneroCandidato | null
  direccion: string | null
  municipio_id: number | null
  nivel_academico: NivelAcademicoCandidato | null
  pretension_salarial: number | null
  fuente_reclutamiento: FuenteReclutamientoCandidato | null
  estado: EstadoCandidato
  observaciones: string | null
}

export type EstadoPostulacion = 'En proceso' | 'Descartada' | 'Contratada' | 'Retirada'

export interface EtapaReclutamiento {
  id: number
  nombre: string
  orden?: number
  estado?: string
  estado_publico?: string | null
  es_terminal?: boolean
}

export interface Postulacion {
  id: number
  candidato_id: number
  vacante_id: number
  etapa_reclutamiento_id: number
  responsable_id: number | null
  fecha_postulacion: string
  fecha_ultima_actualizacion: string | null
  estado: EstadoPostulacion
  observaciones: string | null
  candidato?: Candidato
  vacante?: Vacante
  etapa_reclutamiento?: EtapaReclutamiento
  etapaReclutamiento?: EtapaReclutamiento
  responsable?: UsuarioResumen
}

export interface DatosPostulacion {
  candidato_id: number | null
  vacante_id: number | null
  etapa_reclutamiento_id: number | null
  responsable_id: number | null
  fecha_postulacion: string
  fecha_ultima_actualizacion: string | null
  estado: EstadoPostulacion
  observaciones: string | null
  observacion_movimiento?: string
}

export interface MovimientoPostulacion {
  id: number
  tipo: 'Registro' | 'Actualización'
  created_at: string
  etapa_anterior: string | null
  etapa_nueva: string | null
  estado_anterior: string | null
  estado_nuevo: string | null
  responsable_anterior: string | null
  responsable_nuevo: string | null
  actor: string | null
  observaciones: string | null
}

export interface RespuestaHistorialPostulacion {
  data: {
    data: MovimientoPostulacion[]
    current_page: number
    last_page: number
    total: number
  }
  success: boolean
  message: string
}

export interface ActividadRecientePostulacion {
  id: number
  postulacion_id: number
  tipo: 'Registro' | 'Actualización'
  created_at: string | null
  candidato: string | null
  puesto: string | null
  etapa_anterior: string | null
  etapa_nueva: string | null
  estado_anterior: string | null
  estado_nuevo: string | null
  actor: string | null
  observaciones: string | null
}

export type EntidadBitacoraReclutamiento = 'SolicitudVacante' | 'Vacante' | 'Postulacion'

export interface RegistroBitacoraReclutamiento {
  id: number
  entidad: EntidadBitacoraReclutamiento | string
  entidad_id: number | string | null
  accion: string
  actor: string | null
  created_at: string | null
  cambios: Record<string, unknown> | null
  solicitud_id?: number | null
}

export type ModalidadEntrevista = 'Presencial' | 'Virtual' | 'Telefónica'
export type EstadoEntrevista = 'Programada' | 'Realizada' | 'Cancelada'
export type RecomendacionEntrevista = 'Avanzar' | 'En revisión' | 'No continuar'

export type EstadoIntegracionGoogleCalendar =
  | 'NoConfigurada'
  | 'Desconectada'
  | 'Conectada'
  | 'RequiereReautorizacion'
  | 'Error'

export type EstadoSincronizacionGoogleCalendar =
  | 'NoAplica'
  | 'Pendiente'
  | 'Sincronizando'
  | 'MeetPendiente'
  | 'Sincronizada'
  | 'Error'
  | 'Eliminada'

export interface ErrorGoogleCalendar {
  codigo: string
  mensaje: string
  at?: string | null
}

export interface UsuarioMinimoIntegracion {
  id: number
  nombres: string
  apellidos: string
}

export interface IntegracionGoogleCalendarEstado {
  configurada: boolean
  conectada: boolean
  estado: EstadoIntegracionGoogleCalendar
  calendario: string
  scope: string
  conectada_at: string | null
  actualizada_at?: string | null
  conectada_por: UsuarioMinimoIntegracion | null
  ultimo_error: ErrorGoogleCalendar | null
  puede_administrar: boolean
  soporta_desconexion?: boolean
  sincronizaciones_pendientes: number
  sincronizaciones_con_error: number
  advertencias: string[]
}

export interface RespuestaAutorizarGoogleCalendar {
  url: string
  expira_at: string | null
}

export interface GoogleCalendarEntrevista {
  estado: EstadoSincronizacionGoogleCalendar
  meet_url: string | null
  event_id: string | null
  sincronizado_at: string | null
  intentos: number
  proximo_intento_at: string | null
  error: {
    codigo: string
    mensaje: string
  } | null
}

export interface Entrevista {
  id: number
  postulacion_id: number
  fecha_hora: string
  fecha_fin?: string | null
  duracion_minutos?: number | null
  entrevistador_id: number
  entrevistador?: UsuarioResumen
  modalidad: ModalidadEntrevista
  lugar: string | null
  estado: EstadoEntrevista
  recomendacion: RecomendacionEntrevista | null
  puntuacion: number | null
  observaciones: string | null
  motivo_cancelacion: string | null
  google_calendar?: GoogleCalendarEntrevista | null
  postulacion?: Postulacion
  created_at: string | null
  updated_at: string | null
}

export interface AgendaEntrevistas {
  hoy: Entrevista[]
  pendientes_resultado: Entrevista[]
  proximas: Entrevista[]
}

export interface RespuestaCalendarioEntrevistas {
  success?: boolean
  message?: string
  data?: {
    data: Entrevista[]
    current_page: number
    last_page: number
    total: number
  }
}

export interface PayloadProgramarEntrevista {
  fecha_hora: string
  entrevistador_id: number
  modalidad: ModalidadEntrevista
  lugar: string | null
}

export interface PayloadCancelarEntrevista {
  motivo: string
}

export interface PayloadResultadoEntrevista {
  recomendacion: RecomendacionEntrevista
  puntuacion: number
  observaciones: string
}
