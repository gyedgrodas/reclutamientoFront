export interface RolInterface {
  id: number | null
  name: string
  descripcion: string | null
  permisos: string[]
  created_at: Date | null
  updated_at: Date | null
  deleted_at: Date | null
}

export interface UsuarioInterface {
  id: number
  sigua_id: number | null
  usuario_dominio: string
  nombre: string
  apellido: string
  email: string | null
  password: string
  estado: 'Cancelado' | 'Inactivo' | 'Activo'
  password_changed_at: Date | null
  ultimo_login_el: Date | null
  ultimo_login_ip: string | null
  ultima_bitacora?: UserAsignacionBitacoraInterface | null
  bitacoras?: UserAsignacionBitacoraInterface[] | null | []
  bitacoras30dias?: UserAsignacionBitacoraInterface[] | null | []
  two_factor_secret: string | null
  two_factor_recovery_codes: string | null
  two_factor_habilitado: boolean | null
  two_factor_pending: boolean | null
  two_factor_confirmed_at: Date | null
  ultima_autenticacion: 'credenciales' | 'azure'
  rol: RolInterface | null
  roles?: RolInterface[] | []
  roles_id?: number | null
  unidad_id: number
  usuarioSigua?: object | null
  rol_activo_id?: number[] | null
  remember_token: string | null
  created_at: Date | null
  updated_at: Date | null
  deleted_at: Date | null
}
export interface UserAsignacionBitacoraInterface {
  id: number
  user_id: number
  motivo_id: number
  estado_id: number
  estado?: SolicitudAsignacionEstado | null
  user_modifica_id: number
  duracion?: string | null
  fecha?: string | null
  rol_id: number
  rol?: RolInterface | null
  comentario?: string | null
  fecha_inicia?: string | null
  fecha_fin?: string | null
  created_at: string
}

export interface SolicitudAsignacionEstado {
  id: number
  nombre: string
  created_at: string
  updated_at?: string | null
  deleted_at?: string | null
}
