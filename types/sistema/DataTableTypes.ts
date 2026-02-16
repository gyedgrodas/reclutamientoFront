export interface ColumnaInterface {
  title: string
  key: string
  exportable?: boolean
  visible?: boolean
  sortable?: boolean
  OpcionesFiltro?: {
    campo?: string 
    operador: OperadorFiltroInterface
    valor: any
  }
}

export interface DataTablePropsInterface {
  endpoint: string
  model: string
  columnas: ColumnaInterface[]
  cantidadPorPagina?: number
  cantidadPorPaginaOpciones?: number[]
  botones?: string[]
  titulo?: string
  relaciones?: string[]
  nombreArchivoExport?: string
  placeholder?: string
  buscador?: boolean
}

export interface PaginatedResponseInterface {
  current_page: number
  data: []
  last_page: number
  per_page: number
  total: number
}

export interface QueryParamsInterface {
  'page[number]'?: number
  'page[size]'?: number
  sort?: string
  include?: string

  [key: string]: string | number | undefined
}

// 1. Definimos los operadores como un tipo reutilizable
export type OperadorFiltroInterface = 
  // Comparación Básica
  | '=' 
  | '!=' 
  | '<' 
  | '<=' 
  | '>' 
  | '>=' 
  
  // Búsqueda de Texto
  | 'like'      // '%valor%'
  | 'not like' 
  | 'ilike'     // Case insensitive (Postgres)
  
  // Rangos y Listas
  | 'between'       // Requiere valor array: [inicio, fin]
  | 'not between' 
  | 'in'            // Requiere valor array: [1, 2, 3]
  | 'not in' 
  
  // Verificación de Nulos (el value suele ignorarse aquí)
  | 'is_null' 
  | 'is_not_null'

  // Especiales (Laravel)
  | 'scope';