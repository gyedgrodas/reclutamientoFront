<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type { ColumnaInterface } from '@/types/sistema/DataTableTypes'
import type DataTableComponent from '@/components/DataTableComponent.vue'
import { MODEL_TYPE_MUNICIPIO } from '@/constantes/ModelTypes'

definePageMeta({
  navActiveLink: 'admin-catalogos-municipios',
  middleware: 'permissions',
  action: 'ver municipios',
  subject: 'Municipio',
})

const { deleted } = useClienteRequest()
const { showToastSuccess, preguntaEliminar } = useToast()
const dataTable = ref<InstanceType<typeof DataTableComponent> | null>(null)
const filtros = ref({ nombre: '', estado: null as string | null })
const estados = [{ title: 'Activo', value: 'Activo' }, { title: 'Inactivo', value: 'Inactivo' }]

const columnas = computed<ColumnaInterface[]>(() => [
  { title: 'ID', key: 'id' },
  { title: 'Nombre', key: 'nombre', OpcionesFiltro: { operador: 'like', valor: filtros.value.nombre } },
  { title: 'Departamento', key: 'departamento', sortable: false },
  { title: 'País', key: 'pais', sortable: false },
  { title: 'Estado', key: 'estado', OpcionesFiltro: { operador: '=', valor: filtros.value.estado } },
  { title: 'Acciones', key: 'acciones', sortable: false },
])

const limpiar = () => {
  filtros.value = { nombre: '', estado: null }
  dataTable.value?.filtrar()
}

const eliminar = async (id: number) => {
  if (!await preguntaEliminar('¿Desea eliminar este municipio?'))
    return

  try {
    const respuesta = await deleted<{ message: string }>(`/api/catalogo/municipios/${id}`)

    showToastSuccess(respuesta.message)
    await dataTable.value?.filtrar()
  }
  catch (error) {
    manejaError(error)
  }
}
</script>

<template>
  <div class="d-flex flex-wrap justify-space-between align-center mb-6">
    <h1>Municipios</h1>
    <VBtn
      v-if="can('crear municipios', 'Municipio')"
      prepend-icon="tabler-plus"
      to="/admin/catalogos/municipios/create"
    >
      Nuevo municipio
    </VBtn>
  </div>
  <VCard class="mb-4">
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          md="6"
        >
          <AppTextField
            v-model="filtros.nombre"
            label="Nombre"
          />
        </VCol>
        <VCol
          cols="12"
          md="6"
        >
          <AppSelect
            v-model="filtros.estado"
            :items="estados"
            label="Estado"
            clearable
          />
        </VCol>
        <VCol
          cols="12"
          class="d-flex gap-2"
        >
          <VBtn @click="dataTable?.filtrar()">
            Filtrar
          </VBtn>
          <VBtn
            color="secondary"
            variant="tonal"
            @click="limpiar"
          >
            Limpiar
          </VBtn>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
  <DataTableComponent
    ref="dataTable"
    :model="MODEL_TYPE_MUNICIPIO"
    :columnas="columnas"
    :relaciones="['departamento.pais']"
    :botones="['reiniciar']"
    :cantidad-por-pagina="10"
    endpoint="/api/catalogo/municipios"
    placeholder="No se encontraron municipios"
  >
    <template #item.departamento="{ item }">
      {{ item.departamento?.nombre }}
    </template>
    <template #item.pais="{ item }">
      {{ item.departamento?.pais?.nombre }}
    </template>
    <template #item.estado="{ item }">
      <VChip
        :color="item.estado === 'Activo' ? 'success' : 'secondary'"
        size="small"
      >
        {{ item.estado }}
      </VChip>
    </template>
    <template #item.acciones="{ item }">
      <VBtn
        v-if="can('ver municipios', 'Municipio')"
        icon="tabler-eye"
        variant="text"
        title="Ver"
        :to="`/admin/catalogos/municipios/show/${item.id}`"
      />
      <VBtn
        v-if="can('editar municipios', 'Municipio')"
        icon="tabler-edit"
        variant="text"
        title="Editar"
        :to="`/admin/catalogos/municipios/edit/${item.id}`"
      />
      <VBtn
        v-if="can('eliminar municipios', 'Municipio')"
        icon="tabler-trash"
        variant="text"
        title="Eliminar"
        @click="eliminar(item.id)"
      />
    </template>
  </DataTableComponent>
</template>
