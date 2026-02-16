<script setup lang="ts">
import type { SendSuccessInterface } from '@/types/sistema/types'
import type { ColumnaInterface } from '@/types/sistema/DataTableTypes'
import type DataTable from '@/components/form-elements/DataTableComponent.vue'
import {MODEL_QUEUE_MONITOR} from "@/constantes/ModelTypes";
import {can} from "@layouts/plugins/casl";

definePageMeta({
  middleware: 'permissions',
  action: 'listar jobs',
  subject: 'Job',
})

const { deleted, post, get } = useClienteRequest()
const { showToastSuccess, preguntaEliminar } = useToast()
const { paginaEspera } = useCargandoPagina()

const filtros = ref({
  status: null,
  name: null,
  fecha: null,
})
const resumen = ref({
  total_jobs: 0,
  total_tareas_unicas: 0,
  tiempo_total: '0s',
  tiempo_promedio: '0s',
  estados: [],
})

const cargarResumen = async () => {
  try {
    const params: any = {}

    if (filtros.value.status !== null)
      params['filter[status]'] = filtros.value.status

    if (filtros.value.name)
      params['filter[name]'] = filtros.value.name

    if (filtros.value.fecha)
      params['filter[porFechaFinalizacion]'] = filtros.value.fecha

    const res = await get<any>(
      'api/configuracion/monitor/jobs/estadisticas',
      { params }
    )

    resumen.value = {
      total_tareas_unicas: res.data.total_tareas_unicas,
      total_jobs: res.data.total_jobs,
      tiempo_total: res.data.tiempo_total,
      tiempo_promedio: res.data.tiempo_promedio,
      estados: res.data.estados ?? [],
    }
  } catch (error: any) {
    manejaError(error)
  }
}

const headers = computed<ColumnaInterface[]>(() => ([
  { title: 'Id', key: 'id', visible: false, exportable: false, sortable: true, },
  { title: 'Estado', key: 'status_texto', sortable: false },
  { title: 'Tarea', key: 'name', sortable: false },
  { title: 'Detalle', key: 'queue', sortable: false },
  { title: 'Progreso', key: 'progress', exportable: false, sortable: false },
  { title: 'Duración', key: 'duration', exportable: false, sortable: false },
  { title: 'Ejecución', key: 'ejecucion', exportable: false, sortable: false },
  { title: 'Intentos', key: 'total_jobs', exportable: false, sortable: false },
  { title: 'Error', key: 'exception_message', sortable: false },
  { title: 'Acciones', key: 'Acciones', exportable: false, sortable: false },
  {
    title: 'name_filter',
    key: 'name',
    visible: false,
    exportable: false,
    OpcionesFiltro: {
      campo: 'name',
      operador: '=',
      valor: filtros.value.name
    },
  },
  {
    title: 'status_filter',
    key: 'status',
    visible: false,
    exportable: false,
    OpcionesFiltro: {
      campo: 'status',
      operador: '=',
      valor: filtros.value.status,
    },
  },
  {
    title: 'finished_at_filter',
    key: 'finished_at',
    visible: false,
    exportable: false,
    OpcionesFiltro: {
      campo: 'porFechaFinalizacion',
      operador: 'scope',
      valor: filtros.value.fecha,
    },
  },
]))


const dataTable = ref<InstanceType<typeof DataTable> | null>(null)

const iconoEjecucion = (item: any) => {
  if (item.status === 2) return 'tabler-player-stop'
  if (item.status === 0) return 'tabler-player-play'
  if (item.status === 1) return 'tabler-check'
  return 'tabler-x'
}

const colorEjecucion = (item: any) =>
  item.status === 2 ? 'text-error' : 'text-info'


const estadoTexto = (status: number) => {
  switch (status) {
    case 0: return { texto: 'En ejecución', color: 'info', icono: 'tabler-loader' }
    case 1: return { texto: 'Exitoso', color: 'success', icono: 'tabler-check' }
    case 2: return { texto: 'Fallido', color: 'error', icono: 'tabler-x' }
    case 3: return { texto: 'Expirado', color: 'warning', icono: 'tabler-clock-off' }
    case 4: return { texto: 'En cola', color: 'secondary', icono: 'tabler-clock' }
    default: return { texto: 'Desconocido', color: 'secondary', icono: 'tabler-help' }
  }
}

const deleteItem = async (id: number) => {
  const confirm = await preguntaEliminar('¿Desea eliminar el job?')
  if (!confirm) return

  paginaEspera.value = true
  try {
    const res = await deleted<SendSuccessInterface>(`api/configuracion/monitor/job/eliminar/${id}`)
    showToastSuccess(res.message)
    dataTable.value?.getItems()
  } catch (error: any) {
    manejaError(error)
  } finally {
    paginaEspera.value = false
  }
}

const eliminarTodos = async () => {
  const confirm = await preguntaEliminar(
    '¿Desea eliminar TODOS los tareas del monitor?'
  )
  if (!confirm) return

  paginaEspera.value = true
  try {
    const res = await deleted<SendSuccessInterface>(
      'api/configuracion/monitor/jobs/eliminar/todos'
    )
    showToastSuccess(res.message)

    await dataTable.value?.getItems()
    await cargarResumen()
  } catch (error: any) {
    manejaError(error)
  } finally {
    paginaEspera.value = false
  }
}
const retryJob = async (id: number) => {
  paginaEspera.value = true
  try {
    const res = await post<SendSuccessInterface>(`api/configuracion/monitor/jobs/fallido/${id}/reintentar`)
    showToastSuccess(res.message)
    setTimeout(async () => {
      await dataTable.value?.getItems()
      paginaEspera.value = false
    }, 3500)
  } catch (error: any) {
    paginaEspera.value = false
    manejaError(error)
  }
}
const puedeReintentar = (item: any) =>
  item.status === 2 &&
  !item.retried

const filtrar = async (): Promise<void> => {
  await dataTable.value?.getItems()
  await cargarResumen()
}

function limpiarFiltros(): void {
  filtros.value = {
    status: null,
    name: null,
    fecha: null,
  }

  setTimeout(async () => {
    await dataTable.value?.getItems()
    await cargarResumen()
  }, 100)
}
const hayDatos = computed(() => {
  return (dataTable.value as any)?.items?.length > 0
})

const estadosJob = [
  { id: 0, nombre: 'En ejecución' },
  { id: 1, nombre: 'Exitoso' },
  { id: 2, nombre: 'Fallido' },
  { id: 3, nombre: 'Expirado' },
  { id: 4, nombre: 'En cola' },
]

const resumenEstados = computed(() => {
  const base = [
    { id: 1, nombre: 'Exitoso', color: 'success', icono: 'tabler-check' },
    { id: 2, nombre: 'Fallido', color: 'error', icono: 'tabler-x' },
    { id: 0, nombre: 'En ejecución', color: 'info', icono: 'tabler-loader' },
    { id: 4, nombre: 'En cola', color: 'secondary', icono: 'tabler-clock' },
    { id: 3, nombre: 'Expirado', color: 'warning', icono: 'tabler-clock-off' },
  ]

  const estados = resumen.value.estados ?? []
  const total = estados.reduce((a, e) => a + e.cantidad, 0)

  return base
    .map(b => {
      const found = estados.find(e => e.status === b.id)
      if (!found) return null
      return {
        ...b,
        cantidad: found.cantidad,
        porcentaje: total
          ? Number(((found.cantidad / total) * 100).toFixed(1))
          : 0,
      }
    })
    .filter(Boolean)
})

onMounted(async () => {
  await cargarResumen()
})

//ELIMINAR ANTES DE SALIR A PRODUCCION
const mostrarModalPrueba = ref(false)
const modoPrueba = ref<string | null>(null)
const cargandoPrueba = ref(false)

const modosPrueba = [
  { id: 'exitoso', nombre: 'Exitoso' },
  { id: 'fallido', nombre: 'Fallido' },
  { id: 'en_cola', nombre: 'En cola' },
  { id: 'expirado', nombre: 'Expirado' },
  { id: 'en_ejecucion', nombre: 'En ejecución' },
]

const ejecutarPrueba = async () => {
  if (!modoPrueba.value) return

  cargandoPrueba.value = true

  try {
    await post('api/configuracion/monitor/jobs/test', {
      modo: modoPrueba.value,
    })

    showToastSuccess('Job de prueba despachado')

    mostrarModalPrueba.value = false
    modoPrueba.value = null

    setTimeout(async () => {
      await dataTable.value?.getItems()
      await cargarResumen()
    }, 2000)

  } catch (error: any) {
    manejaError(error)
  } finally {
    cargandoPrueba.value = false
  }
}


</script>

<template>
  <div class="d-flex flex-wrap justify-end justify-sm-space-between mb-6 align-center">
    <h1>Listar Queue</h1>
    <div class="d-flex align-center">
      <VBtn
        color="primary"
        prepend-icon="tabler-flask"
        class="mr-2"
        @click="mostrarModalPrueba = true"
      >
        Probar Job
      </VBtn>
      <VBtn
        v-if="can('borrar todos jobs', 'Job') && hayDatos"
        color="error"
        prepend-icon="tabler-trash-x"
        :loading="paginaEspera"
        :disabled="paginaEspera"
        @click="eliminarTodos"
      >
        Eliminar todos
      </VBtn>
    </div>
  </div>
  <!--ESTADISTICAS DE JOBS-->
  <Colapsable
    :abierto="false"
    class="mb-5"
    titulo="Estadisticas"
  >
    <VRow class="mb-4">
      <VCol cols="12">
        <VCard class="pa-6 resumen-card">
          <!-- TÍTULO -->
          <div class="d-flex justify-space-between align-center mb-4">
            <div class="text-h6 font-weight-medium">
              Distribución de estados por total de ejecuciones
            </div>
          </div>

          <!-- BARRA PROGRESO -->
          <div class="estado-bar mb-5">
            <div
              v-for="estado in resumenEstados"
              :key="estado.id"
              class="estado-segment"
              v-tooltip="`${estado.nombre}: ${estado.cantidad} tareas (${estado.porcentaje}%)`"
              :style="{
              width: estado.porcentaje + '%',
              backgroundColor: `rgb(var(--v-theme-${estado.color}))`,
            }"
            >
            <span v-if="estado.porcentaje > 7">
              {{ estado.porcentaje }}%
            </span>
            </div>
          </div>

          <!-- LISTA -->
          <div class="d-flex flex-column gap-3">
            <div
              v-for="estado in resumenEstados"
              :key="estado.id"
              class="d-flex align-center gap-4"
            >
              <!-- TEXTO EN UNA SOLA LINEA -->
              <div class="d-flex align-center gap-2">
                <!-- ESTADO -->
                <VChip
                  size="small"
                  variant="tonal"
                  :color="estado.color"
                  class="d-flex align-center gap-1"
                >
                  <VIcon :icon="estado.icono" size="16" />
                  {{ estado.nombre }}
                </VChip>

                <!-- TAREAS -->
                <VChip
                  size="small"
                  color="grey"
                  variant="tonal"
                  class="text-medium-emphasis"
                >
                  {{ estado.cantidad }} Tareas
                </VChip>
              </div>
              <!-- CIRCULO PORCENTAJE -->
              <VProgressCircular
                :model-value="estado.porcentaje"
                :size="54"
                :width="4"
                :title="`${estado.cantidad} tarea (${estado.porcentaje}%)`"
                :color="estado.color"
                rotate="-90"
              >
                <span style="font-size: 13px; font-weight: 700;">
                  {{ estado.porcentaje }}
                  <sup style="font-size: 9px;">%</sup>
                </span>
              </VProgressCircular>
            </div>
          </div>
        </VCard>
      </VCol>
    </VRow>
    <!-- RESUMEN -->
    <VRow class="mb-6">
      <!-- TOTAL JOBS -->
      <VCol cols="12" sm="6" md="3">
        <VCard class="pa-4 resumen-card resumen-primary">
          <div class="d-flex align-center gap-4">
            <VAvatar size="42" color="primary" variant="tonal">
              <VIcon icon="tabler-list-check" size="22" />
            </VAvatar>

            <div>
              <div class="text-h5 font-weight-bold">
                {{ resumen.total_tareas_unicas }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Tareas registradas
              </div>
            </div>
          </div>
        </VCard>
      </VCol>
      <!-- TOTAL EJECUCIONES -->
      <VCol cols="12" sm="6" md="3">
        <VCard class="pa-4 resumen-card resumen-primary">
          <div class="d-flex align-center gap-4">
            <VAvatar size="42" color="primary" variant="tonal">
              <VIcon icon="tabler-list-check" size="22" />
            </VAvatar>

            <div>
              <div class="text-h5 font-weight-bold">
                {{ resumen.total_jobs }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Ejecuciones totales
              </div>
            </div>
          </div>
        </VCard>
      </VCol>
      <!-- TIEMPO TOTAL -->
      <VCol cols="12" sm="6" md="3">
        <VCard class="pa-4 resumen-card resumen-success">
          <div class="d-flex align-center gap-4">
            <VAvatar size="42" color="success" variant="tonal">
              <VIcon icon="tabler-clock" size="22" />
            </VAvatar>

            <div>
              <div class="text-h5 font-weight-bold">
                {{ resumen.tiempo_total }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Tiempo total de ejecución
              </div>
            </div>
          </div>
        </VCard>
      </VCol>
      <!-- TIEMPO PROMEDIO -->
      <VCol cols="12" sm="6" md="3">
        <VCard class="pa-4 resumen-card resumen-info">
          <div class="d-flex align-center gap-4">
            <VAvatar size="42" color="info" variant="tonal">
              <VIcon icon="tabler-chart-line" size="22" />
            </VAvatar>

            <div>
              <div class="text-h5 font-weight-bold">
                {{ resumen.tiempo_promedio }}
              </div>
              <div class="text-caption text-medium-emphasis">
                Promedio por tarea
              </div>
            </div>
          </div>
        </VCard>
      </VCol>
    </VRow>
  </Colapsable>
  <!--  FILTROS-->
  <Colapsable
    :abierto="false"
    class="mb-5"
    titulo="Filtros"
  >
    <VRow>
      <!-- TAREA / JOB -->
      <VCol cols="12" sm="6" md="4">
        <VLabel>Tarea</VLabel>
        <SelectorPro
          v-model:item-selected="filtros.name"
          url="api/configuracion/monitor/jobs/names"
          placeholder="Escribe para buscar..."
          item-value="name"
          item-title="name"
          :campos-a-filtrar="['name']"
        />
      </VCol>

      <!-- ESTADO -->
      <VCol cols="12" sm="6" md="4">
        <VLabel>Estado</VLabel>
        <VAutocomplete
          v-model="filtros.status"
          :items="estadosJob"
          item-value="id"
          item-title="nombre"
          clearable
          placeholder="Seleccione estado..."
        />
      </VCol>

      <!-- FECHA FINALIZACION TAREA -->
      <VCol cols="12" sm="6" md="4">
        <VLabel>Rango de fechas en que finalizó la tarea</VLabel>
        <AppDateTimePicker
          v-model="filtros.fecha"
          placeholder="Seleccione una fecha"
          :config="{
            mode: 'range',
            rangeSeparator: ' a ',
            locale: 'es',
          }"
        />
      </VCol>

      <!-- BOTONES -->
      <VCol cols="12" class="text-end">
        <VBtn
          color="secondary"
          class="mr-2"
          @click="limpiarFiltros"
        >
          <VIcon icon="tabler-cancel" start size="22" />
          Limpiar
        </VBtn>

        <VBtn
          color="primary"
          prepend-icon="tabler-filter"
          @click="filtrar"
        >
          Filtrar
        </VBtn>
      </VCol>
    </VRow>
  </Colapsable>

  <DataTableComponent
    ref="dataTable"
    :model="MODEL_QUEUE_MONITOR"
    :columnas="headers"
    endpoint="api/configuracion/monitor/jobs"
    :cantidad-por-pagina="5"
    :cantidad-por-pagina-opciones="[5, 7, 10]"
    :botones="['csv', 'xlsx', 'pdf', 'reiniciar']"
  >
    <!-- ESTADO -->
    <template #item.status_texto="{ item, internalItem, toggleExpand, isExpanded }">
      <div class="d-flex align-center gap-2">
        <VBtn
          v-if="item.status === 2"
          color="error"
          variant="text"
          size="small"
          class="pa-0"
          icon
          @click="toggleExpand(internalItem)"
        >
          <VIcon
            :icon="isExpanded(internalItem)
              ? 'tabler-chevrons-down'
              : 'tabler-chevrons-right'"
            size="20"
          />
        </VBtn>

        <VChip
          size="small"
          variant="tonal"
          :color="estadoTexto(item.status).color"
          class="d-flex align-center gap-1"
        >
          <VIcon
            :icon="estadoTexto(item.status).icono"
            size="21"
          />
          {{ estadoTexto(item.status).texto }}
        </VChip>
      </div>
    </template>
    <!-- TAREA -->
    <template #item.name="{ item }">
      <VTooltip activator="parent" location="top">
        {{ item.name }}
      </VTooltip>
      <VChip
        size="small"
        variant="tonal"
        :color="'info'"
        class="d-flex align-center gap-1"
      >
        {{ item.name }}
      </VChip>
    </template>
    <!-- PROGRESO -->
    <template #item.progress="{ item }">
      <div v-if="item.progress !== null && item.progress !== undefined" class="d-flex align-center gap-2">
        <VProgressLinear
          :model-value="item.progress"
          height="6"
          rounded
          color="primary"
          style="min-width: 80px"
        />
        <span class="text-caption">
      {{ item.progress }}%
    </span>
      </div>

      <span v-else class="text-disabled">
    N/A
  </span>
    </template>
    <!-- DURACIÓN -->
    <template #item.duration="{ item }">
      <div class="d-flex align-center gap-1">
        <VIcon icon="tabler-clock" size="14" class="text-medium-emphasis" />
        {{ calcularDuracionEntreFechas(item.started_at_exact, item.finished_at_exact) }}
      </div>
    </template>
    <!-- EJECUCIÓN  -->
    <template #item.ejecucion="{ item }">
      <div
        class="d-flex align-center gap-1 text-medium-emphasis"
        v-tooltip="{
      location: 'top',
      text: `
        Inicio: ${formatoFechaHora(item.started_at_exact || item.started_at)}
        Finalizado: ${
          item.finished_at_exact || item.finished_at
            ? formatoFechaHora(item.finished_at_exact || item.finished_at)
            : 'En ejecución'
        }
        `
      }"
      >
        <VIcon
          :icon="iconoEjecucion(item)"
          size="14"
          :class="colorEjecucion(item)"
        />
        {{ tiempoRelativoCorto(item.finished_at_exact || item.finished_at || item.started_at) }}
      </div>
    </template>
    <!-- ERROR -->
    <template #item.exception_message="{ item }">
      <span
        v-if="item.exception_message"
        class="text-error text-truncate"
        style="max-width:260px"
      >
        {{ item.exception_message }}
      </span>
      <span v-else>N/A</span>
    </template>
    <!-- FILA EXPANDIDA-->
    <template #expanded-row="{ columns, item }">
      <tr v-if="item.status === 2">
        <td :colspan="columns.length" class="pa-0">
          <VCard elevation="0" color="grey-lighten-5" class="ma-4 rounded-lg">
            <VCardText>
              <div class="d-flex gap-3 mb-3 flex-wrap">
                <VChip size="small" color="primary" variant="tonal" prepend-icon="tabler-calendar">
                  {{ formatoFechaHora(item.failed_at || item.finished_at_exact || item.finished_at) }}
                </VChip>

                <VChip size="small" color="error" variant="tonal" prepend-icon="tabler-alert-circle">
                  Fallido
                </VChip>
              </div>

              <VDivider class="mb-4" />

              <div class="d-flex flex-column gap-3 mb-4">
                <VCard variant="outlined" class="pa-2">
                  <div class="d-flex align-center gap-2">
                    <VIcon icon="tabler-repeat" size="18" class="text-info" />
                    <strong>Intento:</strong> {{ item.total_jobs }}
                  </div>
                </VCard>

                <VCard variant="outlined" class="pa-2">
                  <div class="d-flex align-center gap-2">
                    <VIcon icon="tabler-server" size="18" class="text-secondary" />
                    <strong>Cola:</strong> {{ item.queue }}
                  </div>
                </VCard>
              </div>

              <VDivider class="mb-4" />

              <div>
                <div class="text-caption font-weight-medium mb-1">
                  <VIcon icon="tabler-alert-triangle" size="20" class="me-1" />
                  Mensaje de error
                </div>
                <div
                  class="pa-3 rounded"
                  style="
                    background:#2d2d2d;
                    color:#ff6b6b;
                    font-family:Consolas,Monaco,monospace;
                    font-size:13px;
                    line-height:1.6;
                    border-left:4px solid #ff6b6b;
                    white-space:pre-wrap;
                  "
                >
                  {{ item.exception || item.exception_message }}
                </div>
              </div>
            </VCardText>
          </VCard>
        </td>
      </tr>
    </template>
    <!-- ACCIONES -->
    <template #item.Acciones="{ item }">
      <VBtn
        v-if="can('listar jobs', 'Job')"
        icon="tabler-eye"
        variant="tonal"
        color="info"
        v-tooltip="'Ver detalle'"
        :to="`/dev/monitor/show/${item.id}`"
        class="mr-1"
      />

      <VBtn
        v-if="can('reintentar job', 'Job') && puedeReintentar(item)"
        icon="tabler-refresh"
        variant="tonal"
        color="success"
        v-tooltip="'Reintentar tarea'"
        class="mr-1"
        @click="retryJob(item.id)"
      />

      <VBtn
        v-if="can('borrar job', 'Job')"
        icon="tabler-trash"
        variant="tonal"
        color="error"
        v-tooltip="'Eliminar job'"
        @click="deleteItem(item.id)"
      />
    </template>
  </DataTableComponent>

  <VDialog
    v-model="mostrarModalPrueba"
    max-width="450"
  >
    <VCard>
      <VCardTitle>
        Probar Job Monitor
      </VCardTitle>

      <VCardText>
        <VAutocomplete
          v-model="modoPrueba"
          :items="modosPrueba"
          item-value="id"
          item-title="nombre"
          label="Seleccione tipo de prueba"
          clearable
        />
      </VCardText>

      <VCardActions class="justify-end">
        <VBtn
          variant="text"
          @click="mostrarModalPrueba = false"
        >
          Cancelar
        </VBtn>

        <VBtn
          color="primary"
          :loading="cargandoPrueba"
          :disabled="!modoPrueba"
          @click="ejecutarPrueba"
        >
          Ejecutar
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

</template>
<style scoped lang="scss">
.resumen-card {
  border-radius: 14px;
  background: linear-gradient(
      180deg,
      rgba(255,255,255,0.04),
      rgba(255,255,255,0)
  );
  position: relative;
  overflow: hidden;
}

.resumen-card::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  height: 3px;
  width: 100%;
}

.resumen-primary::after {
  background: rgb(var(--v-theme-primary));
}

.resumen-success::after {
  background: rgb(var(--v-theme-success));
}

.resumen-info::after {
  background: rgb(var(--v-theme-info));
}

.estado-bar {
  display: flex;
  width: 100%;
  height: 36px;
  border-radius: 10px;
  overflow: hidden;
  background: rgba(255,255,255,0.06);
}

.estado-segment {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
}


</style>
