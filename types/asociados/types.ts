export interface AsociadoInterface {
  id: number | null
  cif?: number
  codigo_cliente_unico?: string
  dpi?: string | null
  cedula?: string
  nit?: string
  pasaporte?: string
  fecha_vencimiento_pasaporte?: string
  tipo_doc_alternativo?: string
  fe_edad?: string
  primer_nombre: string
  segundo_nombre?: string
  tercer_nombre?: string
  primer_apellido: string
  segundo_apellido?: string
  apellido_casada?: string
  fecha_nacimiento?: string
  sexo: string
  ocupacion_renap?: string
  tipo: string
  fecha_apertura: string
  fecha_actualizacion?: string
  tipo_cliente_id?: number
  fecha_ive?: string
  representante_legal_id?: number
  no_licencia?: string
  depto_nacimiento_id?: number
  municipio_nacimiento_id?: number
  pais_nacimiento_id?: number
  moneda_ingreso_laboral_id?: number
  ingreso_laboral?: number
  ingresos_negocio?: number
  ingreso_negocio_moneda_id?: number
  act_economica_sector_id?: number
  act_economica_rubro_id?: number
  act_economica_sub_rubro_id?: number
  moneda_ingresos_totales_id?: number
  rango_ingresos_id?: number
  monto_egresos_totales?: number
  moneda_egresos_totales_id?: number
  rango_egresos_id?: number
  telefono_laboral?: string
  fecha_carga?: string
  direccion?: string
  telefono_residencia?: string
  telefono_celular?: string
  email?: string
  relacion_dependencia: string
  empresa?: string
  puesto?: string
  fecha_ingreso_laboral?: string
  direccion_laboral?: string
  direccion_laboral_dcap?: string
  telefono_oficina?: string
  fax_oficina?: string
  negocio_propio: string
  nombre_negocio?: string
  direccion_negocio?: string
  patente_negocio?: string
  nit_negocio?: string
  fecha_inicio_negocio?: string
  telefono_negocio?: string
  objeto_negocio?: string
  ingresos_mensuales: number
  otros_ingresos: number
  ingresos_totales: number
  created_at?: string
  updated_at?: string
  deleted_at?: string
  departamento_id?: number
  municipio_id?: number
  aldea_id?: number
  pais_id?: number
  otra_nacionalidad_id?: number
  profesion_id?: number
  ocupacion_id?: number
  ingresos_mensual_id?: number
  egresos_mensual_id?: number
  estado_domicilio_id?: number
  estado_civil_id?: number
  actividad_economica_id?: number
  unidad_id?: number
  codigo_infornet?: string
  codigo_transunion?: string
  agencia_codigo?: number
  region_id?: number
  numeros_telefono?: string
  es_socio: string
  edad?: number
  zona?: string
  nacionalidad_id?: number
  telefono_alterno?: string
  ingreso_remesas_familiares?: number
  estado_cliente?: string
  codigo_ejecutivo?: string
  nombre_ejecutivo?: string
  zona_laboral?: string
  patrono?: string
  zona_negocio?: string
  referencia_personal01?: string
  referencia_personal02?: string
  referencia_comercial01?: string
  referencia_comercial02?: string
  referencia_laboral01?: string
  referencia_laboral02?: string
  referencia_familiar01?: string
  referencia_familiar02?: string
  referencia_bancaria?: string
  proveedores_principales?: string
  clientes_principales?: string
  es_cpe: number
  fecha_cpe?: string
  alto_riesgo: number
  numero_creditos: number
  saldo_creditos: number
  numero_tarjeta_credito: number
  saldo_tarjeta_credito: number
  numero_total_credito: number
  saldo_total_credito: number
  numero_captaciones: number
  saldo_captaciones: number
  numero_captaciones_sin_aportacion: number
  saldo_captaciones_sin_aportacion: number
  numero_remesas: number
  saldo_remesas: number
  tiene_aportacion: number
  tiene_bdi: number
  fecha_bdi?: string
  actual_asociatividad_id?: number
  anterior_asociatividad_id?: number
  es_socio_nuevo?: number
  tipo_identificacion_id: number
  notificar_por_telefono: number
  telefono_notificacion?: string
  notificar_por_email: number
  email_notificacion?: string
}

export interface ParentescoInterface {
  id: number
  nombre: string
  parentesco_tipo_id: number
  parentesco_grado_id: number
  activo: number | null
  cantidad_guardar_modulo_familiares?: number | null
  activo_modulo_familiares?: number | null
  created_at?: string | null
  updated_at?: string | null
  deleted_at?: string | null
  uso_pep: number
}

export interface AsociadoDatosFirmaElectronicaInterface {
  serial_number: number
  given_name: string
  surname_1: string
  surname_2: string
  citizenship: string
  citizen_tax_number: string
  email: string
  mobile_phone_number: string
  residence: string
  residence_city: string
  residence_address: string
}
