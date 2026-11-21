export interface UsuarioGestion {
  id: number
  usuario_dominio: string
  nombres: string
  apellidos: string
  correo: string
  estado: 'activo' | 'inactivo'
  correo_verificado_en: string | null
  creado_en: string | null
  actualizado_en: string | null
  two_factor_habilitado: boolean
  roles: OpcionAcceso[]
  permissions: OpcionAcceso[]
}

export interface OpcionAcceso {
  id: number
  name: string
}

export interface DatosUsuario {
  usuario_dominio: string
  nombres: string
  apellidos: string
  correo: string
  estado: 'activo' | 'inactivo'
  password?: string
  roles?: number[]
  permissions?: number[]
}
