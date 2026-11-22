<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type { ColumnaInterface } from '@/types/sistema/DataTableTypes'
import type DataTableComponent from '@/components/DataTableComponent.vue'
import type { Vacante } from '@/types/reclutamiento'
import { MODEL_TYPE_VACANTE } from '@/constantes/ModelTypes'

definePageMeta({
  navActiveLink: 'admin-vacantes',
  middleware: 'permissions',
  action: 'ver vacantes',
  subject: 'Vacante',
})

const { get, deleted } = useClienteRequest()
const { showToastSuccess, preguntaEliminar } = useToast()

const dataTable = ref<InstanceType<typeof DataTableComponent> | null>(null)
const vistaModo = ref<'tarjetas' | 'tabla'>('tarjetas')
const busquedaTexto = ref('')
const filtros = ref({ estado: null as string | null, motivo: null as string | null })

const modalDetalle = ref(false)
const vacanteSeleccionada = ref<Vacante | null>(null)

const estados = [
  { title: 'Abierta', value: 'Abierta' },
  { title: 'En Proceso', value: 'En Proceso' },
  { title: 'Cubierta', value: 'Cubierta' },
  { title: 'Cancelada', value: 'Cancelada' },
]

const motivos = [
  { title: 'Nueva', value: 'Nueva' },
  { title: 'Reemplazo', value: 'Reemplazo' },
]

const coloresEstado: Record<string, string> = {
  'Abierta': 'success',
  'En Proceso': 'warning',
  'Cubierta': 'info',
  'Cancelada': 'secondary',
}

const todasLasVacantes = ref<Vacante[]>([])
const cargandoTarjetas = ref(false)

const cargarTodasLasVacantes = async () => {
  cargandoTarjetas.value = true
  try {
    const respuesta = await get<{ data: Vacante[] | { data: Vacante[] } }>('/api/vacantes?include=puesto,unidad,solicitante&sort=-id&page[size]=100')

    todasLasVacantes.value = Array.isArray(respuesta.data)
      ? respuesta.data
      : (respuesta.data?.data || [])
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargandoTarjetas.value = false
  }
}

const metricas = computed(() => {
  const lista = todasLasVacantes.value
  const abiertas = lista.filter(v => v.estado === 'Abierta').length
  const enProceso = lista.filter(v => v.estado === 'En Proceso').length
  const cubiertas = lista.filter(v => v.estado === 'Cubierta').length
  const totalPlazas = lista.reduce((acc, v) => acc + (Number(v.numero_plazas) || 0), 0)

  return { total: lista.length, abiertas, enProceso, cubiertas, totalPlazas }
})

const vacantesFiltradas = computed(() => {
  return todasLasVacantes.value.filter(v => {
    if (filtros.value.estado && v.estado !== filtros.value.estado)
      return false
    if (filtros.value.motivo && v.motivo !== filtros.value.motivo)
      return false
    if (busquedaTexto.value) {
      const q = busquedaTexto.value.toLowerCase()
      const puesto = (v.puesto?.nombre || '').toLowerCase()
      const unidad = (v.unidad?.nombre || '').toLowerCase()
      const desc = (v.descripcion || '').toLowerCase()

      if (!puesto.includes(q) && !unidad.includes(q) && !desc.includes(q))
        return false
    }

    return true
  })
})

const columnas = computed<ColumnaInterface[]>(() => [
  { title: 'ID', key: 'id' },
  { title: 'Puesto', key: 'puesto', sortable: false },
  { title: 'Unidad', key: 'unidad', sortable: false },
  { title: 'Plazas', key: 'numero_plazas' },
  { title: 'Postulaciones', key: 'postulaciones_count', sortable: false },
  { title: 'Motivo', key: 'motivo', OpcionesFiltro: { operador: '=', valor: filtros.value.motivo } },
  { title: 'Estado', key: 'estado', OpcionesFiltro: { operador: '=', valor: filtros.value.estado } },
  { title: 'Fecha apertura', key: 'fecha_apertura' },
  { title: 'Acciones', key: 'acciones', sortable: false },
])

const filtrarTodo = () => {
  if (vistaModo.value === 'tabla')
    dataTable.value?.filtrar()
}

const limpiar = () => {
  filtros.value = { estado: null, motivo: null }
  busquedaTexto.value = ''
  if (vistaModo.value === 'tabla')
    dataTable.value?.filtrar()
}

const verDetalleRapido = (item: Vacante) => {
  vacanteSeleccionada.value = item
  modalDetalle.value = true
}

const eliminar = async (id: number) => {
  if (!await preguntaEliminar('¿Desea eliminar esta vacante?'))
    return

  try {
    const respuesta = await deleted<{ message: string }>(`/api/vacantes/${id}`)

    showToastSuccess(respuesta.message)
    await cargarTodasLasVacantes()
    if (vistaModo.value === 'tabla')
      await dataTable.value?.filtrar()
  }
  catch (error) {
    manejaError(error)
  }
}

onMounted(cargarTodasLasVacantes)
</script>

<template>
  <div class="vacantes-modulo">
    <!-- Encabezado ejecutivo estilo maqueta-talento-humano.html -->
    <header class="tt-page-header">
      <div>
        <span class="tt-eyebrow">OPORTUNIDADES ABIERTAS</span>
        <h1 class="tt-page-title">
          Vacantes y Procesos
        </h1>
        <p class="tt-page-subtitle">
          Administre las vacantes institucionales, plazas requeridas y el acceso directo a sus candidatos.
        </p>
      </div>
      <div class="d-flex flex-wrap gap-2">
        <VBtn
          v-if="can('ver postulaciones', 'Postulacion')"
          color="secondary"
          variant="tonal"
          prepend-icon="tabler-layout-kanban"
          to="/admin/postulaciones"
        >
          Ver tablero de postulaciones
        </VBtn>
        <VBtn
          v-if="can('crear vacantes', 'Vacante')"
          color="primary"
          prepend-icon="tabler-plus"
          to="/admin/vacantes/create"
        >
          Nueva vacante
        </VBtn>
      </div>
    </header>

    <!-- KPIs ejecutivos -->
    <VRow class="mb-5">
      <VCol
        cols="6"
        sm="3"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': filtros.estado === 'Abierta' }"
          @click="filtros.estado = filtros.estado === 'Abierta' ? null : 'Abierta'; filtrarTodo()"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">Abiertas</span>
            <div class="tt-stat-icon">
              <VIcon
                icon="tabler-briefcase"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.abiertas }}</strong>
          <small class="tt-stat-foot">Recepción activa</small>
        </div>
      </VCol>

      <VCol
        cols="6"
        sm="3"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': filtros.estado === 'En Proceso' }"
          @click="filtros.estado = filtros.estado === 'En Proceso' ? null : 'En Proceso'; filtrarTodo()"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">En proceso</span>
            <div class="tt-stat-icon tt-stat-icon--warn">
              <VIcon
                icon="tabler-users-group"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.enProceso }}</strong>
          <small class="tt-stat-foot">Evaluación y entrevistas</small>
        </div>
      </VCol>

      <VCol
        cols="6"
        sm="3"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': filtros.estado === 'Cubierta' }"
          @click="filtros.estado = filtros.estado === 'Cubierta' ? null : 'Cubierta'; filtrarTodo()"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">Cubiertas</span>
            <div class="tt-stat-icon tt-stat-icon--info">
              <VIcon
                icon="tabler-circle-check"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.cubiertas }}</strong>
          <small class="tt-stat-foot">Plazas incorporadas</small>
        </div>
      </VCol>

      <VCol
        cols="6"
        sm="3"
      >
        <div class="tt-stat-card">
          <div class="tt-stat-top">
            <span class="tt-stat-label">Plazas requeridas</span>
            <div class="tt-stat-icon">
              <VIcon
                icon="tabler-id-badge-2"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.totalPlazas }}</strong>
          <small class="tt-stat-foot">Total acumulado</small>
        </div>
      </VCol>
    </VRow>

    <!-- Barra de Filtros y Control de Vista -->
    <section class="tt-panel pa-4 mb-5">
      <VRow
        align="center"
        dense
      >
        <VCol
          cols="12"
          md="4"
        >
          <AppTextField
            v-model="busquedaTexto"
            label="Buscar vacante"
            prepend-inner-icon="tabler-search"
            placeholder="Puesto, unidad o descripción..."
            clearable
          />
        </VCol>
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <AppSelect
            v-model="filtros.estado"
            :items="estados"
            label="Estado"
            placeholder="Todos"
            clearable
            @update:model-value="filtrarTodo"
          />
        </VCol>
        <VCol
          cols="12"
          sm="6"
          md="3"
        >
          <AppSelect
            v-model="filtros.motivo"
            :items="motivos"
            label="Motivo"
            placeholder="Todos"
            clearable
            @update:model-value="filtrarTodo"
          />
        </VCol>
        <VCol
          cols="12"
          md="2"
          class="d-flex justify-end align-center gap-2 pt-md-6"
        >
          <VBtn
            icon="tabler-filter-off"
            color="secondary"
            variant="tonal"
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
              value="tarjetas"
              icon="tabler-layout-grid"
              size="small"
            />
            <VBtn
              value="tabla"
              icon="tabler-table"
              size="small"
            />
          </VBtnToggle>
        </VCol>
      </VRow>
    </section>

    <!-- MODO 1: Vista de Tarjetas Ejecutiva -->
    <div v-if="vistaModo === 'tarjetas'">
      <VProgressLinear
        v-if="cargandoTarjetas"
        indeterminate
        color="success"
        rounded
        class="mb-4"
      />

      <VRow v-else-if="vacantesFiltradas.length">
        <VCol
          v-for="v in vacantesFiltradas"
          :key="v.id"
          cols="12"
          md="6"
          lg="4"
        >
          <article class="tt-panel pa-5 h-100 d-flex flex-column vacante-card">
            <div class="d-flex justify-space-between align-center mb-3">
              <VChip
                :color="coloresEstado[v.estado] || 'secondary'"
                variant="tonal"
                size="x-small"
                class="font-weight-bold"
              >
                {{ v.estado === 'Abierta' ? 'Activa' : v.estado }}
              </VChip>
              <span class="text-caption text-medium-emphasis">
                #{{ v.id }} · <strong>{{ v.numero_plazas }}</strong> {{ Number(v.numero_plazas) === 1 ? 'plaza' : 'plazas' }}
              </span>
            </div>

            <h2 class="text-h6 font-weight-bold mb-1">
              {{ v.puesto?.nombre || `Vacante #${v.id}` }}
            </h2>

            <div class="d-flex align-center gap-1 text-caption text-medium-emphasis mb-3">
              <VIcon
                icon="tabler-building-bank"
                size="14"
              />
              <span>{{ v.unidad?.nombre || 'Sede no asignada' }}</span>
            </div>

            <p class="text-body-2 text-medium-emphasis mb-4 line-clamp-3 flex-grow-1">
              {{ v.descripcion || 'Sin descripción detallada registrada para esta vacante.' }}
            </p>

            <div class="tt-detail-box mb-4">
              <div class="d-flex justify-space-between align-center flex-wrap gap-2">
                <div>
                  <span>Apertura · {{ v.motivo }}</span>
                  <strong>{{ formatearFecha(v.fecha_apertura) }}</strong>
                  <span v-if="v.contratadas_count !== undefined">{{ v.contratadas_count }} plazas ocupadas · {{ v.plazas_disponibles }} disponibles</span>
                </div>
                <NuxtLink
                  v-if="can('ver postulaciones', 'Postulacion')"
                  :to="`/admin/postulaciones?vacante_id=${v.id}`"
                  class="tt-tag-days mt-0 text-decoration-none"
                >
                  <VIcon
                    icon="tabler-users"
                    size="13"
                  />
                  {{ v.postulaciones_count ?? 0 }} {{ (v.postulaciones_count ?? 0) === 1 ? 'postulación' : 'postulaciones' }}
                </NuxtLink>
              </div>
            </div>

            <div class="d-flex justify-space-between align-center pt-2 border-t">
              <div class="d-flex gap-2">
                <VBtn
                  variant="tonal"
                  size="small"
                  color="primary"
                  prepend-icon="tabler-eye"
                  @click="verDetalleRapido(v)"
                >
                  Detalle
                </VBtn>
                <VBtn
                  v-if="can('crear postulaciones', 'Postulacion') && (v.estado === 'Abierta' || v.estado === 'En Proceso')"
                  variant="text"
                  size="small"
                  color="success"
                  prepend-icon="tabler-user-plus"
                  :to="`/admin/postulaciones/create?vacante_id=${v.id}`"
                >
                  Postular
                </VBtn>
              </div>
              <div class="d-flex gap-1">
                <VBtn
                  v-if="can('editar vacantes', 'Vacante')"
                  icon="tabler-edit"
                  variant="text"
                  size="small"
                  :to="`/admin/vacantes/edit/${v.id}`"
                  title="Editar"
                />
                <VBtn
                  v-if="can('eliminar vacantes', 'Vacante')"
                  icon="tabler-trash"
                  variant="text"
                  size="small"
                  color="error"
                  title="Eliminar"
                  @click="eliminar(v.id)"
                />
              </div>
            </div>
          </article>
        </VCol>
      </VRow>

      <section
        v-else
        class="tt-panel text-center pa-10"
      >
        <VIcon
          icon="tabler-briefcase-off"
          size="44"
          class="text-disabled mb-2"
        />
        <h3 class="text-h6 text-medium-emphasis">
          No se encontraron vacantes con los criterios seleccionados
        </h3>
        <p class="text-caption text-disabled mb-4">
          Prueba limpiando los filtros o creando una nueva vacante.
        </p>
        <VBtn
          variant="tonal"
          color="primary"
          @click="limpiar"
        >
          Restablecer filtros
        </VBtn>
      </section>
    </div>

    <!-- MODO 2: Vista de Tabla -->
    <div
      v-else
      class="tt-panel overflow-hidden"
    >
      <DataTableComponent
        ref="dataTable"
        :model="MODEL_TYPE_VACANTE"
        :columnas="columnas"
        :relaciones="['puesto', 'unidad', 'solicitante']"
        :botones="['reiniciar']"
        :cantidad-por-pagina="10"
        endpoint="/api/vacantes"
        placeholder="No se encontraron vacantes"
      >
        <template #item.puesto="{ item }">
          <div class="font-weight-bold text-body-2">
            {{ item.puesto?.nombre }}
          </div>
        </template>
        <template #item.unidad="{ item }">
          <span class="text-body-2">{{ item.unidad?.nombre }}</span>
        </template>
        <template #item.postulaciones_count="{ item }">
          <NuxtLink
            v-if="can('ver postulaciones', 'Postulacion')"
            :to="`/admin/postulaciones?vacante_id=${item.id}`"
            class="tt-tag-days mt-0 text-decoration-none"
          >
            {{ item.postulaciones_count ?? 0 }} en proceso
          </NuxtLink>
          <span v-else>{{ item.postulaciones_count ?? 0 }}</span>
        </template>
        <template #item.estado="{ item }">
          <VChip
            :color="coloresEstado[item.estado] || 'secondary'"
            variant="tonal"
            size="small"
            class="font-weight-bold"
          >
            {{ item.estado }}
          </VChip>
        </template>
        <template #item.fecha_apertura="{ item }">
          {{ item.fecha_apertura ? formatearFecha(item.fecha_apertura) : '' }}
        </template>
        <template #item.acciones="{ item }">
          <VBtn
            v-if="can('ver vacantes', 'Vacante')"
            icon="tabler-eye"
            variant="text"
            size="small"
            color="primary"
            title="Ver detalle rápido"
            @click="verDetalleRapido(item)"
          />
          <VBtn
            v-if="can('editar vacantes', 'Vacante')"
            icon="tabler-edit"
            variant="text"
            size="small"
            title="Editar"
            :to="`/admin/vacantes/edit/${item.id}`"
          />
          <VBtn
            v-if="can('eliminar vacantes', 'Vacante')"
            icon="tabler-trash"
            variant="text"
            size="small"
            color="error"
            title="Eliminar"
            @click="eliminar(item.id)"
          />
        </template>
      </DataTableComponent>
    </div>

    <!-- Modal Ejecutivo de Detalle Rápido -->
    <VDialog
      v-model="modalDetalle"
      max-width="660px"
    >
      <VCard
        v-if="vacanteSeleccionada"
        class="tt-panel"
      >
        <div class="d-flex justify-space-between align-start pa-5 pb-4">
          <div>
            <span class="tt-eyebrow">VACANTE #{{ vacanteSeleccionada.id }} · {{ vacanteSeleccionada.motivo }}</span>
            <h3 class="text-h5 font-weight-bold mt-1 mb-0">
              {{ vacanteSeleccionada.puesto?.nombre || 'Detalle de la vacante' }}
            </h3>
          </div>
          <VBtn
            icon="tabler-x"
            variant="tonal"
            color="secondary"
            size="small"
            @click="modalDetalle = false"
          />
        </div>

        <VDivider />

        <VCardText class="pa-5">
          <div class="d-flex flex-wrap align-center gap-2 mb-4">
            <VChip
              :color="coloresEstado[vacanteSeleccionada.estado] || 'secondary'"
              variant="tonal"
              size="small"
              class="font-weight-bold"
            >
              {{ vacanteSeleccionada.estado }}
            </VChip>
            <span class="text-body-2 text-medium-emphasis">
              {{ vacanteSeleccionada.unidad?.nombre || 'Sin unidad' }} · {{ vacanteSeleccionada.numero_plazas }} {{ Number(vacanteSeleccionada.numero_plazas) === 1 ? 'plaza' : 'plazas' }}
            </span>
          </div>

          <VRow
            dense
            class="mb-3"
          >
            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Fecha de apertura</span>
                <strong>{{ formatearFecha(vacanteSeleccionada.fecha_apertura) }}</strong>
              </div>
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Postulaciones registradas</span>
                <strong>{{ vacanteSeleccionada.postulaciones_count ?? 0 }} candidatos</strong>
              </div>
            </VCol>
            <VCol cols="12">
              <div class="tt-detail-box">
                <span>Acerca del puesto</span>
                <p class="text-body-2 mt-1 mb-0">
                  {{ vacanteSeleccionada.descripcion || 'Sin descripción detallada.' }}
                </p>
              </div>
            </VCol>
            <VCol cols="12">
              <div class="tt-detail-box">
                <span>Perfil y requisitos</span>
                <p class="text-body-2 mt-1 mb-0">
                  {{ vacanteSeleccionada.requisitos || 'Sin requisitos específicos registrados.' }}
                </p>
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4 d-flex flex-wrap justify-space-between gap-2">
          <VBtn
            variant="tonal"
            color="secondary"
            @click="modalDetalle = false"
          >
            Cerrar
          </VBtn>
          <div class="d-flex flex-wrap gap-2">
            <VBtn
              v-if="can('ver postulaciones', 'Postulacion')"
              variant="tonal"
              color="success"
              prepend-icon="tabler-layout-kanban"
              :to="`/admin/postulaciones?vacante_id=${vacanteSeleccionada.id}`"
            >
              Ver candidatos
            </VBtn>
            <VBtn
              variant="elevated"
              color="primary"
              prepend-icon="tabler-file-text"
              :to="`/admin/vacantes/show/${vacanteSeleccionada.id}`"
            >
              Ficha completa
            </VBtn>
          </div>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/reclutamiento-talent.scss';

.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.vacante-card {
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(33, 130, 104, 0.38);
    box-shadow: 0 10px 26px rgba(27, 65, 52, 0.08);
  }
}
</style>
