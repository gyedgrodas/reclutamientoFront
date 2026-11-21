<script setup lang="ts">
import { requiredValidator } from '@core/utils/validators'
import type { DatosMunicipio, Departamento, Municipio, Pais } from '@/types/catalogos'

const props = defineProps<{ municipio?: Municipio; guardando: boolean }>()
const emit = defineEmits<{ (e: 'guardar', datos: DatosMunicipio): void }>()
const { getCatalogos } = useCatalogo()
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)

const datos = reactive<DatosMunicipio>({
  nombre: props.municipio?.nombre || '',
  departamento_id: props.municipio?.departamento_id ?? null,
  estado: props.municipio?.estado || 'Activo',
})

const paises = ref<Pais[]>([])
const departamentos = ref<Departamento[]>([])
const paisId = ref<number | null>(null)
const cargandoCatalogos = ref(false)
const catalogosListos = ref(false)

// El endpoint del catálogo puede responder el arreglo directo o el paginador de Laravel
const comoLista = (valor: any): any[] => Array.isArray(valor) ? valor : (valor?.data ?? [])

const departamentosFiltrados = computed(() =>
  paisId.value ? departamentos.value.filter(departamento => departamento.pais_id === paisId.value) : departamentos.value,
)

const cargarCatalogos = async () => {
  cargandoCatalogos.value = true
  try {
    const catalogos = await getCatalogos(['paises', 'departamentos'])

    paises.value = comoLista(catalogos.paises)
    departamentos.value = comoLista(catalogos.departamentos)
    paisId.value = departamentos.value.find(departamento => departamento.id === datos.departamento_id)?.pais_id ?? null
    catalogosListos.value = true
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargandoCatalogos.value = false
  }
}

const alCambiarPais = () => {
  const actual = departamentos.value.find(departamento => departamento.id === datos.departamento_id)

  if (actual && paisId.value && actual.pais_id !== paisId.value)
    datos.departamento_id = null
}

const guardar = async () => {
  if (!(await form.value?.validate())?.valid || !catalogosListos.value)
    return
  emit('guardar', { ...datos })
}

onMounted(cargarCatalogos)
</script>

<template>
  <VForm
    ref="form"
    @submit.prevent="guardar"
  >
    <VRow>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.nombre"
          label="Nombre"
          maxlength="100"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppSelect
          v-model="datos.estado"
          label="Estado"
          :items="[{ title: 'Activo', value: 'Activo' }, { title: 'Inactivo', value: 'Inactivo' }]"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppAutocomplete
          v-model="paisId"
          label="País (filtro)"
          :items="paises"
          item-title="nombre"
          item-value="id"
          clearable
          :loading="cargandoCatalogos"
          @update:model-value="alCambiarPais"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppAutocomplete
          v-model="datos.departamento_id"
          label="Departamento"
          :items="departamentosFiltrados"
          item-title="nombre"
          item-value="id"
          :loading="cargandoCatalogos"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        v-if="!catalogosListos && !cargandoCatalogos"
        cols="12"
      >
        <VAlert
          type="error"
          variant="tonal"
        >
          No fue posible cargar los departamentos. <VBtn
            variant="text"
            @click="cargarCatalogos"
          >
            Reintentar
          </VBtn>
        </VAlert>
      </VCol>
      <VCol
        cols="12"
        class="d-flex gap-2"
      >
        <VBtn
          type="submit"
          :loading="guardando"
          :disabled="guardando || !catalogosListos"
        >
          Guardar
        </VBtn>
        <VBtn
          color="secondary"
          variant="tonal"
          to="/admin/catalogos/municipios"
        >
          Cancelar
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
</template>
