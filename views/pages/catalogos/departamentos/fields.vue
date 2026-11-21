<script setup lang="ts">
import { requiredValidator } from '@core/utils/validators'
import type { DatosDepartamento, Departamento, Pais } from '@/types/catalogos'

const props = defineProps<{ departamento?: Departamento; guardando: boolean }>()
const emit = defineEmits<{ (e: 'guardar', datos: DatosDepartamento): void }>()
const { getCatalogos } = useCatalogo()
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)

const datos = reactive<DatosDepartamento>({
  nombre: props.departamento?.nombre || '',
  pais_id: props.departamento?.pais_id ?? null,
  estado: props.departamento?.estado || 'Activo',
})

const paises = ref<Pais[]>([])
const cargandoCatalogos = ref(false)
const catalogosListos = ref(false)

// El endpoint del catálogo puede responder el arreglo directo o el paginador de Laravel
const comoLista = (valor: any): any[] => Array.isArray(valor) ? valor : (valor?.data ?? [])

const cargarCatalogos = async () => {
  cargandoCatalogos.value = true
  try {
    const catalogos = await getCatalogos(['paises'])

    paises.value = comoLista(catalogos.paises)
    catalogosListos.value = true
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargandoCatalogos.value = false
  }
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
        <AppAutocomplete
          v-model="datos.pais_id"
          label="País"
          :items="paises"
          item-title="nombre"
          item-value="id"
          :loading="cargandoCatalogos"
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
        v-if="!catalogosListos && !cargandoCatalogos"
        cols="12"
      >
        <VAlert
          type="error"
          variant="tonal"
        >
          No fue posible cargar los países. <VBtn
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
          to="/admin/catalogos/departamentos"
        >
          Cancelar
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
</template>
