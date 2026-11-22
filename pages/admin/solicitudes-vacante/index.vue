<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type {
  EstadoSolicitudVacante,
  MotivoVacante,
  PuestoResumen,
  SolicitudVacante,
  UnidadResumen,
} from '@/types/reclutamiento'
import type { PaginationMeta, SendResponseInterface } from '@/types/sistema/types'
import DetalleResolucionDialog from '@/views/pages/reclutamiento/solicitudes-vacante/DetalleResolucionDialog.vue'
import CrearVacanteDesdeSolicitudDialog from '@/views/pages/reclutamiento/solicitudes-vacante/CrearVacanteDesdeSolicitudDialog.vue'
import { nombreCompletoPersona } from '@/utils/reclutamientoUx'

definePageMeta({
  navActiveLink: 'admin-solicitudes-vacante',
  middleware: 'permissions',
  action: 'ver solicitudes vacante',
  subject: 'SolicitudVacante',
})

const { get } = useClienteRequest()
const { getCatalogos } = useCatalogo()
const puedeResolverSolicitud = usePuedeResolverSolicitud()

const vistaModo = ref<'bandeja' | 'tabla'>('bandeja')
const cargando = ref(false)
const errorLista = ref<string | null>(null)
const cargandoCatalogos = ref(false)
const errorCatalogos = ref<string | null>(null)
const errorMetricas = ref<string | null>(null)

const solicitudes = ref<SolicitudVacante[]>([])
const puestos = ref<PuestoResumen[]>([])
const unidades = ref<UnidadResumen[]>([])

const paginacion = reactive({
  page: 1,
  perPage: 10,
  total: 0,
  lastPage: 1,
  from: 0,
  to: 0,
})

const filtros = reactive({
  estado: null as EstadoSolicitudVacante | null,
  motivo: null as MotivoVacante | null,
  puesto_id: null as number | null,
  unidad_id: null as number | null,
  sort: '-id',
})

const metricas = reactive({
  total: 0,
  pendientes: 0,
  aprobadas: 0,
  rechazadas: 0,
})

const dialogDetalle = ref(false)
const dialogCrearVacante = ref(false)
const modoDialogDetalle = ref<'detalle' | 'resolver'>('detalle')
const solicitudSeleccionada = ref<SolicitudVacante | null>(null)

const estados = [
  { title: 'Pendiente', value: 'Pendiente' },
  { title: 'Aprobada', value: 'Aprobada' },
  { title: 'Rechazada', value: 'Rechazada' },
]

const motivos = [
  { title: 'Nueva', value: 'Nueva' },
  { title: 'Reemplazo', value: 'Reemplazo' },
]

const opcionesOrden = [
  { title: 'Más recientes', value: '-id' },
  { title: 'Más antiguas', value: 'id' },
  { title: 'Más plazas', value: '-numero_plazas' },
  { title: 'Estado (A-Z)', value: 'estado' },
  { title: 'Fecha creación (reciente)', value: '-created_at' },
]

const opcionesPorPagina = [
  { title: '10 por página', value: 10 },
  { title: '20 por página', value: 20 },
  { title: '50 por página', value: 50 },
]

const coloresEstado: Record<string, string> = {
  Pendiente: 'warning',
  Aprobada: 'success',
  Rechazada: 'error',
}

const iconosEstado: Record<string, string> = {
  Pendiente: 'tabler-clock',
  Aprobada: 'tabler-circle-check',
  Rechazada: 'tabler-circle-x',
}

const hayFiltrosActivos = computed(() =>
  Boolean(filtros.estado || filtros.motivo || filtros.puesto_id || filtros.unidad_id),
)

function comoLista<T>(valor: any, nombreCatalogo: string): T[] {
  if (Array.isArray(valor))
    return valor
  if (Array.isArray(valor?.data))
    return valor.data

  throw new Error(`Formato inesperado al cargar el catálogo de ${nombreCatalogo}.`)
}

let secuenciaSolicitudes = 0
let controladorSolicitudes: AbortController | null = null

const esErrorCancelacion = (error: any) =>
  error?.code === 'ERR_CANCELED' || error?.name === 'CanceledError' || error?.name === 'AbortError'

const construirParametros = () => {
  const params: Record<string, any> = {
    'page[number]': paginacion.page,
    'page[size]': paginacion.perPage,
    'sort': filtros.sort,
  }

  if (filtros.estado)
    params['filter[estado]'] = filtros.estado
  if (filtros.motivo)
    params['filter[motivo]'] = filtros.motivo
  if (filtros.puesto_id)
    params['filter[puesto_id]'] = filtros.puesto_id
  if (filtros.unidad_id)
    params['filter[unidad_id]'] = filtros.unidad_id

  return params
}

const cargarSolicitudes = async () => {
  controladorSolicitudes?.abort()

  const controladorActual = new AbortController()

  controladorSolicitudes = controladorActual

  const secuenciaActual = ++secuenciaSolicitudes

  cargando.value = true
  errorLista.value = null
  try {
    const respuesta = await get<SendResponseInterface<PaginationMeta<SolicitudVacante[]>>>(
      '/api/solicitudes-vacante',
      {
        params: construirParametros(),
        signal: controladorActual.signal,
      },
    )

    if (secuenciaActual !== secuenciaSolicitudes)
      return

    const paginador = respuesta?.data
    if (!paginador || !Array.isArray(paginador.data))
      throw new Error('La respuesta del servidor no tiene el formato paginado esperado.')

    solicitudes.value = paginador.data
    paginacion.page = Number(paginador.current_page) || 1
    paginacion.perPage = Number(paginador.per_page) || paginacion.perPage
    paginacion.total = Number(paginador.total) || 0
    paginacion.lastPage = Math.max(1, Number(paginador.last_page) || 1)
    paginacion.from = Number(paginador.from) || 0
    paginacion.to = Number(paginador.to) || 0

    if (solicitudSeleccionada.value) {
      const actualizada = solicitudes.value.find(item => item.id === solicitudSeleccionada.value?.id)
      if (actualizada)
        solicitudSeleccionada.value = actualizada
    }
  }
  catch (error: any) {
    if (secuenciaActual !== secuenciaSolicitudes || esErrorCancelacion(error))
      return

    errorLista.value = error?.response?.data?.message || error?.message || 'No fue posible cargar las solicitudes de vacante.'
    manejaError(error)
  }
  finally {
    if (secuenciaActual === secuenciaSolicitudes) {
      cargando.value = false
      if (controladorSolicitudes === controladorActual)
        controladorSolicitudes = null
    }
  }
}

const cargarMetricas = async () => {
  errorMetricas.value = null
  try {
    const [respTotal, respPendientes, respAprobadas, respRechazadas] = await Promise.all([
      get<SendResponseInterface<PaginationMeta<SolicitudVacante[]>>>('/api/solicitudes-vacante', {
        params: { 'page[number]': 1, 'page[size]': 1 },
      }),
      get<SendResponseInterface<PaginationMeta<SolicitudVacante[]>>>('/api/solicitudes-vacante', {
        params: { 'page[number]': 1, 'page[size]': 1, 'filter[estado]': 'Pendiente' },
      }),
      get<SendResponseInterface<PaginationMeta<SolicitudVacante[]>>>('/api/solicitudes-vacante', {
        params: { 'page[number]': 1, 'page[size]': 1, 'filter[estado]': 'Aprobada' },
      }),
      get<SendResponseInterface<PaginationMeta<SolicitudVacante[]>>>('/api/solicitudes-vacante', {
        params: { 'page[number]': 1, 'page[size]': 1, 'filter[estado]': 'Rechazada' },
      }),
    ])

    metricas.total = Number(respTotal?.data?.total) || 0
    metricas.pendientes = Number(respPendientes?.data?.total) || 0
    metricas.aprobadas = Number(respAprobadas?.data?.total) || 0
    metricas.rechazadas = Number(respRechazadas?.data?.total) || 0
  }
  catch (error: any) {
    errorMetricas.value = error?.response?.data?.message || 'No fue posible actualizar los indicadores de resumen.'
  }
}

const cargarCatalogos = async () => {
  cargandoCatalogos.value = true
  errorCatalogos.value = null
  try {
    const catalogos = await getCatalogos(['puestos', 'unidades'])

    puestos.value = comoLista<PuestoResumen>(catalogos.puestos, 'puestos')
    unidades.value = comoLista<UnidadResumen>(catalogos.unidades, 'unidades')
  }
  catch (error: any) {
    errorCatalogos.value = error?.response?.data?.message || error?.message || 'No fue posible cargar los catálogos de puestos y unidades.'
    manejaError(error)
  }
  finally {
    cargandoCatalogos.value = false
  }
}

const aplicarFiltros = () => {
  paginacion.page = 1
  cargarSolicitudes()
}

const alternarFiltroEstado = (estado: EstadoSolicitudVacante | null) => {
  filtros.estado = filtros.estado === estado ? null : estado
  aplicarFiltros()
}

const limpiarFiltros = () => {
  filtros.estado = null
  filtros.motivo = null
  filtros.puesto_id = null
  filtros.unidad_id = null
  filtros.sort = '-id'
  paginacion.page = 1
  cargarSolicitudes()
}

const cambiarPagina = (nuevaPagina: number) => {
  paginacion.page = nuevaPagina
  cargarSolicitudes()
}

const cambiarPorPagina = () => {
  paginacion.page = 1
  cargarSolicitudes()
}

const recargarTodo = async () => {
  await Promise.all([cargarSolicitudes(), cargarMetricas()])
}

const abrirDetalle = (item: SolicitudVacante, modo: 'detalle' | 'resolver' = 'detalle') => {
  solicitudSeleccionada.value = item
  modoDialogDetalle.value = modo
  dialogDetalle.value = true
}

const abrirCrearVacante = (item: SolicitudVacante) => {
  solicitudSeleccionada.value = item
  dialogDetalle.value = false
  dialogCrearVacante.value = true
}

const onSolicitudResuelta = async (actualizada: SolicitudVacante) => {
  solicitudSeleccionada.value = actualizada
  await recargarTodo()
}

const onVacanteCreada = async () => {
  await recargarTodo()
}

const formatearFechaCorta = (fecha?: string | null) => {
  if (!fecha)
    return '—'
  try {
    return formatearFecha(fecha)
  }
  catch {
    return fecha
  }
}

onMounted(async () => {
  await Promise.all([cargarCatalogos(), cargarSolicitudes(), cargarMetricas()])
})

onBeforeUnmount(() => {
  controladorSolicitudes?.abort()
})
</script>

<template>
  <div class="solicitudes-modulo">
    <!-- Encabezado ejecutivo -->
    <header class="tt-page-header">
      <div>
        <span class="tt-eyebrow">REQUERIMIENTOS DE PERSONAL</span>
        <h1 class="tt-page-title">
          Solicitudes de vacante y aprobaciones
        </h1>
        <p class="tt-page-subtitle">
          Gestione los requerimientos de plazas de cada unidad, registre aprobaciones gerenciales y convierta solicitudes aprobadas en vacantes oficiales.
        </p>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <VBtn
          v-if="can('ver vacantes', 'Vacante')"
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-briefcase"
          to="/admin/vacantes"
        >
          Ver vacantes
        </VBtn>
        <VBtn
          v-if="can('crear solicitudes vacante', 'SolicitudVacante')"
          color="primary"
          prepend-icon="tabler-plus"
          to="/admin/solicitudes-vacante/create"
        >
          Nueva solicitud
        </VBtn>
      </div>
    </header>

    <!-- Alerta si fallan indicadores -->
    <VAlert
      v-if="errorMetricas"
      type="warning"
      variant="tonal"
      class="mb-4"
    >
      <div class="d-flex flex-wrap align-center justify-space-between gap-2">
        <span>{{ errorMetricas }}</span>
        <VBtn
          size="small"
          variant="outlined"
          color="warning"
          @click="cargarMetricas"
        >
          Reintentar
        </VBtn>
      </div>
    </VAlert>

    <!-- KPIs interactivos -->
    <VRow class="mb-5">
      <VCol
        cols="6"
        sm="3"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': filtros.estado === 'Pendiente' }"
          @click="alternarFiltroEstado('Pendiente')"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">Pendientes</span>
            <div class="tt-stat-icon tt-stat-icon--warn">
              <VIcon
                icon="tabler-clock"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.pendientes }}</strong>
          <small class="tt-stat-foot">Esperando resolución</small>
        </div>
      </VCol>

      <VCol
        cols="6"
        sm="3"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': filtros.estado === 'Aprobada' }"
          @click="alternarFiltroEstado('Aprobada')"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">Aprobadas</span>
            <div class="tt-stat-icon">
              <VIcon
                icon="tabler-circle-check"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.aprobadas }}</strong>
          <small class="tt-stat-foot">Autorizadas para vacante</small>
        </div>
      </VCol>

      <VCol
        cols="6"
        sm="3"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': filtros.estado === 'Rechazada' }"
          @click="alternarFiltroEstado('Rechazada')"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">Rechazadas</span>
            <div class="tt-stat-icon tt-stat-icon--danger">
              <VIcon
                icon="tabler-circle-x"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.rechazadas }}</strong>
          <small class="tt-stat-foot">No autorizadas</small>
        </div>
      </VCol>

      <VCol
        cols="6"
        sm="3"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': filtros.estado === null }"
          @click="alternarFiltroEstado(null)"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">Total registradas</span>
            <div class="tt-stat-icon tt-stat-icon--info">
              <VIcon
                icon="tabler-file-check"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.total }}</strong>
          <small class="tt-stat-foot">Historial institucional</small>
        </div>
      </VCol>
    </VRow>

    <!-- Barra de filtros -->
    <section class="tt-panel pa-4 mb-5">
      <VAlert
        v-if="errorCatalogos"
        type="error"
        variant="tonal"
        class="mb-3"
      >
        <div class="d-flex flex-wrap align-center justify-space-between gap-2">
          <span>{{ errorCatalogos }}</span>
          <VBtn
            size="small"
            variant="outlined"
            color="error"
            prepend-icon="tabler-refresh"
            :loading="cargandoCatalogos"
            @click="cargarCatalogos"
          >
            Reintentar catálogos
          </VBtn>
        </div>
      </VAlert>

      <VRow
        align="center"
        dense
      >
        <VCol
          cols="12"
          sm="6"
          md="2"
        >
          <AppSelect
            v-model="filtros.estado"
            :items="estados"
            label="Estado"
            placeholder="Todos"
            clearable
            @update:model-value="aplicarFiltros"
          />
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="2"
        >
          <AppSelect
            v-model="filtros.motivo"
            :items="motivos"
            label="Motivo"
            placeholder="Todos"
            clearable
            @update:model-value="aplicarFiltros"
          />
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <AppAutocomplete
            v-model="filtros.puesto_id"
            :items="puestos"
            item-title="nombre"
            item-value="id"
            label="Puesto"
            placeholder="Todos los puestos"
            :loading="cargandoCatalogos"
            clearable
            @update:model-value="aplicarFiltros"
          />
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <AppAutocomplete
            v-model="filtros.unidad_id"
            :items="unidades"
            item-title="nombre"
            item-value="id"
            label="Unidad / Agencia"
            placeholder="Todas las unidades"
            :loading="cargandoCatalogos"
            clearable
            @update:model-value="aplicarFiltros"
          />
        </VCol>

        <VCol
          cols="12"
          md="2"
          class="d-flex justify-end align-center gap-2 pt-md-6"
        >
          <VBtn
            icon="tabler-refresh"
            color="secondary"
            variant="tonal"
            title="Recargar listado"
            :loading="cargando"
            @click="recargarTodo"
          />
          <VBtn
            icon="tabler-filter-off"
            color="secondary"
            variant="tonal"
            title="Limpiar filtros"
            :disabled="!hayFiltrosActivos && filtros.sort === '-id'"
            @click="limpiarFiltros"
          />
          <VBtnToggle
            v-model="vistaModo"
            mandatory
            density="compact"
            color="primary"
            variant="outlined"
          >
            <VBtn
              value="bandeja"
              icon="tabler-list-details"
              size="small"
              title="Vista de bandeja"
            />
            <VBtn
              value="tabla"
              icon="tabler-table"
              size="small"
              title="Vista de tabla"
            />
          </VBtnToggle>
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="3"
          class="mt-1"
        >
          <AppSelect
            v-model="filtros.sort"
            :items="opcionesOrden"
            label="Ordenar por"
            density="compact"
            @update:model-value="aplicarFiltros"
          />
        </VCol>
      </VRow>
    </section>

    <!-- Estado de carga -->
    <VProgressLinear
      v-if="cargando"
      indeterminate
      color="primary"
      rounded
      class="mb-4"
    />

    <!-- Estado de error explícito (sin fallback silencioso) -->
    <section
      v-if="errorLista && !cargando"
      class="tt-panel pa-8 text-center mb-5"
    >
      <VIcon
        icon="tabler-alert-triangle"
        size="46"
        color="error"
        class="mb-2"
      />
      <h3 class="text-h6 font-weight-bold mb-1">
        Error al cargar solicitudes de vacante
      </h3>
      <p class="text-body-2 text-medium-emphasis mb-4">
        {{ errorLista }}
      </p>
      <VBtn
        color="primary"
        prepend-icon="tabler-refresh"
        @click="recargarTodo"
      >
        Reintentar
      </VBtn>
    </section>

    <!-- Listado principal -->
    <template v-else-if="!cargando || solicitudes.length">
      <!-- Estado vacío -->
      <section
        v-if="!cargando && !solicitudes.length"
        class="tt-panel text-center pa-10"
      >
        <VIcon
          icon="tabler-file-off"
          size="46"
          class="text-disabled mb-2"
        />
        <h3 class="text-h6 text-medium-emphasis mb-1">
          {{ hayFiltrosActivos ? 'No se encontraron solicitudes con los filtros aplicados' : 'Aún no hay solicitudes de vacante registradas' }}
        </h3>
        <p class="text-body-2 text-disabled mb-4">
          {{ hayFiltrosActivos ? 'Pruebe ajustando o limpiando los criterios de búsqueda.' : 'Cree una nueva solicitud para iniciar el flujo de aprobación de plazas.' }}
        </p>
        <div class="d-flex justify-center flex-wrap gap-2">
          <VBtn
            v-if="hayFiltrosActivos"
            variant="tonal"
            color="secondary"
            prepend-icon="tabler-filter-off"
            @click="limpiarFiltros"
          >
            Restablecer filtros
          </VBtn>
          <VBtn
            v-if="can('crear solicitudes vacante', 'SolicitudVacante')"
            color="primary"
            prepend-icon="tabler-plus"
            to="/admin/solicitudes-vacante/create"
          >
            Nueva solicitud
          </VBtn>
        </div>
      </section>

      <!-- MODO 1: Bandeja ejecutiva inspirada en maqueta-reclutamiento -->
      <section
        v-else-if="vistaModo === 'bandeja'"
        class="tt-panel pa-5"
      >
        <div class="d-flex flex-wrap justify-space-between align-center gap-2 mb-4">
          <div>
            <h2 class="text-h6 font-weight-bold mb-0">
              Bandeja de requerimientos y aprobaciones
            </h2>
            <p class="text-caption text-medium-emphasis mb-0">
              Flujo de control de plazas: Solicitud → Aprobación gerencial → Vacante oficial
            </p>
          </div>
          <VChip
            size="small"
            variant="tonal"
            color="secondary"
          >
            {{ paginacion.total }} {{ paginacion.total === 1 ? 'registro' : 'registros' }}
          </VChip>
        </div>

        <div class="d-flex flex-column gap-3">
          <article
            v-for="item in solicitudes"
            :key="item.id"
            class="tt-request-row"
            :class="`tt-request-row--${item.estado.toLowerCase()}`"
          >
            <div class="tt-request-main">
              <div class="d-flex flex-wrap align-center gap-2 mb-1">
                <span class="text-caption font-weight-bold text-medium-emphasis">#{{ item.id }}</span>
                <strong class="text-subtitle-1 font-weight-bold">
                  {{ item.puesto?.nombre || `Puesto #${item.puesto_id}` }}
                </strong>
                <VChip
                  size="x-small"
                  variant="tonal"
                  color="secondary"
                  class="font-weight-bold"
                >
                  {{ item.numero_plazas }} {{ Number(item.numero_plazas) === 1 ? 'plaza' : 'plazas' }}
                </VChip>
                <VChip
                  size="x-small"
                  variant="outlined"
                  color="secondary"
                >
                  {{ item.motivo }}
                </VChip>
                <VChip
                  size="x-small"
                  :color="coloresEstado[item.estado] || 'secondary'"
                  :prepend-icon="iconosEstado[item.estado]"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ item.estado }}
                </VChip>
                <VChip
                  v-if="item.vacante"
                  size="x-small"
                  color="success"
                  variant="flat"
                  prepend-icon="tabler-briefcase"
                >
                  Vacante #{{ item.vacante.id }}
                </VChip>
              </div>

              <div class="d-flex flex-wrap align-center gap-x-4 gap-y-1 text-caption text-medium-emphasis mb-2">
                <span class="d-inline-flex align-center gap-1">
                  <VIcon
                    icon="tabler-building-bank"
                    size="14"
                  />
                  {{ item.unidad?.nombre || `Unidad #${item.unidad_id}` }}
                </span>
                <span class="d-inline-flex align-center gap-1">
                  <VIcon
                    icon="tabler-user"
                    size="14"
                  />
                  Solicitante: {{ nombreCompletoPersona(item.solicitante) }}
                </span>
                <span class="d-inline-flex align-center gap-1">
                  <VIcon
                    icon="tabler-calendar"
                    size="14"
                  />
                  {{ formatearFechaCorta(item.created_at) }}
                </span>
              </div>

              <p class="text-body-2 mb-1 tt-clamp-2">
                <strong>Justificación:</strong> {{ item.justificacion }}
              </p>

              <p
                v-if="item.estado !== 'Pendiente' && item.observaciones"
                class="text-caption text-medium-emphasis mb-0"
              >
                <strong>Resolución ({{ nombreCompletoPersona(item.aprobador) }}):</strong> "{{ item.observaciones }}"
              </p>
            </div>

            <div class="tt-request-actions">
              <VBtn
                size="small"
                variant="tonal"
                color="secondary"
                prepend-icon="tabler-eye"
                @click="abrirDetalle(item, 'detalle')"
              >
                Detalle
              </VBtn>

              <VBtn
                v-if="puedeResolverSolicitud(item)"
                size="small"
                color="primary"
                prepend-icon="tabler-shield-check"
                @click="abrirDetalle(item, 'resolver')"
              >
                Aprobar / Rechazar
              </VBtn>

              <VBtn
                v-if="item.estado === 'Aprobada' && !item.vacante && can('crear vacantes', 'Vacante')"
                size="small"
                color="success"
                variant="tonal"
                prepend-icon="tabler-briefcase-2"
                @click="abrirCrearVacante(item)"
              >
                Crear vacante
              </VBtn>

              <VBtn
                v-if="item.vacante && can('ver vacantes', 'Vacante')"
                size="small"
                color="success"
                variant="outlined"
                prepend-icon="tabler-external-link"
                :to="`/admin/vacantes/show/${item.vacante.id}`"
              >
                Vacante #{{ item.vacante.id }}
              </VBtn>
            </div>
          </article>
        </div>
      </section>

      <!-- MODO 2: Tabla compacta -->
      <section
        v-else
        class="tt-panel overflow-hidden"
      >
        <VTable class="text-no-wrap">
          <thead>
            <tr>
              <th>ID</th>
              <th>Puesto / Unidad</th>
              <th>Plazas</th>
              <th>Motivo</th>
              <th>Solicitante</th>
              <th>Estado</th>
              <th>Vacante</th>
              <th class="text-end">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="item in solicitudes"
              :key="item.id"
            >
              <td class="font-weight-bold">
                #{{ item.id }}
              </td>
              <td>
                <div class="font-weight-bold text-body-2">
                  {{ item.puesto?.nombre || `Puesto #${item.puesto_id}` }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ item.unidad?.nombre || `Unidad #${item.unidad_id}` }}
                </div>
              </td>
              <td>{{ item.numero_plazas }}</td>
              <td>{{ item.motivo }}</td>
              <td>
                <div class="text-body-2">
                  {{ nombreCompletoPersona(item.solicitante) }}
                </div>
                <div class="text-caption text-medium-emphasis">
                  {{ formatearFechaCorta(item.created_at) }}
                </div>
              </td>
              <td>
                <VChip
                  size="small"
                  :color="coloresEstado[item.estado] || 'secondary'"
                  variant="tonal"
                  class="font-weight-bold"
                >
                  {{ item.estado }}
                </VChip>
              </td>
              <td>
                <NuxtLink
                  v-if="item.vacante && can('ver vacantes', 'Vacante')"
                  :to="`/admin/vacantes/show/${item.vacante.id}`"
                  class="tt-tag-days mt-0 text-decoration-none"
                >
                  <VIcon
                    icon="tabler-briefcase"
                    size="13"
                  />
                  Vacante #{{ item.vacante.id }}
                </NuxtLink>
                <span
                  v-else-if="item.vacante"
                  class="text-caption"
                >
                  Vacante #{{ item.vacante.id }}
                </span>
                <span
                  v-else
                  class="text-caption text-disabled"
                >
                  Sin crear
                </span>
              </td>
              <td class="text-end">
                <div class="d-inline-flex align-center gap-1">
                  <VBtn
                    icon="tabler-eye"
                    variant="text"
                    size="small"
                    color="secondary"
                    title="Ver detalle"
                    @click="abrirDetalle(item, 'detalle')"
                  />
                  <VBtn
                    v-if="puedeResolverSolicitud(item)"
                    icon="tabler-shield-check"
                    variant="text"
                    size="small"
                    color="primary"
                    title="Aprobar / Rechazar"
                    @click="abrirDetalle(item, 'resolver')"
                  />
                  <VBtn
                    v-if="item.estado === 'Aprobada' && !item.vacante && can('crear vacantes', 'Vacante')"
                    icon="tabler-briefcase-2"
                    variant="text"
                    size="small"
                    color="success"
                    title="Crear vacante"
                    @click="abrirCrearVacante(item)"
                  />
                  <VBtn
                    icon="tabler-arrow-up-right"
                    variant="text"
                    size="small"
                    color="secondary"
                    title="Abrir ficha completa"
                    :to="`/admin/solicitudes-vacante/show/${item.id}`"
                  />
                </div>
              </td>
            </tr>
          </tbody>
        </VTable>
      </section>

      <!-- Paginación completa del servidor -->
      <div
        v-if="solicitudes.length"
        class="tt-panel pa-4 mt-4 d-flex flex-wrap align-center justify-space-between gap-3"
      >
        <div class="d-flex flex-wrap align-center gap-3">
          <span class="text-body-2 text-medium-emphasis">
            Mostrando <strong>{{ paginacion.from }}</strong>–<strong>{{ paginacion.to }}</strong> de <strong>{{ paginacion.total }}</strong> solicitudes
          </span>
          <div style="inline-size: 155px;">
            <AppSelect
              v-model="paginacion.perPage"
              :items="opcionesPorPagina"
              density="compact"
              hide-details
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

    <!-- Diálogo de detalle y resolución gerencial -->
    <DetalleResolucionDialog
      v-model="dialogDetalle"
      :solicitud="solicitudSeleccionada"
      :modo-inicial="modoDialogDetalle"
      @resuelta="onSolicitudResuelta"
      @abrir-crear-vacante="abrirCrearVacante"
    />

    <!-- Diálogo de creación de vacante desde solicitud aprobada -->
    <CrearVacanteDesdeSolicitudDialog
      v-model="dialogCrearVacante"
      :solicitud="solicitudSeleccionada"
      @creada="onVacanteCreada"
    />
  </div>
</template>

<style scoped>
@import "@styles/reclutamiento-talent.scss";

.tt-stat-icon--danger {
  background: #fff0ed;
  color: #ad4b3b;
}

.v-theme--dark .tt-stat-icon--danger {
  background: rgba(220, 38, 38, 0.22);
  color: #fca5a5;
}

.tt-request-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 15px 16px;
  border: 1px solid rgba(23, 42, 39, 0.09);
  border-left: 4px solid #117b63;
  border-radius: 12px;
  background: rgb(var(--v-theme-surface));
  transition: border-color 0.15s ease, box-shadow 0.15s ease;
}

.tt-request-row:hover {
  box-shadow: 0 6px 18px rgba(27, 65, 52, 0.06);
}

.tt-request-row--pendiente {
  border-left-color: #d08328;
}

.tt-request-row--aprobada {
  border-left-color: #117b63;
}

.tt-request-row--rechazada {
  border-left-color: #c53030;
}

.v-theme--dark .tt-request-row {
  border-color: rgba(255, 255, 255, 0.09);
}

.tt-request-main {
  flex: 1 1 auto;
  min-width: 0;
}

.tt-request-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: 8px;
  flex-shrink: 0;
}

.tt-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

@media (max-width: 900px) {
  .tt-request-row {
    flex-direction: column;
    align-items: stretch;
  }

  .tt-request-actions {
    justify-content: flex-start;
  }
}
</style>
