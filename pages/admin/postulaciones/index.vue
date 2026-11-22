<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type { ColumnaInterface } from '@/types/sistema/DataTableTypes'
import type DataTableComponent from '@/components/DataTableComponent.vue'
import type { EtapaReclutamiento, Postulacion, Vacante } from '@/types/reclutamiento'
import { MODEL_TYPE_POSTULACION } from '@/constantes/ModelTypes'
import DetalleSeguimientoDialog from '@/views/pages/reclutamiento/postulaciones/DetalleSeguimientoDialog.vue'
import {
  UMBRAL_DIAS_ATENCION,
  colorPuntoEtapa,
  diasSinActualizar,
  esEtapaEntrevista,
  etiquetaDiasSinActualizar,
  inicialesPersona,
  necesitaAtencionPostulacion,
  nombreCompletoPersona,
  obtenerEtapaNombre,
  obtenerEtapaPostulacion,
} from '@/utils/reclutamientoUx'

definePageMeta({
  navActiveLink: 'admin-postulaciones',
  middleware: 'permissions',
  action: 'ver postulaciones',
  subject: 'Postulacion',
})

const route = useRoute()
const { get, deleted } = useClienteRequest()
const { showToastSuccess, preguntaEliminar } = useToast()

const dataTable = ref<InstanceType<typeof DataTableComponent> | null>(null)
const vistaModo = ref<'tablero' | 'tabla'>('tablero')
const busquedaTexto = ref('')
const soloAtencion = ref(route.query.atencion === '1')

const filtros = ref({
  estado: null as string | null,
  etapa_reclutamiento_id: null as number | null,
  vacante_id: route.query.vacante_id ? Number(route.query.vacante_id) : (null as number | null),
})

const seleccionada = ref<Postulacion | null>(null)
const detalle = ref(false)

const estados = ['En proceso', 'Contratada', 'Descartada', 'Retirada'].map(value => ({ title: value, value }))
const etapas = ref<EtapaReclutamiento[]>([])
const vacantes = ref<Vacante[]>([])
const todasLasPostulaciones = ref<Postulacion[]>([])
const cargandoTablero = ref(false)

function desempaquetar<T>(respuesta: any): T[] {
  return Array.isArray(respuesta?.data) ? respuesta.data : (respuesta?.data?.data || [])
}

const cargarDatos = async () => {
  cargandoTablero.value = true
  try {
    const [etapasResp, vacantesResp, postResp] = await Promise.all([
      get<any>('/api/catalogo/etapas-reclutamiento?limit=100'),
      get<any>('/api/vacantes?include=puesto,unidad&page[size]=100'),
      get<any>('/api/postulaciones?include=candidato,vacante.puesto,vacante.unidad,etapaReclutamiento,responsable&sort=-id&page[size]=100'),
    ])

    etapas.value = desempaquetar<EtapaReclutamiento>(etapasResp).filter(etapa => etapa.estado !== 'Inactivo')
    vacantes.value = desempaquetar<Vacante>(vacantesResp)
    todasLasPostulaciones.value = desempaquetar<Postulacion>(postResp)

    if (seleccionada.value) {
      const actualizada = todasLasPostulaciones.value.find(p => p.id === seleccionada.value?.id)
      if (actualizada)
        seleccionada.value = actualizada
    }
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargandoTablero.value = false
  }
}

const metricas = computed(() => {
  const lista = todasLasPostulaciones.value
  const enProceso = lista.filter(p => p.estado === 'En proceso').length
  const enEntrevista = lista.filter(p => p.estado === 'En proceso' && esEtapaEntrevista(obtenerEtapaNombre(p))).length
  const atencion = lista.filter(p => necesitaAtencionPostulacion(p)).length
  const contratadas = lista.filter(p => p.estado === 'Contratada').length

  return { total: lista.length, enProceso, enEntrevista, atencion, contratadas }
})

const postulacionesFiltradas = computed(() => {
  const q = busquedaTexto.value.trim().toLowerCase()

  return todasLasPostulaciones.value.filter(p => {
    if (filtros.value.estado && p.estado !== filtros.value.estado)
      return false
    if (filtros.value.vacante_id && Number(p.vacante_id) !== Number(filtros.value.vacante_id))
      return false
    if (filtros.value.etapa_reclutamiento_id) {
      const idEtapa = p.etapa_reclutamiento_id ?? obtenerEtapaPostulacion(p)?.id
      if (Number(idEtapa) !== Number(filtros.value.etapa_reclutamiento_id))
        return false
    }
    if (soloAtencion.value && !necesitaAtencionPostulacion(p))
      return false
    if (q) {
      const candidato = nombreCompletoPersona(p.candidato).toLowerCase()
      const correo = (p.candidato?.correo || '').toLowerCase()
      const puesto = (p.vacante?.puesto?.nombre || '').toLowerCase()
      const unidad = (p.vacante?.unidad?.nombre || '').toLowerCase()
      if (!candidato.includes(q) && !correo.includes(q) && !puesto.includes(q) && !unidad.includes(q))
        return false
    }

    return true
  })
})

const etapasOrdenadasTablero = computed(() => {
  const ordenadas = [...etapas.value].sort((a, b) => (a.orden ?? a.id) - (b.orden ?? b.id))

  return ordenadas.filter(etapa => {
    const nombre = etapa.nombre.toLowerCase()
    const esDescarte = nombre.includes('descart')
    if (!esDescarte)
      return true

    return filtros.value.estado === 'Descartada' || filtros.value.etapa_reclutamiento_id === etapa.id
  })
})

const itemsPorEtapa = (etapaId: number) => {
  return postulacionesFiltradas.value.filter(p => {
    const idActual = p.etapa_reclutamiento_id ?? obtenerEtapaPostulacion(p)?.id
    if (Number(idActual) !== Number(etapaId))
      return false
    if (!filtros.value.estado && p.estado === 'Descartada')
      return false

    return true
  })
}

const columnas = computed<ColumnaInterface[]>(() => [
  { title: 'ID', key: 'id' },
  { title: 'Candidato', key: 'candidato', sortable: false },
  { title: 'Vacante', key: 'vacante', sortable: false, OpcionesFiltro: { campo: 'vacante_id', operador: '=', valor: filtros.value.vacante_id } },
  { title: 'Etapa actual', key: 'etapa_reclutamiento', sortable: false, OpcionesFiltro: { campo: 'etapa_reclutamiento_id', operador: '=', valor: filtros.value.etapa_reclutamiento_id } },
  { title: 'Seguimiento', key: 'seguimiento', sortable: false },
  { title: 'Responsable', key: 'responsable', sortable: false },
  { title: 'Estado', key: 'estado', OpcionesFiltro: { operador: '=', valor: filtros.value.estado } },
  { title: 'Acciones', key: 'acciones', sortable: false },
])

const abrirDetalle = (item: Postulacion) => {
  seleccionada.value = item
  detalle.value = true
}

const alActualizarMovimiento = async (postulacionActualizada?: Postulacion) => {
  if (postulacionActualizada?.id) {
    if (seleccionada.value?.id === postulacionActualizada.id)
      seleccionada.value = { ...seleccionada.value, ...postulacionActualizada }

    const indice = todasLasPostulaciones.value.findIndex(p => p.id === postulacionActualizada.id)
    if (indice !== -1)
      todasLasPostulaciones.value.splice(indice, 1, { ...todasLasPostulaciones.value[indice], ...postulacionActualizada })
  }

  await cargarDatos()
  if (vistaModo.value === 'tabla')
    await dataTable.value?.filtrar()
}

const eliminar = async (id: number) => {
  if (!await preguntaEliminar('¿Desea eliminar esta postulación?'))
    return

  try {
    const respuesta = await deleted<{ message: string }>(`/api/postulaciones/${id}`)
    showToastSuccess(respuesta.message)
    await cargarDatos()
    if (vistaModo.value === 'tabla')
      await dataTable.value?.filtrar()
  }
  catch (error) {
    manejaError(error)
  }
}

const filtrar = () => {
  if (vistaModo.value === 'tabla')
    dataTable.value?.filtrar()
}

const limpiar = () => {
  filtros.value = { estado: null, etapa_reclutamiento_id: null, vacante_id: null }
  busquedaTexto.value = ''
  soloAtencion.value = false
  filtrar()
}

const coloresEstado: Record<string, string> = {
  'En proceso': 'success',
  'Contratada': 'info',
  'Descartada': 'error',
  'Retirada': 'secondary',
}

onMounted(cargarDatos)
</script>

<template>
  <div class="postulaciones-modulo">
    <!-- Cabecera ejecutiva estilo maqueta-talento-humano.html -->
    <header class="tt-page-header">
      <div>
        <span class="tt-eyebrow">PROCESOS DE SELECCIÓN</span>
        <h1 class="tt-page-title">
          Postulaciones y Seguimiento
        </h1>
        <p class="tt-page-subtitle">
          Acompaña el avance de cada candidato por etapa, detecta tiempos de espera y registra decisiones trazables.
        </p>
      </div>

      <div class="d-flex flex-wrap gap-2">
        <VBtn
          v-if="can('ver candidatos', 'Candidato')"
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-users"
          to="/admin/candidatos"
        >
          Banco de candidatos
        </VBtn>
        <VBtn
          v-if="can('crear postulaciones', 'Postulacion')"
          color="primary"
          prepend-icon="tabler-plus"
          :to="filtros.vacante_id ? `/admin/postulaciones/create?vacante_id=${filtros.vacante_id}` : '/admin/postulaciones/create'"
        >
          Nueva postulación
        </VBtn>
      </div>
    </header>

    <!-- KPIs interactivos -->
    <VRow class="mb-5">
      <VCol
        cols="6"
        md="3"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': filtros.estado === 'En proceso' && !soloAtencion }"
          @click="soloAtencion = false; filtros.estado = filtros.estado === 'En proceso' ? null : 'En proceso'; filtrar()"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">En proceso</span>
            <div class="tt-stat-icon">
              <VIcon
                icon="tabler-git-branch"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.enProceso }}</strong>
          <small class="tt-stat-foot">Candidatos activos</small>
        </div>
      </VCol>

      <VCol
        cols="6"
        md="3"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          @click="vistaModo = 'tablero'; soloAtencion = false; filtros.estado = 'En proceso'"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">En entrevista</span>
            <div class="tt-stat-icon tt-stat-icon--info">
              <VIcon
                icon="tabler-messages"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.enEntrevista }}</strong>
          <small class="tt-stat-foot">RRHH o entrevista técnica</small>
        </div>
      </VCol>

      <VCol
        cols="6"
        md="3"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': soloAtencion }"
          @click="vistaModo = 'tablero'; soloAtencion = !soloAtencion"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">Necesitan atención</span>
            <div class="tt-stat-icon tt-stat-icon--warn">
              <VIcon
                icon="tabler-clock-exclamation"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.atencion }}</strong>
          <small
            class="tt-stat-foot"
            :class="{ 'tt-stat-foot--warn': metricas.atencion > 0 }"
          >
            {{ UMBRAL_DIAS_ATENCION }}+ días sin actualización
          </small>
        </div>
      </VCol>

      <VCol
        cols="6"
        md="3"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': filtros.estado === 'Contratada' }"
          @click="soloAtencion = false; filtros.estado = filtros.estado === 'Contratada' ? null : 'Contratada'; filtrar()"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">Contratadas</span>
            <div class="tt-stat-icon">
              <VIcon
                icon="tabler-circle-check"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.contratadas }}</strong>
          <small class="tt-stat-foot">Procesos cerrados con éxito</small>
        </div>
      </VCol>
    </VRow>

    <!-- Barra de filtros y conmutador Tablero / Tabla -->
    <section class="tt-panel pa-4 mb-5">
      <VRow align="center">
        <VCol
          cols="12"
          md="3"
        >
          <AppTextField
            v-model="busquedaTexto"
            label="Buscar candidato o puesto"
            placeholder="Nombre, correo, puesto..."
            prepend-inner-icon="tabler-search"
            clearable
          />
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <AppAutocomplete
            v-model="filtros.vacante_id"
            label="Vacante"
            placeholder="Todas las vacantes"
            :items="vacantes"
            :item-title="(v: Vacante) => `#${v.id} · ${v.puesto?.nombre || 'Vacante'}`"
            item-value="id"
            clearable
            @update:model-value="filtrar"
          >
            <template #item="{ props: itemProps, item }">
              <VListItem
                v-bind="itemProps"
                :title="`#${item.raw.id} · ${item.raw.puesto?.nombre || 'Vacante'}`"
                :subtitle="item.raw.unidad?.nombre"
              />
            </template>
          </AppAutocomplete>
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="2"
        >
          <AppAutocomplete
            v-model="filtros.etapa_reclutamiento_id"
            label="Etapa"
            placeholder="Todas"
            :items="etapas"
            item-title="nombre"
            item-value="id"
            clearable
            @update:model-value="filtrar"
          />
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="2"
        >
          <AppSelect
            v-model="filtros.estado"
            label="Estado"
            placeholder="Todos"
            :items="estados"
            clearable
            @update:model-value="filtrar"
          />
        </VCol>

        <VCol
          cols="12"
          sm="6"
          md="2"
          class="d-flex align-center justify-end gap-2 pt-md-6"
        >
          <VBtn
            icon="tabler-filter-off"
            variant="tonal"
            color="secondary"
            title="Limpiar filtros"
            @click="limpiar"
          />
          <VBtnToggle
            v-model="vistaModo"
            mandatory
            density="compact"
            color="primary"
            variant="outlined"
          >
            <VBtn
              value="tablero"
              size="small"
              prepend-icon="tabler-layout-kanban"
            >
              Tablero
            </VBtn>
            <VBtn
              value="tabla"
              size="small"
              prepend-icon="tabler-table"
            >
              Tabla
            </VBtn>
          </VBtnToggle>
        </VCol>
      </VRow>

      <div
        v-if="soloAtencion"
        class="mt-3 d-flex align-center gap-2"
      >
        <VChip
          color="warning"
          size="small"
          closable
          @click:close="soloAtencion = false"
        >
          Mostrando únicamente procesos con {{ UMBRAL_DIAS_ATENCION }} días o más sin actualización
        </VChip>
      </div>
    </section>

    <!-- VISTA 1: TABLERO KANBAN POR ETAPAS -->
    <section
      v-if="vistaModo === 'tablero'"
      class="tt-panel pa-5"
    >
      <div class="d-flex flex-wrap justify-space-between align-center gap-2 mb-4">
        <div>
          <h2 class="text-h6 font-weight-bold mb-0">
            Tablero por etapa de selección
          </h2>
          <p class="text-caption text-medium-emphasis mb-0">
            Haz clic en cualquier candidato para revisar su seguimiento, avanzar etapa o consultar su historial.
          </p>
        </div>
        <span class="text-caption text-medium-emphasis">
          {{ postulacionesFiltradas.length }} {{ postulacionesFiltradas.length === 1 ? 'postulación visible' : 'postulaciones visibles' }}
        </span>
      </div>

      <VProgressLinear
        v-if="cargandoTablero"
        indeterminate
        color="success"
        rounded
        class="mb-4"
      />

      <div
        v-else-if="etapasOrdenadasTablero.length"
        class="tt-board-scroll tt-board-scroll--dynamic"
      >
        <div
          v-for="etapa in etapasOrdenadasTablero"
          :key="etapa.id"
          class="tt-stage-col"
        >
          <div class="tt-stage-head">
            <div class="tt-stage-title">
              <i
                class="tt-dot"
                :style="{ backgroundColor: colorPuntoEtapa(etapa.nombre) }"
              />
              <span>{{ etapa.nombre }}</span>
            </div>
            <span class="tt-count-pill">{{ itemsPorEtapa(etapa.id).length }}</span>
          </div>

          <template v-if="itemsPorEtapa(etapa.id).length">
            <button
              v-for="item in itemsPorEtapa(etapa.id)"
              :key="item.id"
              type="button"
              class="tt-candidate-card"
              :class="{ 'tt-candidate-card--warn': necesitaAtencionPostulacion(item) }"
              @click="abrirDetalle(item)"
            >
              <div class="d-flex align-center justify-space-between gap-2 mb-1">
                <div class="d-flex align-center gap-2 min-w-0">
                  <div class="tt-avatar">
                    {{ inicialesPersona(item.candidato?.nombres, item.candidato?.apellidos) }}
                  </div>
                  <div class="min-w-0">
                    <div class="text-body-2 font-weight-bold text-truncate">
                      {{ nombreCompletoPersona(item.candidato) }}
                    </div>
                    <div class="text-caption text-medium-emphasis text-truncate">
                      {{ item.vacante?.puesto?.nombre || `Vacante #${item.vacante_id}` }}
                    </div>
                  </div>
                </div>
              </div>

              <div
                v-if="item.vacante?.unidad?.nombre"
                class="text-caption text-disabled text-truncate mt-1"
              >
                <VIcon
                  icon="tabler-building-community"
                  size="13"
                  class="mr-1"
                />
                {{ item.vacante.unidad.nombre }}
              </div>

              <div class="d-flex align-center justify-space-between gap-1 mt-1">
                <span
                  class="tt-tag-days"
                  :class="{ 'tt-tag-days--warn': necesitaAtencionPostulacion(item) }"
                >
                  {{ etiquetaDiasSinActualizar(diasSinActualizar(item)) }}
                </span>

                <VChip
                  v-if="item.estado !== 'En proceso'"
                  size="x-small"
                  :color="coloresEstado[item.estado] || 'secondary'"
                  variant="tonal"
                >
                  {{ item.estado }}
                </VChip>
              </div>
            </button>
          </template>

          <div
            v-else
            class="tt-empty-col"
          >
            Sin postulaciones
          </div>
        </div>
      </div>
    </section>

    <!-- VISTA 2: TABLA PAGINADA -->
    <div
      v-else
      class="tt-panel overflow-hidden"
    >
      <DataTableComponent
        ref="dataTable"
        :model="MODEL_TYPE_POSTULACION"
        :columnas="columnas"
        :relaciones="['candidato', 'vacante.puesto', 'vacante.unidad', 'etapaReclutamiento', 'responsable']"
        :botones="['reiniciar']"
        endpoint="/api/postulaciones"
        placeholder="No se encontraron postulaciones"
      >
        <template #item.candidato="{ item }">
          <div class="d-flex align-center gap-2 py-1">
            <div class="tt-avatar">
              {{ inicialesPersona(item.candidato?.nombres, item.candidato?.apellidos) }}
            </div>
            <div>
              <div class="font-weight-bold text-body-2">
                {{ nombreCompletoPersona(item.candidato) }}
              </div>
              <div class="text-caption text-disabled">
                {{ item.candidato?.correo || '—' }}
              </div>
            </div>
          </div>
        </template>

        <template #item.vacante="{ item }">
          <div>
            <div class="font-weight-medium text-body-2">
              {{ item.vacante?.puesto?.nombre || `Vacante #${item.vacante_id}` }}
            </div>
            <div class="text-caption text-disabled">
              #{{ item.vacante_id }} · {{ item.vacante?.unidad?.nombre || 'Sin unidad' }}
            </div>
          </div>
        </template>

        <template #item.etapa_reclutamiento="{ item }">
          <div class="d-inline-flex align-center gap-2">
            <i
              class="tt-dot"
              :style="{ backgroundColor: colorPuntoEtapa(obtenerEtapaNombre(item)) }"
            />
            <span class="text-body-2 font-weight-medium">{{ obtenerEtapaNombre(item) }}</span>
          </div>
        </template>

        <template #item.seguimiento="{ item }">
          <span
            class="tt-tag-days mt-0"
            :class="{ 'tt-tag-days--warn': necesitaAtencionPostulacion(item) }"
          >
            {{ etiquetaDiasSinActualizar(diasSinActualizar(item)) }}
          </span>
        </template>

        <template #item.responsable="{ item }">
          <span class="text-body-2">{{ nombreCompletoPersona(item.responsable) }}</span>
        </template>

        <template #item.estado="{ item }">
          <VChip
            size="small"
            :color="coloresEstado[item.estado] || 'secondary'"
            variant="tonal"
            class="font-weight-bold"
          >
            {{ item.estado }}
          </VChip>
        </template>

        <template #item.acciones="{ item }">
          <VBtn
            v-if="can('ver postulaciones', 'Postulacion')"
            icon="tabler-eye"
            variant="text"
            size="small"
            color="primary"
            title="Seguimiento e historial"
            @click="abrirDetalle(item)"
          />
          <VBtn
            v-if="can('editar postulaciones', 'Postulacion')"
            icon="tabler-edit"
            variant="text"
            size="small"
            title="Editar"
            :to="`/admin/postulaciones/edit/${item.id}`"
          />
          <VBtn
            v-if="can('eliminar postulaciones', 'Postulacion')"
            icon="tabler-trash"
            color="error"
            variant="text"
            size="small"
            title="Eliminar"
            @click="eliminar(item.id)"
          />
        </template>
      </DataTableComponent>
    </div>

    <!-- Modal ejecutivo de seguimiento e historial -->
    <DetalleSeguimientoDialog
      v-model="detalle"
      :postulacion="seleccionada"
      :etapas="etapas"
      @actualizado="alActualizarMovimiento"
    />
  </div>
</template>

<style scoped>
@import '@/assets/styles/reclutamiento-talent.scss';
</style>
