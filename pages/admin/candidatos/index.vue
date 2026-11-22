<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type { ColumnaInterface } from '@/types/sistema/DataTableTypes'
import type DataTableComponent from '@/components/DataTableComponent.vue'
import type { Candidato } from '@/types/reclutamiento'
import { MODEL_TYPE_CANDIDATO } from '@/constantes/ModelTypes'
import { inicialesPersona } from '@/utils/reclutamientoUx'

definePageMeta({
  navActiveLink: 'admin-candidatos',
  middleware: 'permissions',
  action: 'ver candidatos',
  subject: 'Candidato',
})

const { get, deleted } = useClienteRequest()
const { showToastSuccess, preguntaEliminar } = useToast()

const dataTable = ref<InstanceType<typeof DataTableComponent> | null>(null)
const vistaModo = ref<'tarjetas' | 'tabla'>('tarjetas')
const busquedaTexto = ref('')
const filtros = ref({ estado: null as string | null, nivel_academico: null as string | null })

const modalDetalle = ref(false)
const candidatoSeleccionado = ref<Candidato | null>(null)

const estados = [
  { title: 'Activo', value: 'Activo' },
  { title: 'Inactivo', value: 'Inactivo' },
  { title: 'Descartado', value: 'Descartado' },
]

const nivelesAcademicos = [
  { title: 'Primaria', value: 'Primaria' },
  { title: 'Básico', value: 'Básico' },
  { title: 'Diversificado', value: 'Diversificado' },
  { title: 'Universitario', value: 'Universitario' },
  { title: 'Postgrado', value: 'Postgrado' },
]

const coloresEstado: Record<string, string> = {
  Activo: 'success',
  Inactivo: 'secondary',
  Descartado: 'error',
}

const todosLosCandidatos = ref<Candidato[]>([])
const cargandoTarjetas = ref(false)

const cargarTodosLosCandidatos = async () => {
  cargandoTarjetas.value = true
  try {
    const respuesta = await get<{ data: Candidato[] | { data: Candidato[] } }>('/api/candidatos', {
      params: { 'include': 'municipio', 'sort': '-id', 'page[size]': 100 },
    })

    todosLosCandidatos.value = Array.isArray(respuesta.data)
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
  const lista = todosLosCandidatos.value
  const activos = lista.filter(c => c.estado === 'Activo').length
  const inactivos = lista.filter(c => c.estado === 'Inactivo').length
  const descartados = lista.filter(c => c.estado === 'Descartado').length

  return { total: lista.length, activos, inactivos, descartados }
})

const candidatosFiltrados = computed(() => {
  return todosLosCandidatos.value.filter(c => {
    if (filtros.value.estado && c.estado !== filtros.value.estado)
      return false
    if (filtros.value.nivel_academico && c.nivel_academico !== filtros.value.nivel_academico)
      return false
    if (busquedaTexto.value) {
      const q = busquedaTexto.value.toLowerCase()
      const nombres = `${c.nombres} ${c.apellidos}`.toLowerCase()
      const correo = (c.correo || '').toLowerCase()

      if (!nombres.includes(q) && !correo.includes(q))
        return false
    }

    return true
  })
})

const columnas = computed<ColumnaInterface[]>(() => [
  { title: 'ID', key: 'id' },
  { title: 'Nombres', key: 'nombres' },
  { title: 'Apellidos', key: 'apellidos' },
  { title: 'Correo', key: 'correo' },
  { title: 'Municipio', key: 'municipio', sortable: false },
  { title: 'Nivel académico', key: 'nivel_academico', OpcionesFiltro: { operador: '=', valor: filtros.value.nivel_academico } },
  { title: 'Estado', key: 'estado', OpcionesFiltro: { operador: '=', valor: filtros.value.estado } },
  { title: 'Acciones', key: 'acciones', sortable: false },
])

const filtrarTodo = () => {
  if (vistaModo.value === 'tabla')
    dataTable.value?.filtrar()
}

const limpiar = () => {
  filtros.value = { estado: null, nivel_academico: null }
  busquedaTexto.value = ''
  if (vistaModo.value === 'tabla')
    dataTable.value?.filtrar()
}

const verDetalleRapido = (item: Candidato) => {
  candidatoSeleccionado.value = item
  modalDetalle.value = true
}

const eliminar = async (id: number) => {
  if (!await preguntaEliminar('¿Desea eliminar este candidato?'))
    return

  try {
    const respuesta = await deleted<{ message: string }>(`/api/candidatos/${id}`)

    showToastSuccess(respuesta.message)
    await cargarTodosLosCandidatos()
    if (vistaModo.value === 'tabla')
      await dataTable.value?.filtrar()
  }
  catch (error) {
    manejaError(error)
  }
}

onMounted(cargarTodosLosCandidatos)
</script>

<template>
  <div class="candidatos-modulo">
    <!-- Encabezado ejecutivo -->
    <header class="tt-page-header">
      <div>
        <span class="tt-eyebrow">BANCO DE TALENTO</span>
        <h1 class="tt-page-title">
          Candidatos y Postulantes
        </h1>
        <p class="tt-page-subtitle">
          Gestione perfiles, formación académica, expedientes documentales y su vinculación a vacantes.
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
          Procesos activos
        </VBtn>
        <VBtn
          v-if="can('crear candidatos', 'Candidato')"
          color="primary"
          prepend-icon="tabler-plus"
          to="/admin/candidatos/create"
        >
          Nuevo candidato
        </VBtn>
      </div>
    </header>

    <!-- KPIs ejecutivos -->
    <VRow class="mb-5">
      <VCol
        cols="6"
        sm="4"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': filtros.estado === 'Activo' }"
          @click="filtros.estado = filtros.estado === 'Activo' ? null : 'Activo'; filtrarTodo()"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">Candidatos activos</span>
            <div class="tt-stat-icon">
              <VIcon
                icon="tabler-users-group"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.activos }}</strong>
          <small class="tt-stat-foot">Disponibles para selección</small>
        </div>
      </VCol>

      <VCol
        cols="6"
        sm="4"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          :class="{ 'tt-stat-card--active': filtros.estado === 'Descartado' }"
          @click="filtros.estado = filtros.estado === 'Descartado' ? null : 'Descartado'; filtrarTodo()"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">Descartados</span>
            <div class="tt-stat-icon tt-stat-icon--warn">
              <VIcon
                icon="tabler-user-x"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.descartados }}</strong>
          <small class="tt-stat-foot">Historial cerrado</small>
        </div>
      </VCol>

      <VCol
        cols="12"
        sm="4"
      >
        <div
          class="tt-stat-card tt-stat-card--interactive"
          @click="limpiar"
        >
          <div class="tt-stat-top">
            <span class="tt-stat-label">Total en banco</span>
            <div class="tt-stat-icon tt-stat-icon--info">
              <VIcon
                icon="tabler-id-badge-2"
                size="18"
              />
            </div>
          </div>
          <strong class="tt-stat-value">{{ metricas.total }}</strong>
          <small class="tt-stat-foot">Expedientes registrados</small>
        </div>
      </VCol>
    </VRow>

    <!-- Barra de Filtros y Vista -->
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
            label="Buscar persona"
            prepend-inner-icon="tabler-search"
            placeholder="Nombre, apellido o correo..."
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
            v-model="filtros.nivel_academico"
            :items="nivelesAcademicos"
            label="Nivel académico"
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

      <VRow v-else-if="candidatosFiltrados.length">
        <VCol
          v-for="c in candidatosFiltrados"
          :key="c.id"
          cols="12"
          md="6"
          lg="4"
        >
          <article class="tt-panel pa-5 h-100 d-flex flex-column candidato-card">
            <div class="d-flex justify-space-between align-start gap-2 mb-3">
              <div class="d-flex align-center gap-3 min-w-0">
                <div class="tt-avatar tt-avatar--lg">
                  {{ inicialesPersona(c.nombres, c.apellidos) }}
                </div>
                <div class="min-w-0">
                  <h2 class="text-subtitle-1 font-weight-bold mb-0 text-truncate">
                    {{ c.nombres }} {{ c.apellidos }}
                  </h2>
                  <div class="text-caption text-medium-emphasis text-truncate">
                    {{ c.correo }}
                  </div>
                </div>
              </div>
              <VChip
                :color="coloresEstado[c.estado] || 'secondary'"
                variant="tonal"
                size="x-small"
                class="font-weight-bold flex-shrink-0"
              >
                {{ c.estado }}
              </VChip>
            </div>

            <div class="tt-detail-box mb-4 flex-grow-1">
              <div class="d-flex justify-space-between align-center mb-2">
                <div>
                  <span>Nivel académico</span>
                  <strong>{{ c.nivel_academico || 'Sin registrar' }}</strong>
                </div>
                <span class="tt-tag-days mt-0">
                  {{ c.postulaciones_count ?? 0 }} {{ (c.postulaciones_count ?? 0) === 1 ? 'proceso' : 'procesos' }}
                </span>
              </div>
              <div class="text-caption text-medium-emphasis">
                <VIcon
                  icon="tabler-map-pin"
                  size="13"
                  class="mr-1"
                />
                {{ c.municipio?.nombre || 'Municipio sin registrar' }}
                <template v-if="c.telefono">
                  · {{ c.telefono }}
                </template>
              </div>
            </div>

            <div class="d-flex justify-space-between align-center pt-2 border-t">
              <div class="d-flex gap-2">
                <VBtn
                  variant="tonal"
                  size="small"
                  color="primary"
                  prepend-icon="tabler-id"
                  :to="`/admin/candidatos/show/${c.id}`"
                >
                  Expediente
                </VBtn>
                <VBtn
                  v-if="can('crear postulaciones', 'Postulacion') && c.estado === 'Activo'"
                  variant="text"
                  size="small"
                  color="success"
                  prepend-icon="tabler-briefcase-2"
                  :to="`/admin/postulaciones/create?candidato_id=${c.id}`"
                >
                  Postular
                </VBtn>
              </div>

              <div class="d-flex gap-1">
                <VBtn
                  v-if="can('editar candidatos', 'Candidato')"
                  icon="tabler-edit"
                  variant="text"
                  size="small"
                  :to="`/admin/candidatos/edit/${c.id}`"
                  title="Editar"
                />
                <VBtn
                  v-if="can('eliminar candidatos', 'Candidato')"
                  icon="tabler-trash"
                  variant="text"
                  size="small"
                  color="error"
                  title="Eliminar"
                  @click="eliminar(c.id)"
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
          icon="tabler-users-group"
          size="44"
          class="text-disabled mb-2"
        />
        <h3 class="text-h6 text-medium-emphasis">
          No se encontraron candidatos con los criterios seleccionados
        </h3>
        <p class="text-caption text-disabled mb-4">
          Prueba limpiando los filtros o registrando un nuevo candidato.
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
        :model="MODEL_TYPE_CANDIDATO"
        :columnas="columnas"
        :relaciones="['municipio']"
        :botones="['reiniciar']"
        :cantidad-por-pagina="10"
        endpoint="/api/candidatos"
        placeholder="No se encontraron candidatos"
      >
        <template #item.nombres="{ item }">
          <div class="d-flex align-center gap-2 py-1">
            <div class="tt-avatar">
              {{ inicialesPersona(item.nombres, item.apellidos) }}
            </div>
            <span class="font-weight-bold text-body-2">{{ item.nombres }}</span>
          </div>
        </template>
        <template #item.municipio="{ item }">
          {{ item.municipio?.nombre || '—' }}
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
        <template #item.acciones="{ item }">
          <VBtn
            v-if="can('ver candidatos', 'Candidato')"
            icon="tabler-eye"
            variant="text"
            size="small"
            color="primary"
            title="Vista rápida"
            @click="verDetalleRapido(item)"
          />
          <VBtn
            v-if="can('editar candidatos', 'Candidato')"
            icon="tabler-edit"
            variant="text"
            size="small"
            title="Editar"
            :to="`/admin/candidatos/edit/${item.id}`"
          />
          <VBtn
            v-if="can('eliminar candidatos', 'Candidato')"
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

    <!-- Modal Ejecutivo de Vista Rápida -->
    <VDialog
      v-model="modalDetalle"
      max-width="640px"
    >
      <VCard
        v-if="candidatoSeleccionado"
        class="tt-panel"
      >
        <div class="d-flex justify-space-between align-start pa-5 pb-4">
          <div class="d-flex align-center gap-3">
            <div class="tt-avatar tt-avatar--lg">
              {{ inicialesPersona(candidatoSeleccionado.nombres, candidatoSeleccionado.apellidos) }}
            </div>
            <div>
              <span class="tt-eyebrow">CANDIDATO #{{ candidatoSeleccionado.id }}</span>
              <h3 class="text-h5 font-weight-bold mb-0">
                {{ candidatoSeleccionado.nombres }} {{ candidatoSeleccionado.apellidos }}
              </h3>
            </div>
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
              :color="coloresEstado[candidatoSeleccionado.estado] || 'secondary'"
              variant="tonal"
              size="small"
              class="font-weight-bold"
            >
              {{ candidatoSeleccionado.estado }}
            </VChip>
            <span class="text-body-2 text-medium-emphasis">
              {{ candidatoSeleccionado.correo }}
            </span>
          </div>

          <VRow dense>
            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Teléfono</span>
                <strong>{{ candidatoSeleccionado.telefono || 'Sin registrar' }}</strong>
              </div>
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Municipio</span>
                <strong>{{ candidatoSeleccionado.municipio?.nombre || 'Sin registrar' }}</strong>
              </div>
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Nivel académico</span>
                <strong>{{ candidatoSeleccionado.nivel_academico || 'Sin registrar' }}</strong>
              </div>
            </VCol>
            <VCol
              cols="12"
              sm="6"
            >
              <div class="tt-detail-box">
                <span>Fuente de reclutamiento</span>
                <strong>{{ candidatoSeleccionado.fuente_reclutamiento || 'Sin registrar' }}</strong>
              </div>
            </VCol>
          </VRow>
        </VCardText>

        <VDivider />

        <VCardActions class="pa-4 d-flex justify-space-between">
          <VBtn
            variant="tonal"
            color="secondary"
            @click="modalDetalle = false"
          >
            Cerrar
          </VBtn>
          <div class="d-flex gap-2">
            <VBtn
              v-if="can('crear postulaciones', 'Postulacion') && candidatoSeleccionado.estado === 'Activo'"
              variant="tonal"
              color="success"
              prepend-icon="tabler-briefcase-2"
              :to="`/admin/postulaciones/create?candidato_id=${candidatoSeleccionado.id}`"
            >
              Postular
            </VBtn>
            <VBtn
              variant="elevated"
              color="primary"
              prepend-icon="tabler-id"
              :to="`/admin/candidatos/show/${candidatoSeleccionado.id}`"
            >
              Ver expediente completo
            </VBtn>
          </div>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>

<style scoped lang="scss">
@import '@/assets/styles/reclutamiento-talent.scss';

.candidato-card {
  transition: transform 0.16s ease, border-color 0.16s ease, box-shadow 0.16s ease;

  &:hover {
    transform: translateY(-2px);
    border-color: rgba(33, 130, 104, 0.38);
    box-shadow: 0 10px 26px rgba(27, 65, 52, 0.08);
  }
}
</style>
