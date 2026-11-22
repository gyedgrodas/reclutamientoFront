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
