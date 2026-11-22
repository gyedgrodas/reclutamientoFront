import type { EntidadBitacoraReclutamiento } from '@/types/reclutamiento'

export interface CambioLegibleBitacora {
  clave: string
  etiqueta: string
  anterior: string | null
  nuevo: string
  esCambio: boolean
}

export interface MetaEntidadBitacora {
  valor: EntidadBitacoraReclutamiento
  etiqueta: string
  color: string
  icono: string
}

export const ENTIDADES_BITACORA: MetaEntidadBitacora[] = [
  {
    valor: 'SolicitudVacante',
    etiqueta: 'Solicitud de vacante',
    color: 'info',
    icono: 'tabler-file-check',
  },
  {
    valor: 'Vacante',
    etiqueta: 'Vacante',
    color: 'success',
    icono: 'tabler-briefcase',
  },
  {
    valor: 'Postulacion',
    etiqueta: 'Postulación',
    color: 'primary',
    icono: 'tabler-user-check',
  },
]

const MAPA_ENTIDADES: Record<string, MetaEntidadBitacora> = Object.fromEntries(
  ENTIDADES_BITACORA.map(item => [item.valor, item]),
)

const CLAVES_OMITIDAS = new Set([
  'password',
  'passwd',
  'secret',
  'token',
  'remember_token',
  'api_key',
  'apikey',
  'authorization',
  'cookie',
  'private_key',
  'two_factor_secret',
  'two_factor_recovery_codes',
  'updated_at',
  'created_at',
  'deleted_at',
])

const PATRON_SENSIBLE_OCULTAR = /password|passwd|secret|token|api[_-]?key|authorization|cookie|credential|private[_-]?key|hash/i
const PATRON_SENSIBLE_PROTEGER = /dpi|nit|pretension_salarial|salario|telefono|celular|correo|email|direccion|cuenta_bancaria/i

const ETIQUETAS_CAMPOS: Record<string, string> = {
  estado: 'Estado',
  motivo: 'Motivo',
  numero_plazas: 'Número de plazas',
  justificacion: 'Justificación',
  observaciones: 'Observaciones',
  observacion_movimiento: 'Observación de movimiento',
  fecha_resolucion: 'Fecha de resolución',
  fecha_apertura: 'Fecha de apertura',
  fecha_cierre_estimada: 'Fecha de cierre estimada',
  fecha_cierre_real: 'Fecha de cierre real',
  fecha_postulacion: 'Fecha de postulación',
  fecha_ultima_actualizacion: 'Última actualización',
  puesto_id: 'Puesto',
  puesto: 'Puesto',
  unidad_id: 'Unidad / Agencia',
  unidad: 'Unidad / Agencia',
  solicitante_id: 'Solicitante',
  solicitante: 'Solicitante',
  aprobador_id: 'Aprobador',
  aprobador: 'Aprobador',
  responsable_id: 'Responsable',
  responsable: 'Responsable',
  candidato_id: 'Candidato',
  candidato: 'Candidato',
  vacante_id: 'Vacante',
  solicitud_id: 'Solicitud',
  etapa_reclutamiento_id: 'Etapa de reclutamiento',
  etapa: 'Etapa',
  descripcion: 'Descripción',
  requisitos: 'Requisitos',
}

export const metaEntidadBitacora = (entidad?: string | null): MetaEntidadBitacora => {
  if (entidad && MAPA_ENTIDADES[entidad])
    return MAPA_ENTIDADES[entidad]

  return {
    valor: 'SolicitudVacante',
    etiqueta: entidad || 'Registro',
    color: 'secondary',
    icono: 'tabler-history',
  }
}

export const colorAccionBitacora = (accion?: string | null): string => {
  const texto = (accion || '').toLowerCase()
  if (texto.includes('rechaz') || texto.includes('elimin') || texto.includes('cancel') || texto.includes('descart'))
    return 'error'
  if (texto.includes('aprob') || texto.includes('contrat') || texto.includes('creación') || texto.includes('crear') || texto.includes('cread') || texto.includes('registr'))
    return 'success'
  if (texto.includes('actualiz') || texto.includes('modific') || texto.includes('cambio') || texto.includes('movim'))
    return 'info'
  if (texto.includes('pendien') || texto.includes('revis'))
    return 'warning'

  return 'secondary'
}

export const iconoAccionBitacora = (accion?: string | null): string => {
  const texto = (accion || '').toLowerCase()
  if (texto.includes('rechaz') || texto.includes('cancel') || texto.includes('descart'))
    return 'tabler-circle-x'
  if (texto.includes('elimin'))
    return 'tabler-trash'
  if (texto.includes('aprob') || texto.includes('contrat'))
    return 'tabler-circle-check'
  if (texto.includes('creación') || texto.includes('crear') || texto.includes('cread') || texto.includes('registr'))
    return 'tabler-plus'
  if (texto.includes('actualiz') || texto.includes('modific') || texto.includes('cambio') || texto.includes('movim'))
    return 'tabler-edit'

  return 'tabler-activity'
}

export const humanizarClaveCampo = (clave: string): string => {
  const limpia = clave.trim()
  if (ETIQUETAS_CAMPOS[limpia])
    return ETIQUETAS_CAMPOS[limpia]

  const normalizada = limpia
    .replace(/_id$/i, '')
    .replace(/[_-]+/g, ' ')
    .trim()

  if (!normalizada)
    return limpia

  return normalizada.charAt(0).toUpperCase() + normalizada.slice(1)
}

const esObjetoPlano = (valor: unknown): valor is Record<string, unknown> =>
  Boolean(valor) && typeof valor === 'object' && !Array.isArray(valor)

const esClaveOmitida = (clave: string): boolean =>
  CLAVES_OMITIDAS.has(clave.toLowerCase()) || PATRON_SENSIBLE_OCULTAR.test(clave)

const formatearValorBitacora = (clave: string, valor: unknown): string => {
  if (PATRON_SENSIBLE_PROTEGER.test(clave))
    return 'Dato protegido'

  if (valor === null || valor === undefined || valor === '')
    return 'Sin valor'

  if (typeof valor === 'boolean')
    return valor ? 'Sí' : 'No'

  if (typeof valor === 'number')
    return String(valor)

  if (typeof valor === 'string') {
    const trimmed = valor.trim()
    if (!trimmed)
      return 'Sin valor'

    // Formatear fechas ISO legibles si coinciden con YYYY-MM-DD o ISO datetime
    if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const [anio, mes, dia] = trimmed.split('-')

      return `${dia}/${mes}/${anio}`
    }

    if (/^\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}/.test(trimmed)) {
      const fecha = new Date(trimmed)
      if (!Number.isNaN(fecha.getTime())) {
        return new Intl.DateTimeFormat('es-GT', {
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(fecha)
      }
    }

    return trimmed
  }

  if (Array.isArray(valor)) {
    if (!valor.length)
      return 'Sin elementos'

    return valor
      .map(item => (esObjetoPlano(item) ? 'Elemento' : formatearValorBitacora(clave, item)))
      .slice(0, 5)
      .join(', ')
  }

  if (esObjetoPlano(valor)) {
    if (typeof valor.nombre === 'string' && valor.nombre.trim())
      return valor.nombre.trim()

    const pares = Object.entries(valor)
      .filter(([k]) => !esClaveOmitida(k))
      .slice(0, 4)
      .map(([k, v]) => `${humanizarClaveCampo(k)}: ${formatearValorBitacora(k, v)}`)

    return pares.length ? pares.join(' · ') : 'Detalle registrado'
  }

  return String(valor)
}

export const extraerCambiosBitacora = (cambios: Record<string, unknown> | null | undefined): CambioLegibleBitacora[] => {
  if (!esObjetoPlano(cambios))
    return []

  const resultado: CambioLegibleBitacora[] = []

  // Formato Spatie Activitylog: { attributes: {...}, old: {...} }
  if (esObjetoPlano(cambios.attributes) || esObjetoPlano(cambios.old)) {
    const nuevos = esObjetoPlano(cambios.attributes) ? cambios.attributes : {}
    const anteriores = esObjetoPlano(cambios.old) ? cambios.old : {}
    const claves = Array.from(new Set([...Object.keys(anteriores), ...Object.keys(nuevos)]))

    for (const clave of claves) {
      if (esClaveOmitida(clave))
        continue

      const tieneAnterior = Object.prototype.hasOwnProperty.call(anteriores, clave)
      const valAnterior = tieneAnterior ? formatearValorBitacora(clave, anteriores[clave]) : null
      const valNuevo = formatearValorBitacora(clave, nuevos[clave])

      if (tieneAnterior && valAnterior === valNuevo)
        continue

      resultado.push({
        clave,
        etiqueta: humanizarClaveCampo(clave),
        anterior: valAnterior,
        nuevo: valNuevo,
        esCambio: tieneAnterior,
      })
    }

    return resultado
  }

  // Formato { campo: { anterior, nuevo } } o { campo: { old, new } } o { campo: { before, after } } o plano { campo: valor }
  for (const [clave, valor] of Object.entries(cambios)) {
    if (esClaveOmitida(clave))
      continue

    if (esObjetoPlano(valor)) {
      const tieneParAnteriorNuevo = ('anterior' in valor || 'nuevo' in valor)
        || ('old' in valor || 'new' in valor)
        || ('before' in valor || 'after' in valor)

      if (tieneParAnteriorNuevo) {
        const rawAnterior = 'anterior' in valor
          ? valor.anterior
          : ('old' in valor ? valor.old : valor.before)

        const rawNuevo = 'nuevo' in valor
          ? valor.nuevo
          : ('new' in valor ? valor.new : valor.after)

        const valAnterior = rawAnterior !== undefined ? formatearValorBitacora(clave, rawAnterior) : null
        const valNuevo = formatearValorBitacora(clave, rawNuevo)

        if (valAnterior !== null && valAnterior === valNuevo)
          continue

        resultado.push({
          clave,
          etiqueta: humanizarClaveCampo(clave),
          anterior: valAnterior,
          nuevo: valNuevo,
          esCambio: valAnterior !== null,
        })

        continue
      }
    }

    resultado.push({
      clave,
      etiqueta: humanizarClaveCampo(clave),
      anterior: null,
      nuevo: formatearValorBitacora(clave, valor),
      esCambio: false,
    })
  }

  return resultado
}
