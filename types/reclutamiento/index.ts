export type MotivoVacante = 'Nueva' | 'Reemplazo'
export type EstadoVacante = 'Abierta' | 'En Proceso' | 'Cubierta' | 'Cancelada'

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
