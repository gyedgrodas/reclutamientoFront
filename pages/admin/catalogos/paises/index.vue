<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import type { ColumnaInterface } from '@/types/sistema/DataTableTypes'
import type DataTableComponent from '@/components/DataTableComponent.vue'
import { MODEL_TYPE_PAIS } from '@/constantes/ModelTypes'

definePageMeta({
  navActiveLink: 'admin-catalogos-paises',
  middleware: 'permissions',
  action: 'ver paises',
  subject: 'Pais',
})

const { deleted } = useClienteRequest()
const { showToastSuccess, preguntaEliminar } = useToast()
const dataTable = ref<InstanceType<typeof DataTableComponent> | null>(null)
const filtros = ref({ nombre: '', codigo_iso2: '', codigo_iso3: '', estado: null as string | null })
const estados = [{ title: 'Activo', value: 'Activo' }, { title: 'Inactivo', value: 'Inactivo' }]

const columnas = computed<ColumnaInterface[]>(() => [
  { title: 'ID', key: 'id' },
  { title: 'Nombre', key: 'nombre', OpcionesFiltro: { operador: 'like', valor: filtros.value.nombre } },
  { title: 'Código ISO2', key: 'codigo_iso2', OpcionesFiltro: { operador: 'like', valor: filtros.value.codigo_iso2 } },
  { title: 'Código ISO3', key: 'codigo_iso3', OpcionesFiltro: { operador: 'like', valor: filtros.value.codigo_iso3 } },
  { title: 'Estado', key: 'estado', OpcionesFiltro: { operador: '=', valor: filtros.value.estado } },
  { title: 'Acciones', key: 'acciones', sortable: false },
])

const limpiar = () => {
  filtros.value = { nombre: '', codigo_iso2: '', codigo_iso3: '', estado: null }
  dataTable.value?.filtrar()
}

const eliminar = async (id: number) => {
  if (!await preguntaEliminar('¿Desea eliminar este país?'))
    return

  try {
    const respuesta = await deleted<{ message: string }>(`/api/catalogo/paises/${id}`)

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
    <h1>Países</h1>
    <VBtn
      v-if="can('crear paises', 'Pais')"
      prepend-icon="tabler-plus"
      to="/admin/catalogos/paises/create"
    >
      Nuevo país
    </VBtn>
  </div>
  <VCard class="mb-4">
    <VCardText>
      <VRow>
        <VCol
          cols="12"
          md="3"
        >
          <AppTextField
            v-model="filtros.nombre"
            label="Nombre"
          />
        </VCol>
        <VCol
          cols="12"
          md="3"
        >
          <AppTextField
            v-model="filtros.codigo_iso2"
            label="Código ISO2"
          />
        </VCol>
        <VCol
          cols="12"
          md="3"
        >
          <AppTextField
            v-model="filtros.codigo_iso3"
            label="Código ISO3"
          />
        </VCol>
        <VCol
          cols="12"
          md="3"
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
    :model="MODEL_TYPE_PAIS"
    :columnas="columnas"
    :botones="['reiniciar']"
    :cantidad-por-pagina="10"
    endpoint="/api/catalogo/paises"
    placeholder="No se encontraron países"
  >
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
        v-if="can('ver paises', 'Pais')"
        icon="tabler-eye"
        variant="text"
        title="Ver"
        :to="`/admin/catalogos/paises/show/${item.id}`"
      />
      <VBtn
        v-if="can('editar paises', 'Pais')"
        icon="tabler-edit"
        variant="text"
        title="Editar"
        :to="`/admin/catalogos/paises/edit/${item.id}`"
      />
      <VBtn
        v-if="can('eliminar paises', 'Pais')"
        icon="tabler-trash"
        variant="text"
        title="Eliminar"
        @click="eliminar(item.id)"
      />
    </template>
  </DataTableComponent>
</template>
