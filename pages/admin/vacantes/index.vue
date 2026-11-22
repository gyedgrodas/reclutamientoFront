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
    <!-- Encabezado de la página -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-6 gap-3">
      <div>
        <div class="d-flex align-center gap-2">
          <span class="text-caption text-primary font-weight-bold text-uppercase tracking-wider">Gestión de Talento</span>
        </div>
        <h1 class="text-h4 font-weight-bold">
          Vacantes y Procesos
        </h1>
        <p class="text-caption text-medium-emphasis mb-0">
          Administre las vacantes activas, requerimientos de personal y avance del proceso de selección.
        </p>
      </div>
      <div class="d-flex gap-2">
        <VBtn
          v-if="can('crear vacantes', 'Vacante')"
          color="primary"
          prepend-icon="tabler-plus"
          to="/admin/vacantes/create"
        >
          Nueva vacante
        </VBtn>
      </div>
    </div>

    <!-- Mini KPIs superiores inspirados en la maqueta -->
    <VRow class="mb-5">
      <VCol
        cols="6"
        sm="3"
      >
        <VCard
          class="cursor-pointer"
          elevation="1"
          @click="filtros.estado = 'Abierta'; filtrarTodo()"
        >
          <VCardText class="pa-4 d-flex align-center justify-space-between">
            <div>
              <span class="text-caption text-medium-emphasis">Abiertas</span>
              <h3 class="text-h5 font-weight-bold text-success mt-1">
                {{ metricas.abiertas }}
              </h3>
            </div>
            <VAvatar
              color="success"
              variant="tonal"
              size="40"
              rounded
            >
              <VIcon
                icon="tabler-briefcase"
                size="22"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="6"
        sm="3"
      >
        <VCard
          class="cursor-pointer"
          elevation="1"
          @click="filtros.estado = 'En Proceso'; filtrarTodo()"
        >
          <VCardText class="pa-4 d-flex align-center justify-space-between">
            <div>
              <span class="text-caption text-medium-emphasis">En Proceso</span>
              <h3 class="text-h5 font-weight-bold text-warning mt-1">
                {{ metricas.enProceso }}
              </h3>
            </div>
            <VAvatar
              color="warning"
              variant="tonal"
              size="40"
              rounded
            >
              <VIcon
                icon="tabler-users-group"
                size="22"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="6"
        sm="3"
      >
        <VCard
          class="cursor-pointer"
          elevation="1"
          @click="filtros.estado = 'Cubierta'; filtrarTodo()"
        >
          <VCardText class="pa-4 d-flex align-center justify-space-between">
            <div>
              <span class="text-caption text-medium-emphasis">Cubiertas</span>
              <h3 class="text-h5 font-weight-bold text-info mt-1">
                {{ metricas.cubiertas }}
              </h3>
            </div>
            <VAvatar
              color="info"
              variant="tonal"
              size="40"
              rounded
            >
              <VIcon
                icon="tabler-circle-check"
                size="22"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="6"
        sm="3"
      >
        <VCard elevation="1">
          <VCardText class="pa-4 d-flex align-center justify-space-between">
            <div>
              <span class="text-caption text-medium-emphasis">Total Plazas</span>
              <h3 class="text-h5 font-weight-bold text-primary mt-1">
                {{ metricas.totalPlazas }}
              </h3>
            </div>
            <VAvatar
              color="primary"
              variant="tonal"
              size="40"
              rounded
            >
              <VIcon
                icon="tabler-id-badge-2"
                size="22"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>

    <!-- Barra de Filtros y Control de Vista (Tarjetas vs Tabla) -->
    <VCard
      class="mb-6"
      elevation="1"
    >
      <VCardText class="pa-4">
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
              prepend-inner-icon="tabler-search"
              placeholder="Buscar por puesto, unidad..."
              clearable
              density="compact"
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
              clearable
              density="compact"
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
              clearable
              density="compact"
              @update:model-value="filtrarTodo"
            />
          </VCol>
          <VCol
            cols="12"
            md="2"
            class="d-flex justify-end align-center gap-2"
          >
            <VBtn
              color="secondary"
              variant="tonal"
              size="small"
              @click="limpiar"
            >
              Limpiar
            </VBtn>

            <!-- Botones toggle Cards / Tabla -->
            <VBtnToggle
              v-model="vistaModo"
              mandatory
              density="compact"
              color="primary"
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
      </VCardText>
    </VCard>

    <!-- MODO 1: Vista de Tarjetas Dinámica (Estilo Maqueta UX) -->
    <div v-if="vistaModo === 'tarjetas'">
      <VProgressLinear
        v-if="cargandoTarjetas"
        indeterminate
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
          <VCard
            class="h-100 d-flex flex-column transition-all"
            elevation="1"
            hover
          >
            <VCardItem>
              <div class="d-flex justify-space-between align-start mb-2">
                <VChip
                  :color="coloresEstado[v.estado] || 'secondary'"
                  size="small"
                  class="font-weight-bold"
                >
                  {{ v.estado }}
                </VChip>
                <span class="text-caption text-medium-emphasis">#{{ v.id }} · Plazas: <strong>{{ v.numero_plazas }}</strong></span>
              </div>
              <h2 class="text-h6 font-weight-bold mb-1">
                {{ v.puesto?.nombre || `Vacante #${v.id}` }}
              </h2>
              <div class="d-flex align-center gap-1 text-caption text-medium-emphasis">
                <VIcon
                  icon="tabler-building-bank"
                  size="14"
                />
                <span>{{ v.unidad?.nombre || 'Sede no asignada' }}</span>
              </div>
            </VCardItem>

            <VCardText class="flex-grow-1 pt-1">
              <p class="text-body-2 text-medium-emphasis mb-3 line-clamp-3">
                {{ v.descripcion || 'Sin descripción detallada registrada para esta vacante.' }}
              </p>

              <div class="d-flex flex-column gap-1 text-caption bg-surface pa-3 rounded border">
                <div>
                  <strong>Motivo:</strong> {{ v.motivo }}
                </div>
                <div>
                  <strong>Apertura:</strong> {{ formatearFecha(v.fecha_apertura) }}
                </div>
                <div v-if="v.solicitante">
                  <strong>Solicita:</strong> {{ v.solicitante.nombres }} {{ v.solicitante.apellidos }}
                </div>
              </div>
            </VCardText>

            <VDivider />

            <VCardActions class="pa-3 d-flex justify-space-between">
              <VBtn
                variant="tonal"
                size="small"
                color="primary"
                prepend-icon="tabler-eye"
                @click="verDetalleRapido(v)"
              >
                Detalle
              </VBtn>
              <div class="d-flex gap-1">
                <VBtn
                  v-if="can('editar vacantes', 'Vacante')"
                  icon="tabler-edit"
                  variant="text"
                  size="small"
                  color="warning"
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
            </VCardActions>
          </VCard>
        </VCol>
      </VRow>

      <VCard
        v-else
        class="text-center pa-10"
        elevation="0"
      >
        <VIcon
          icon="tabler-briefcase-off"
          size="48"
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
      </VCard>
    </div>

    <!-- MODO 2: Vista de Tabla Tradicional (DataTableComponent) -->
    <div v-else>
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
          <div class="font-weight-medium">
            {{ item.puesto?.nombre }}
          </div>
        </template>
        <template #item.unidad="{ item }">
          {{ item.unidad?.nombre }}
        </template>
        <template #item.estado="{ item }">
          <VChip
            :color="coloresEstado[item.estado] || 'secondary'"
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

    <!-- Modal Dinámico de Detalle Rápido (Estilo Maqueta UX) -->
    <VDialog
      v-model="modalDetalle"
      max-width="650px"
    >
      <VCard v-if="vacanteSeleccionada">
        <VCardItem class="bg-primary text-white py-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <span class="text-caption text-white opacity-80 text-uppercase">Vacante #{{ vacanteSeleccionada.id }}</span>
              <h3 class="text-h6 text-white font-weight-bold mb-0">
                {{ vacanteSeleccionada.puesto?.nombre || 'Detalle de la vacante' }}
              </h3>
            </div>
            <VBtn
              icon="tabler-x"
              variant="text"
              color="white"
              size="small"
              @click="modalDetalle = false"
            />
          </div>
        </VCardItem>

        <VCardText class="pa-6">
          <div class="d-flex flex-wrap align-center gap-2 mb-4">
            <VChip
              :color="coloresEstado[vacanteSeleccionada.estado] || 'secondary'"
              size="small"
              class="font-weight-bold"
            >
              {{ vacanteSeleccionada.estado }}
            </VChip>
            <span class="text-caption text-medium-emphasis">
              {{ vacanteSeleccionada.unidad?.nombre || 'Sin unidad' }} · {{ vacanteSeleccionada.numero_plazas }} {{ Number(vacanteSeleccionada.numero_plazas) === 1 ? 'plaza' : 'plazas' }}
            </span>
          </div>

          <h4 class="text-subtitle-1 font-weight-bold mb-1">
            Acerca del puesto
          </h4>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ vacanteSeleccionada.descripcion || 'Sin descripción detallada.' }}
          </p>

          <h4 class="text-subtitle-1 font-weight-bold mb-1">
            Perfil y requisitos
          </h4>
          <p class="text-body-2 text-medium-emphasis mb-4">
            {{ vacanteSeleccionada.requisitos || 'Sin requisitos específicos registrados.' }}
          </p>

          <VDivider class="my-4" />

          <VRow
            dense
            class="text-caption"
          >
            <VCol cols="6">
              <strong>Motivo:</strong> {{ vacanteSeleccionada.motivo }}
            </VCol>
            <VCol cols="6">
              <strong>Fecha Apertura:</strong> {{ formatearFecha(vacanteSeleccionada.fecha_apertura) }}
            </VCol>
            <VCol
              v-if="vacanteSeleccionada.fecha_cierre_estimada"
              cols="6"
            >
              <strong>Cierre Estimado:</strong> {{ formatearFecha(vacanteSeleccionada.fecha_cierre_estimada) }}
            </VCol>
            <VCol
              v-if="vacanteSeleccionada.solicitante"
              cols="6"
            >
              <strong>Solicitado por:</strong> {{ vacanteSeleccionada.solicitante.nombres }} {{ vacanteSeleccionada.solicitante.apellidos }}
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions class="pa-4 bg-surface d-flex justify-space-between border-t">
          <VBtn
            variant="text"
            color="secondary"
            @click="modalDetalle = false"
          >
            Cerrar
          </VBtn>
          <div class="d-flex gap-2">
            <VBtn
              v-if="can('editar vacantes', 'Vacante')"
              variant="tonal"
              color="warning"
              prepend-icon="tabler-edit"
              :to="`/admin/vacantes/edit/${vacanteSeleccionada.id}`"
            >
              Editar vacante
            </VBtn>
            <VBtn
              variant="elevated"
              color="primary"
              prepend-icon="tabler-file-text"
              :to="`/admin/vacantes/show/${vacanteSeleccionada.id}`"
            >
              Expediente completo
            </VBtn>
          </div>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped lang="scss">
.line-clamp-3 {
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 3;
  overflow: hidden;
}

.transition-all {
  transition: transform 0.2s ease, box-shadow 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 8px 20px rgba(0, 0, 0, 0.08) !important;
  }
}
</style>
