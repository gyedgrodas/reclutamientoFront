<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type { ColumnaInterface } from '@/types/sistema/DataTableTypes'
import type DataTableComponent from '@/components/DataTableComponent.vue'
import type { Candidato } from '@/types/reclutamiento'
import { MODEL_TYPE_CANDIDATO } from '@/constantes/ModelTypes'

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
    const respuesta = await get<{ data: { data: Candidato[] } }>('/api/candidatos', {
      params: { 'include': 'municipio', 'sort': '-id', 'page[size]': 100 },
    })

    todosLosCandidatos.value = respuesta.data?.data || []
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
    <!-- Encabezado de la página -->
    <div class="d-flex flex-wrap justify-space-between align-center mb-6 gap-3">
      <div>
        <div class="d-flex align-center gap-2">
          <span class="text-caption text-primary font-weight-bold text-uppercase tracking-wider">Gestión de Talento</span>
        </div>
        <h1 class="text-h4 font-weight-bold">
          Candidatos y Postulantes
        </h1>
        <p class="text-caption text-medium-emphasis mb-0">
          Administre el banco de candidatos, su información de contacto y documentos de postulación.
        </p>
      </div>
      <div class="d-flex gap-2">
        <VBtn
          v-if="can('crear candidatos', 'Candidato')"
          color="primary"
          prepend-icon="tabler-plus"
          to="/admin/candidatos/create"
        >
          Nuevo candidato
        </VBtn>
      </div>
    </div>

    <!-- Mini KPIs superiores -->
    <VRow class="mb-5">
      <VCol
        cols="6"
        sm="4"
      >
        <VCard
          class="cursor-pointer"
          elevation="1"
          @click="filtros.estado = 'Activo'; filtrarTodo()"
        >
          <VCardText class="pa-4 d-flex align-center justify-space-between">
            <div>
              <span class="text-caption text-medium-emphasis">Activos</span>
              <h3 class="text-h5 font-weight-bold text-success mt-1">
                {{ metricas.activos }}
              </h3>
            </div>
            <VAvatar
              color="success"
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
        sm="4"
      >
        <VCard
          class="cursor-pointer"
          elevation="1"
          @click="filtros.estado = 'Descartado'; filtrarTodo()"
        >
          <VCardText class="pa-4 d-flex align-center justify-space-between">
            <div>
              <span class="text-caption text-medium-emphasis">Descartados</span>
              <h3 class="text-h5 font-weight-bold text-error mt-1">
                {{ metricas.descartados }}
              </h3>
            </div>
            <VAvatar
              color="error"
              variant="tonal"
              size="40"
              rounded
            >
              <VIcon
                icon="tabler-user-x"
                size="22"
              />
            </VAvatar>
          </VCardText>
        </VCard>
      </VCol>

      <VCol
        cols="12"
        sm="4"
      >
        <VCard elevation="1">
          <VCardText class="pa-4 d-flex align-center justify-space-between">
            <div>
              <span class="text-caption text-medium-emphasis">Total Candidatos</span>
              <h3 class="text-h5 font-weight-bold text-primary mt-1">
                {{ metricas.total }}
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
              placeholder="Buscar por nombre, correo..."
              clearable
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
            md="3"
          >
            <VAutocomplete
              v-model="filtros.estado"
              :items="estados"
              label="Estado"
              clearable
              chips
              @update:model-value="filtrarTodo"
            />
          </VCol>
          <VCol
            cols="12"
            sm="6"
            md="3"
          >
            <VAutocomplete
              v-model="filtros.nivel_academico"
              :items="nivelesAcademicos"
              label="Nivel académico"
              clearable
              chips
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
              @click="limpiar"
            >
              <VIcon>tabler-refresh</VIcon>
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

    <!-- MODO 1: Vista de Tarjetas -->
    <div v-if="vistaModo === 'tarjetas'">
      <VProgressLinear
        v-if="cargandoTarjetas"
        indeterminate
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
          <VCard
            class="h-100 d-flex flex-column transition-all"
            elevation="1"
            hover
          >
            <VCardItem>
              <div class="d-flex justify-space-between align-start mb-2">
                <VChip
                  :color="coloresEstado[c.estado] || 'secondary'"
                  size="small"
                  class="font-weight-bold"
                >
                  {{ c.estado }}
                </VChip>
                <span class="text-caption text-medium-emphasis">#{{ c.id }}</span>
              </div>
              <h2 class="text-h6 font-weight-bold mb-1">
                {{ c.nombres }} {{ c.apellidos }}
              </h2>
              <div class="d-flex align-center gap-1 text-caption text-medium-emphasis">
                <VIcon
                  icon="tabler-mail"
                  size="14"
                />
                <span>{{ c.correo }}</span>
              </div>
            </VCardItem>

            <VCardText class="flex-grow-1 pt-1">
              <div class="d-flex flex-column gap-1 text-caption bg-surface pa-3 rounded border">
                <div>
                  <strong>Municipio:</strong> {{ c.municipio?.nombre || 'Sin registrar' }}
                </div>
                <div>
                  <strong>Nivel académico:</strong> {{ c.nivel_academico || 'Sin registrar' }}
                </div>
                <div v-if="c.telefono">
                  <strong>Teléfono:</strong> {{ c.telefono }}
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
                :to="`/admin/candidatos/show/${c.id}`"
              >
                Expediente
              </VBtn>
              <div class="d-flex gap-1">
                <VBtn
                  v-if="can('editar candidatos', 'Candidato')"
                  icon="tabler-edit"
                  variant="text"
                  size="small"
                  color="warning"
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
          icon="tabler-users-group"
          size="48"
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
      </VCard>
    </div>

    <!-- MODO 2: Vista de Tabla Tradicional (DataTableComponent) -->
    <div v-else>
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
        <template #item.municipio="{ item }">
          {{ item.municipio?.nombre }}
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
        <template #item.acciones="{ item }">
          <VBtn
            v-if="can('ver candidatos', 'Candidato')"
            icon="tabler-eye"
            variant="text"
            size="small"
            title="Ver expediente"
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

    <!-- Modal Dinámico de Detalle Rápido -->
    <VDialog
      v-model="modalDetalle"
      max-width="650px"
    >
      <VCard v-if="candidatoSeleccionado">
        <VCardItem class="bg-primary text-white py-4">
          <div class="d-flex justify-space-between align-center">
            <div>
              <span class="text-caption text-white opacity-80 text-uppercase">Candidato #{{ candidatoSeleccionado.id }}</span>
              <h3 class="text-h6 text-white font-weight-bold mb-0">
                {{ candidatoSeleccionado.nombres }} {{ candidatoSeleccionado.apellidos }}
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
              :color="coloresEstado[candidatoSeleccionado.estado] || 'secondary'"
              size="small"
              class="font-weight-bold"
            >
              {{ candidatoSeleccionado.estado }}
            </VChip>
            <span class="text-caption text-medium-emphasis">
              {{ candidatoSeleccionado.correo }}
            </span>
          </div>

          <VRow dense>
            <VCol
              cols="12"
              md="6"
            >
              <strong>Teléfono:</strong> {{ candidatoSeleccionado.telefono || 'Sin registrar' }}
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <strong>Municipio:</strong> {{ candidatoSeleccionado.municipio?.nombre || 'Sin registrar' }}
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <strong>Nivel académico:</strong> {{ candidatoSeleccionado.nivel_academico || 'Sin registrar' }}
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <strong>Fuente:</strong> {{ candidatoSeleccionado.fuente_reclutamiento || 'Sin registrar' }}
            </VCol>
          </VRow>
        </VCardText>

        <VCardActions class="pa-4 pt-0">
          <VSpacer />
          <VBtn
            variant="tonal"
            color="primary"
            :to="`/admin/candidatos/show/${candidatoSeleccionado.id}`"
          >
            Ver expediente completo
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
