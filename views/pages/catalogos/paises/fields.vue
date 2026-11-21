<script setup lang="ts">
import { requiredValidator } from '@core/utils/validators'
import type { DatosPais, Pais } from '@/types/catalogos'

const props = defineProps<{ pais?: Pais; guardando: boolean }>()
const emit = defineEmits<{ (e: 'guardar', datos: DatosPais): void }>()
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)

const datos = reactive<DatosPais>({
  nombre: props.pais?.nombre || '',
  codigo_iso2: props.pais?.codigo_iso2 || '',
  codigo_iso3: props.pais?.codigo_iso3 || '',
  estado: props.pais?.estado || 'Activo',
})

const guardar = async () => {
  if (!(await form.value?.validate())?.valid)
    return
  emit('guardar', {
    ...datos,
    codigo_iso2: datos.codigo_iso2.toUpperCase(),
    codigo_iso3: datos.codigo_iso3.toUpperCase(),
  })
}
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
        <AppTextField
          v-model="datos.codigo_iso2"
          label="Código ISO2"
          maxlength="2"
          style="text-transform: uppercase;"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.codigo_iso3"
          label="Código ISO3"
          maxlength="3"
          style="text-transform: uppercase;"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        class="d-flex gap-2"
      >
        <VBtn
          type="submit"
          :loading="guardando"
          :disabled="guardando"
        >
          Guardar
        </VBtn>
        <VBtn
          color="secondary"
          variant="tonal"
          to="/admin/catalogos/paises"
        >
          Cancelar
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
</template>
