export type EstadoCatalogo = 'Activo' | 'Inactivo'

export interface Pais {
  id: number
  nombre: string
  codigo_iso2: string
  codigo_iso3: string
  estado: EstadoCatalogo
}

export interface DatosPais {
  nombre: string
  codigo_iso2: string
  codigo_iso3: string
  estado: EstadoCatalogo
}

export interface Departamento {
  id: number
  nombre: string
  pais_id: number
  estado: EstadoCatalogo
  pais?: Pais
}

export interface DatosDepartamento {
  nombre: string
  pais_id: number | null
  estado: EstadoCatalogo
}

export interface Municipio {
  id: number
  nombre: string
  departamento_id: number
  estado: EstadoCatalogo
  departamento?: Departamento & { pais?: Pais }
}

export interface DatosMunicipio {
  nombre: string
  departamento_id: number | null
  estado: EstadoCatalogo
}

export interface EtapaReclutamiento {
  id: number
  nombre: string
  orden: number
  estado_publico: string | null
  es_terminal: boolean
  estado: EstadoCatalogo
}

export interface DatosEtapaReclutamiento {
  nombre: string
  orden: number | null
  estado_publico: string | null
  es_terminal: boolean
  estado: EstadoCatalogo
}
