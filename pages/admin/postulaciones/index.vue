<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type { ColumnaInterface } from '@/types/sistema/DataTableTypes'
import type DataTableComponent from '@/components/DataTableComponent.vue'
import type { Postulacion } from '@/types/reclutamiento'
import { MODEL_TYPE_POSTULACION } from '@/constantes/ModelTypes'
import HistorialPostulacion from '@/views/pages/reclutamiento/postulaciones/HistorialPostulacion.vue'

definePageMeta({
  navActiveLink: 'admin-postulaciones',
  middleware: 'permissions',
  action: 'ver postulaciones',
  subject: 'Postulacion',
})

const { deleted } = useClienteRequest()
const { showToastSuccess, preguntaEliminar } = useToast()
const dataTable = ref<InstanceType<typeof DataTableComponent> | null>(null)
const filtros = ref({ estado: null as string | null, etapa_reclutamiento_id: null as number | null, vacante_id: null as number | null })
const seleccionada = ref<Postulacion | null>(null)
const detalle = ref(false)

const estados = ['En proceso', 'Descartada', 'Contratada', 'Retirada'].map(value => ({ title: value, value }))
const etapas = ref<any[]>([])
const vacantes = ref<any[]>([])

const cargarFiltros = async () => {
  const { get } = useClienteRequest()
  try {
    const [etapasResponse, vacantesResponse] = await Promise.all([
      get<any>('/api/catalogo/etapas-reclutamiento?limit=100'),
      get<any>('/api/vacantes?include=puesto,unidad&page[size]=100'),
    ])
    etapas.value = Array.isArray(etapasResponse.data) ? etapasResponse.data : (etapasResponse.data?.data || [])
    vacantes.value = Array.isArray(vacantesResponse.data) ? vacantesResponse.data : (vacantesResponse.data?.data || [])
  }
  catch (error) {
    manejaError(error)
  }
}

const columnas = computed<ColumnaInterface[]>(() => [
  { title: 'ID', key: 'id' },
  { title: 'Candidato', key: 'candidato', sortable: false },
  { title: 'Vacante', key: 'vacante', sortable: false, OpcionesFiltro: { campo: 'vacante_id', operador: '=', valor: filtros.value.vacante_id } },
  { title: 'Etapa', key: 'etapa_reclutamiento', sortable: false, OpcionesFiltro: { campo: 'etapa_reclutamiento_id', operador: '=', valor: filtros.value.etapa_reclutamiento_id } },
  { title: 'Responsable', key: 'responsable', sortable: false },
  { title: 'Estado', key: 'estado', OpcionesFiltro: { operador: '=', valor: filtros.value.estado } },
  { title: 'Fecha', key: 'fecha_postulacion' },
  { title: 'Acciones', key: 'acciones', sortable: false },
])

const eliminar = async (id: number) => {
  if (!await preguntaEliminar('¿Desea eliminar esta postulación?'))
    return
  try {
    const respuesta = await deleted<{ message: string }>(`/api/postulaciones/${id}`)
    showToastSuccess(respuesta.message)
    await dataTable.value?.filtrar()
  }
  catch (error) {
    manejaError(error)
  }
}

const filtrar = () => dataTable.value?.filtrar()
const limpiar = () => {
  filtros.value = { estado: null, etapa_reclutamiento_id: null, vacante_id: null }
  filtrar()
}

onMounted(cargarFiltros)
</script>

<template>
  <div>
    <div class="d-flex flex-wrap justify-space-between align-center mb-6 gap-3">
      <div>
        <span class="text-caption text-primary font-weight-bold text-uppercase">Gestión de Talento</span>
        <h1 class="text-h4 font-weight-bold">Postulaciones</h1>
        <p class="text-caption text-medium-emphasis mb-0">Administre candidatos y el avance de sus procesos de selección.</p>
      </div>
      <VBtn v-if="can('crear postulaciones', 'Postulacion')" color="primary" prepend-icon="tabler-plus" to="/admin/postulaciones/create">
        Nueva postulación
      </VBtn>
    </div>
    <VCard class="mb-5">
      <VCardText>
        <VRow>
          <VCol cols="12" md="3"><AppSelect v-model="filtros.estado" label="Estado" :items="estados" clearable @update:model-value="filtrar" /></VCol>
          <VCol cols="12" md="4"><AppAutocomplete v-model="filtros.etapa_reclutamiento_id" label="Etapa" :items="etapas" item-title="nombre" item-value="id" clearable @update:model-value="filtrar" /></VCol>
          <VCol cols="12" md="4"><AppAutocomplete v-model="filtros.vacante_id" label="Vacante" :items="vacantes" item-title="id" item-value="id" clearable @update:model-value="filtrar"><template #item="{ props: itemProps, item }"><VListItem v-bind="itemProps" :title="`#${item.raw.id} · ${item.raw.puesto?.nombre || 'Vacante'}`" /></template></AppAutocomplete></VCol>
          <VCol cols="12" md="1" class="d-flex align-center justify-end"><VBtn icon="tabler-refresh" color="secondary" variant="tonal" @click="limpiar" /></VCol>
        </VRow>
      </VCardText>
    </VCard>
    <DataTableComponent
      ref="dataTable"
      :model="MODEL_TYPE_POSTULACION"
      :columnas="columnas"
      :relaciones="['candidato', 'vacante.puesto', 'vacante.unidad', 'etapaReclutamiento', 'responsable']"
      :botones="['reiniciar']"
      endpoint="/api/postulaciones"
      placeholder="No se encontraron postulaciones"
    >
      <template #item.candidato="{ item }">{{ item.candidato ? `${item.candidato.nombres} ${item.candidato.apellidos}` : '—' }}</template>
      <template #item.vacante="{ item }">#{{ item.vacante_id }} · {{ item.vacante?.puesto?.nombre || '—' }}</template>
      <template #item.etapa_reclutamiento="{ item }"><VChip size="small" color="primary" variant="tonal">{{ (item.etapa_reclutamiento || item.etapaReclutamiento)?.nombre || '—' }}</VChip></template>
      <template #item.responsable="{ item }">{{ item.responsable ? `${item.responsable.nombres || ''} ${item.responsable.apellidos || ''}`.trim() : '—' }}</template>
      <template #item.estado="{ item }"><VChip size="small" :color="item.estado === 'Contratada' ? 'success' : item.estado === 'Descartada' ? 'error' : 'warning'">{{ item.estado }}</VChip></template>
      <template #item.acciones="{ item }">
        <VBtn v-if="can('ver postulaciones', 'Postulacion')" icon="tabler-eye" variant="text" size="small" title="Ver" @click="seleccionada = item; detalle = true" />
        <VBtn v-if="can('editar postulaciones', 'Postulacion')" icon="tabler-edit" variant="text" size="small" title="Editar" :to="`/admin/postulaciones/edit/${item.id}`" />
        <VBtn v-if="can('eliminar postulaciones', 'Postulacion')" icon="tabler-trash" color="error" variant="text" size="small" title="Eliminar" @click="eliminar(item.id)" />
      </template>
    </DataTableComponent>
    <VDialog v-model="detalle" max-width="680" scrollable>
      <VCard v-if="seleccionada">
        <VCardTitle>Postulación #{{ seleccionada.id }}</VCardTitle>
        <VCardText>
          <p><strong>Candidato:</strong> {{ seleccionada.candidato?.nombres }} {{ seleccionada.candidato?.apellidos }}</p>
          <p><strong>Vacante:</strong> #{{ seleccionada.vacante_id }} · {{ seleccionada.vacante?.puesto?.nombre || '—' }}</p>
          <p><strong>Etapa:</strong> {{ (seleccionada.etapa_reclutamiento || seleccionada.etapaReclutamiento)?.nombre || '—' }}</p>
          <p><strong>Observaciones generales:</strong> {{ seleccionada.observaciones || '—' }}</p>
          <HistorialPostulacion
            v-if="detalle && can('ver postulaciones', 'Postulacion')"
            :key="seleccionada.id"
            :postulacion-id="seleccionada.id"
          />
        </VCardText>
        <VCardActions class="justify-end">
          <VBtn @click="detalle = false">
            Cerrar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </div>
</template>
