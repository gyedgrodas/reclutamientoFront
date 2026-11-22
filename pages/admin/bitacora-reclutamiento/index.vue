<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type {
  EntidadBitacoraReclutamiento,
  RegistroBitacoraReclutamiento,
} from '@/types/reclutamiento'
import type { PaginationMeta, SendResponseInterface } from '@/types/sistema/types'
import {
  ENTIDADES_BITACORA,
  colorAccionBitacora,
  extraerCambiosBitacora,
  iconoAccionBitacora,
  metaEntidadBitacora,
} from '@/utils/bitacoraReclutamiento'
import { tiempoRelativoCorto } from '@/utils/reclutamientoUx'

definePageMeta({
  navActiveLink: 'admin-bitacora-reclutamiento',
  middleware: 'permissions',
  action: 'ver bitacora reclutamiento',
  subject: 'BitacoraReclutamiento',
})

const route = useRoute()
const router = useRouter()
const { get } = useClienteRequest()

const entidadesValidas = new Set<string>(ENTIDADES_BITACORA.map(item => item.valor))

const entidadInicial = (): EntidadBitacoraReclutamiento | null => {
  const queryEntidad = typeof route.query.entidad === 'string' ? route.query.entidad : null

  return queryEntidad && entidadesValidas.has(queryEntidad)
    ? queryEntidad as EntidadBitacoraReclutamiento
    : null
}

const cargando = ref(false)
const errorLista = ref<string | null>(null)
const registros = ref<RegistroBitacoraReclutamiento[]>([])

const filtroEntidad = ref<EntidadBitacoraReclutamiento | null>(entidadInicial())

const paginacion = reactive({
  page: 1,
  perPage: 15,
  total: 0,
  lastPage: 1,
  from: 0,
  to: 0,
})

const dialogDetalle = ref(false)
const registroSeleccionado = ref<RegistroBitacoraReclutamiento | null>(null)

const opcionesPorPagina = [
  { title: '10 por página', value: 10 },
  { title: '15 por página', value: 15 },
  { title: '25 por página', value: 25 },
  { title: '50 por página', value: 50 },
]

const hayFiltroActivo = computed(() => Boolean(filtroEntidad.value))

const cambiosRegistroSeleccionado = computed(() =>
  extraerCambiosBitacora(registroSeleccionado.value?.cambios),
)

let secuencia = 0
let controlador: AbortController | null = null

const esErrorCancelacion = (error: any) =>
  error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.name === 'AbortError'

const construirParametros = () => {
  const params: Record<string, any> = {
    'page[number]': paginacion.page,
    'page[size]': paginacion.perPage,
  }

  if (filtroEntidad.value)
    params['filter[entidad]'] = filtroEntidad.value

  return params
}

const cargarBitacora = async () => {
  controlador?.abort()

  const controladorActual = new AbortController()

  controlador = controladorActual

  const secuenciaActual = ++secuencia

  cargando.value = true
  errorLista.value = null

  try {
    const respuesta = await get<SendResponseInterface<PaginationMeta<RegistroBitacoraReclutamiento[]>>>(
      '/api/bitacora-reclutamiento',
      {
        params: construirParametros(),
        signal: controladorActual.signal,
      },
    )

    if (secuenciaActual !== secuencia)
      return

    const paginador = respuesta?.data
    if (!paginador || !Array.isArray(paginador.data))
      throw new Error('La respuesta del servidor no tiene el formato paginado esperado.')

    registros.value = paginador.data
    paginacion.page = Number(paginador.current_page) || 1
    paginacion.perPage = Number(paginador.per_page) || paginacion.perPage
    paginacion.total = Number(paginador.total) || 0
    paginacion.lastPage = Math.max(1, Number(paginador.last_page) || 1)
    paginacion.from = Number(paginador.from) || 0
    paginacion.to = Number(paginador.to) || 0
  }
  catch (error: any) {
    if (secuenciaActual !== secuencia || esErrorCancelacion(error))
      return

    errorLista.value = error?.response?.data?.message || error?.message || 'No fue posible consultar la bitácora de reclutamiento.'
    manejaError(error)
  }
  finally {
    if (secuenciaActual === secuencia) {
      cargando.value = false
      if (controlador === controladorActual)
        controlador = null
    }
  }
}

const sincronizarQueryEntidad = () => {
  const queryActual = { ...route.query }
  if (filtroEntidad.value)
    queryActual.entidad = filtroEntidad.value
  else
    delete queryActual.entidad

  router.replace({ query: queryActual }).catch(() => {})
}

const seleccionarEntidad = (entidad: EntidadBitacoraReclutamiento | null) => {
  if (filtroEntidad.value === entidad)
    return

  filtroEntidad.value = entidad
  paginacion.page = 1
  sincronizarQueryEntidad()
  cargarBitacora()
}

const limpiarFiltros = () => {
  filtroEntidad.value = null
  paginacion.page = 1
  sincronizarQueryEntidad()
  cargarBitacora()
}

const cambiarPagina = (nuevaPagina: number) => {
  if (nuevaPagina === paginacion.page)
    return

  paginacion.page = nuevaPagina
  cargarBitacora()
}

const cambiarPorPagina = (nuevoTamanio: number) => {
  paginacion.perPage = nuevoTamanio
  paginacion.page = 1
  cargarBitacora()
}

const abrirDetalleCambios = (registro: RegistroBitacoraReclutamiento) => {
  registroSeleccionado.value = registro
  dialogDetalle.value = true
}

const formatearFechaSegura = (fecha?: string | null) => {
  if (!fecha)
    return 'Fecha no disponible'
  try {
    return formatoFechaHora(fecha)
  }
  catch {
    return fecha
  }
}

const rutaEntidad = (registro: RegistroBitacoraReclutamiento): string | null => {
  if (registro.accion === 'Eliminación')
    return null

  if (registro.entidad === 'SolicitudVacante' && registro.entidad_id && can('ver solicitudes vacante', 'SolicitudVacante'))
    return `/admin/solicitudes-vacante/show/${registro.entidad_id}`

  if (registro.entidad === 'Vacante' && registro.entidad_id && can('ver vacantes', 'Vacante'))
    return `/admin/vacantes/show/${registro.entidad_id}`

  if (registro.entidad === 'Postulacion' && can('ver postulaciones', 'Postulacion'))
    return '/admin/postulaciones'

  return null
}

const recortarTexto = (texto: string, maximo = 68): string => {
  if (texto.length <= maximo)
    return texto

  return `${texto.slice(0, maximo).trimEnd()}…`
}

onMounted(() => {
  cargarBitacora()
})

onBeforeUnmount(() => {
  controlador?.abort()
})
</script>

<template>
  <div>
    <header class="tt-page-header">
      <div>
        <span class="tt-eyebrow">TRAZABILIDAD Y AUDITORÍA</span>
        <h1 class="tt-page-title">
          Bitácora de reclutamiento
        </h1>
        <p class="tt-page-subtitle">
          Consulte el historial cronológico de acciones sobre solicitudes de vacante, vacantes y postulaciones.
        </p>
      </div>

      <div class="d-flex flex-wrap align-center gap-2">
        <VChip
          v-if="!cargando && !errorLista"
          color="primary"
          variant="tonal"
          size="small"
          prepend-icon="tabler-list-details"
          class="font-weight-bold"
        >
          {{ paginacion.total }} {{ paginacion.total === 1 ? 'registro' : 'registros' }}
        </VChip>

        <VBtn
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-refresh"
          :loading="cargando"
          @click="cargarBitacora"
        >
          Actualizar
        </VBtn>
      </div>
    </header>

    <!-- Barra de filtros por entidad -->
    <section
      class="tt-panel pa-4 mb-5"
      aria-label="Filtros de bitácora"
    >
      <div class="d-flex flex-wrap align-center justify-space-between gap-3">
        <div class="d-flex flex-wrap align-center gap-2">
          <span class="text-caption font-weight-bold text-uppercase text-medium-emphasis me-1">
            Entidad:
          </span>

          <VBtn
            size="small"
            :color="!filtroEntidad ? 'primary' : 'secondary'"
            :variant="!filtroEntidad ? 'flat' : 'tonal'"
            prepend-icon="tabler-layers-subtract"
            @click="seleccionarEntidad(null)"
          >
            Todas
          </VBtn>

          <VBtn
            v-for="entidad in ENTIDADES_BITACORA"
            :key="entidad.valor"
            size="small"
            :color="filtroEntidad === entidad.valor ? entidad.color : 'secondary'"
            :variant="filtroEntidad === entidad.valor ? 'flat' : 'tonal'"
            :prepend-icon="entidad.icono"
            @click="seleccionarEntidad(entidad.valor)"
          >
            {{ entidad.etiqueta }}
          </VBtn>
        </div>

        <div class="d-flex align-center gap-2">
          <VBtn
            v-if="hayFiltroActivo"
            size="small"
            color="secondary"
            variant="text"
            prepend-icon="tabler-filter-off"
            @click="limpiarFiltros"
          >
            Limpiar filtro
          </VBtn>
        </div>
      </div>
    </section>

    <!-- Estado de carga -->
    <div
      v-if="cargando"
      role="status"
      aria-live="polite"
      class="mb-4"
    >
      <VProgressLinear
        indeterminate
        color="primary"
        rounded
        aria-label="Cargando registros de bitácora"
      />
    </div>

    <!-- Estado de error -->
    <section
      v-if="errorLista && !cargando"
      class="tt-panel pa-8 text-center mb-5"
      role="alert"
    >
      <VIcon
        icon="tabler-alert-triangle"
        size="46"
        color="error"
        class="mb-2"
      />
      <h2 class="text-h6 font-weight-bold mb-1">
        No se pudo cargar la bitácora
      </h2>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ errorLista }}
      </p>
      <div class="d-flex justify-center flex-wrap gap-2">
        <VBtn
          color="primary"
          prepend-icon="tabler-refresh"
          @click="cargarBitacora"
        >
          Reintentar
        </VBtn>
        <VBtn
          v-if="hayFiltroActivo"
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-filter-off"
          @click="limpiarFiltros"
        >
          Ver todas las entidades
        </VBtn>
      </div>
    </section>

    <!-- Contenido principal -->
    <template v-else-if="!cargando || registros.length">
      <!-- Estado vacío -->
      <section
        v-if="!cargando && !registros.length"
        class="tt-panel pa-10 text-center"
      >
        <VIcon
          icon="tabler-history-off"
          size="48"
          color="secondary"
          class="mb-3"
        />
        <h2 class="text-h6 font-weight-bold mb-1">
          {{ hayFiltroActivo ? 'Sin eventos para la entidad seleccionada' : 'Aún no hay movimientos registrados' }}
        </h2>
        <p class="text-body-2 text-medium-emphasis mb-4">
          {{
            hayFiltroActivo
              ? 'No se encontraron registros de auditoría con el filtro actual. Pruebe seleccionando otra entidad o viendo todos los registros.'
              : 'Las acciones relevantes sobre solicitudes de vacante, vacantes y postulaciones aparecerán aquí automáticamente.'
          }}
        </p>
        <VBtn
          v-if="hayFiltroActivo"
          color="primary"
          variant="tonal"
          prepend-icon="tabler-filter-off"
          @click="limpiarFiltros"
        >
          Mostrar todas las entidades
        </VBtn>
      </section>

      <!-- Lista / cronología de auditoría -->
      <section
        v-else
        class="d-flex flex-column gap-3"
        aria-label="Registros de bitácora de reclutamiento"
      >
        <article
          v-for="item in registros"
          :key="item.id"
          class="tt-panel tt-audit-card pa-4"
        >
          <div class="tt-audit-card__head">
            <div class="d-flex flex-wrap align-center gap-2">
              <VChip
                size="small"
                :color="metaEntidadBitacora(item.entidad).color"
                :prepend-icon="metaEntidadBitacora(item.entidad).icono"
                variant="tonal"
                class="font-weight-bold"
              >
                {{ metaEntidadBitacora(item.entidad).etiqueta }}
                <span
                  v-if="item.entidad_id !== null && item.entidad_id !== undefined"
                  class="ms-1"
                >
                  #{{ item.entidad_id }}
                </span>
              </VChip>

              <VChip
                size="small"
                :color="colorAccionBitacora(item.accion)"
                :prepend-icon="iconoAccionBitacora(item.accion)"
                variant="outlined"
                class="font-weight-bold"
              >
                {{ item.accion || 'Acción registrada' }}
              </VChip>

              <NuxtLink
                v-if="item.solicitud_id && item.entidad !== 'SolicitudVacante' && can('ver solicitudes vacante', 'SolicitudVacante')"
                :to="`/admin/solicitudes-vacante/show/${item.solicitud_id}`"
                class="tt-audit-ref-link text-decoration-none"
              >
                <VIcon
                  icon="tabler-link"
                  size="13"
                />
                Solicitud #{{ item.solicitud_id }}
              </NuxtLink>
              <span
                v-else-if="item.solicitud_id && item.entidad !== 'SolicitudVacante'"
                class="tt-audit-ref-link"
              >
                <VIcon
                  icon="tabler-link"
                  size="13"
                />
                Solicitud #{{ item.solicitud_id }}
              </span>
            </div>

            <div class="tt-audit-card__meta">
              <span class="tt-audit-actor">
                <VIcon
                  icon="tabler-user-circle"
                  size="15"
                />
                <strong>{{ item.actor || 'Sistema' }}</strong>
              </span>
              <span
                class="tt-audit-date"
                :title="formatearFechaSegura(item.created_at)"
              >
                <VIcon
                  icon="tabler-clock"
                  size="14"
                />
                {{ formatearFechaSegura(item.created_at) }}
                <small
                  v-if="item.created_at"
                  class="text-disabled ms-1"
                >
                  ({{ tiempoRelativoCorto(item.created_at) }})
                </small>
              </span>
            </div>
          </div>

          <!-- Resumen claro de cambios -->
          <div class="tt-audit-card__body mt-3">
            <template v-if="extraerCambiosBitacora(item.cambios).length">
              <div class="tt-audit-changes">
                <div
                  v-for="cambio in extraerCambiosBitacora(item.cambios).slice(0, 3)"
                  :key="cambio.clave"
                  class="tt-audit-change-pill"
                >
                  <span class="tt-audit-change-pill__label">{{ cambio.etiqueta }}:</span>
                  <template v-if="cambio.esCambio && cambio.anterior !== null">
                    <span class="tt-audit-change-pill__old">{{ recortarTexto(cambio.anterior, 42) }}</span>
                    <VIcon
                      icon="tabler-arrow-right"
                      size="13"
                      class="mx-1 text-medium-emphasis"
                    />
                  </template>
                  <span class="tt-audit-change-pill__new">{{ recortarTexto(cambio.nuevo, 60) }}</span>
                </div>
              </div>
            </template>
            <p
              v-else
              class="text-caption text-medium-emphasis mb-0"
            >
              Evento registrado sin detalle adicional de campos modificados.
            </p>

            <div class="tt-audit-card__actions">
              <VBtn
                v-if="extraerCambiosBitacora(item.cambios).length"
                size="small"
                color="secondary"
                variant="tonal"
                prepend-icon="tabler-list-search"
                @click="abrirDetalleCambios(item)"
              >
                {{
                  extraerCambiosBitacora(item.cambios).length > 3
                    ? `Ver todos (${extraerCambiosBitacora(item.cambios).length})`
                    : 'Ver detalle'
                }}
              </VBtn>

              <VBtn
                v-if="rutaEntidad(item)"
                size="small"
                color="primary"
                variant="text"
                append-icon="tabler-arrow-up-right"
                :to="rutaEntidad(item)!"
              >
                Ir al registro
              </VBtn>
            </div>
          </div>
        </article>
      </section>

      <!-- Paginación del servidor -->
      <div
        v-if="registros.length"
        class="tt-panel pa-4 mt-4 d-flex flex-wrap align-center justify-space-between gap-3"
      >
        <div class="d-flex flex-wrap align-center gap-3">
          <span class="text-body-2 text-medium-emphasis">
            Mostrando <strong>{{ paginacion.from }}</strong>–<strong>{{ paginacion.to }}</strong> de <strong>{{ paginacion.total }}</strong> registros
          </span>
          <div style="inline-size: 160px;">
            <AppSelect
              v-model="paginacion.perPage"
              :items="opcionesPorPagina"
              density="compact"
              hide-details
              aria-label="Registros por página"
              @update:model-value="cambiarPorPagina"
            />
          </div>
        </div>

        <VPagination
          :model-value="paginacion.page"
          :length="paginacion.lastPage"
          :total-visible="5"
          density="comfortable"
          @update:model-value="cambiarPagina"
        />
      </div>
    </template>

    <!-- Diálogo de detalle de cambios -->
    <VDialog
      v-model="dialogDetalle"
      max-width="680"
      scrollable
    >
      <VCard v-if="registroSeleccionado">
        <VCardTitle class="d-flex align-center justify-space-between flex-wrap gap-2 pa-5 pb-3">
          <div>
            <span class="tt-eyebrow">DETALLE DE AUDITORÍA · #{{ registroSeleccionado.id }}</span>
            <h2 class="text-h6 font-weight-bold mb-0">
              {{ metaEntidadBitacora(registroSeleccionado.entidad).etiqueta }}
              <span v-if="registroSeleccionado.entidad_id !== null && registroSeleccionado.entidad_id !== undefined">
                #{{ registroSeleccionado.entidad_id }}
              </span>
            </h2>
          </div>

          <VBtn
            icon="tabler-x"
            variant="text"
            size="small"
            color="secondary"
            aria-label="Cerrar detalle"
            @click="dialogDetalle = false"
          />
        </VCardTitle>

        <VDivider />

        <VCardText class="pa-5">
          <div class="tt-audit-modal-meta mb-4">
            <div class="tt-detail-box">
              <span>Acción</span>
              <strong>{{ registroSeleccionado.accion }}</strong>
            </div>
            <div class="tt-detail-box">
              <span>Usuario / Actor</span>
              <strong>{{ registroSeleccionado.actor || 'Sistema' }}</strong>
            </div>
            <div class="tt-detail-box">
              <span>Fecha y hora</span>
              <strong>{{ formatearFechaSegura(registroSeleccionado.created_at) }}</strong>
            </div>
          </div>

          <h3 class="text-subtitle-2 font-weight-bold mb-3">
            Cambios registrados
          </h3>

          <div
            v-if="cambiosRegistroSeleccionado.length"
            class="d-flex flex-column gap-2"
          >
            <div
              v-for="cambio in cambiosRegistroSeleccionado"
              :key="cambio.clave"
              class="tt-audit-diff-row"
            >
              <div class="tt-audit-diff-row__label">
                {{ cambio.etiqueta }}
              </div>
              <div class="tt-audit-diff-row__values">
                <template v-if="cambio.esCambio && cambio.anterior !== null">
                  <div class="tt-audit-diff-block tt-audit-diff-block--old">
                    <small>Anterior</small>
                    <p class="mb-0 pre-line">
                      {{ cambio.anterior }}
                    </p>
                  </div>
                  <div class="tt-audit-diff-block tt-audit-diff-block--new">
                    <small>Nuevo</small>
                    <p class="mb-0 pre-line">
                      {{ cambio.nuevo }}
                    </p>
                  </div>
                </template>
                <div
                  v-else
                  class="tt-audit-diff-block tt-audit-diff-block--new"
                >
                  <small>Valor registrado</small>
                  <p class="mb-0 pre-line">
                    {{ cambio.nuevo }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <VAlert
            v-else
            type="info"
            variant="tonal"
            density="compact"
          >
            Este evento no contiene campos modificados visibles.
          </VAlert>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4 justify-space-between">
          <VBtn
            v-if="rutaEntidad(registroSeleccionado)"
            color="primary"
            variant="tonal"
            prepend-icon="tabler-external-link"
            :to="rutaEntidad(registroSeleccionado)!"
            @click="dialogDetalle = false"
          >
            Ir al registro
          </VBtn>
          <VSpacer v-else />
          <VBtn
            color="secondary"
            variant="flat"
            @click="dialogDetalle = false"
          >
            Cerrar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped>
@import "@styles/reclutamiento-talent.scss";

.tt-detail-box {
  height: auto;
}

.pre-line {
  white-space: pre-line;
  word-break: break-word;
}

.tt-audit-card {
  border-left: 4px solid #218268;
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.tt-audit-card:hover {
  box-shadow: 0 8px 22px rgba(27, 65, 52, 0.08);
}

.tt-audit-card__head {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 10px 16px;
}

.tt-audit-card__meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 10px 14px;
  font-size: 12.5px;
  color: rgba(var(--v-theme-on-surface), 0.72);
}

.tt-audit-actor,
.tt-audit-date {
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.tt-audit-ref-link {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  font-weight: 700;
  padding: 3px 9px;
  border-radius: 999px;
  background: #eef5f1;
  color: #1f6f58;
}

.v-theme--dark .tt-audit-ref-link {
  background: rgba(33, 130, 104, 0.22);
  color: #6ee7b7;
}

.tt-audit-card__body {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding-top: 10px;
  border-top: 1px dashed rgba(23, 42, 39, 0.1);
}

.v-theme--dark .tt-audit-card__body {
  border-top-color: rgba(255, 255, 255, 0.1);
}

.tt-audit-changes {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  flex: 1 1 320px;
  min-width: 0;
}

.tt-audit-change-pill {
  display: inline-flex;
  flex-wrap: wrap;
  align-items: center;
  padding: 4px 10px;
  border-radius: 8px;
  font-size: 12px;
  background: #f5f9f7;
  border: 1px solid #e4ece8;
  max-width: 100%;
}

.v-theme--dark .tt-audit-change-pill {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(255, 255, 255, 0.1);
}

.tt-audit-change-pill__label {
  font-weight: 700;
  color: rgba(var(--v-theme-on-surface), 0.72);
  margin-inline-end: 5px;
}

.tt-audit-change-pill__old {
  color: rgba(var(--v-theme-on-surface), 0.56);
  text-decoration: line-through;
}

.tt-audit-change-pill__new {
  font-weight: 700;
  color: rgb(var(--v-theme-on-surface));
}

.tt-audit-card__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 6px;
}

.tt-audit-modal-meta {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.tt-audit-diff-row {
  padding: 10px 12px;
  border-radius: 10px;
  border: 1px solid #e6eeea;
  background: #f8fbf9;
}

.v-theme--dark .tt-audit-diff-row {
  background: rgba(255, 255, 255, 0.03);
  border-color: rgba(255, 255, 255, 0.09);
}

.tt-audit-diff-row__label {
  font-size: 12px;
  font-weight: 800;
  color: rgb(var(--v-theme-on-surface));
  margin-bottom: 6px;
}

.tt-audit-diff-row__values {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
}

.tt-audit-diff-block {
  padding: 8px 10px;
  border-radius: 8px;
  font-size: 12.5px;
}

.tt-audit-diff-block small {
  display: block;
  font-size: 10.5px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
  margin-bottom: 2px;
}

.tt-audit-diff-block--old {
  background: #fff4f2;
  color: #8c372a;
}

.tt-audit-diff-block--new {
  background: #eaf6f0;
  color: #135e4b;
}

.v-theme--dark .tt-audit-diff-block--old {
  background: rgba(220, 38, 38, 0.16);
  color: #fca5a5;
}

.v-theme--dark .tt-audit-diff-block--new {
  background: rgba(17, 123, 99, 0.22);
  color: #a7f3d0;
}

@media (max-width: 767px) {
  .tt-audit-modal-meta {
    grid-template-columns: 1fr;
  }
}
</style>
