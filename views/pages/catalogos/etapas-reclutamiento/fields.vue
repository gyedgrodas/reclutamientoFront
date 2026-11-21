<script setup lang="ts">
import { requiredValidator } from '@core/utils/validators'
import type { DatosEtapaReclutamiento, EtapaReclutamiento } from '@/types/catalogos'

const props = defineProps<{ etapa?: EtapaReclutamiento; guardando: boolean }>()
const emit = defineEmits<{ (e: 'guardar', datos: DatosEtapaReclutamiento): void }>()
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)

const datos = reactive<DatosEtapaReclutamiento>({
  nombre: props.etapa?.nombre || '',
  orden: props.etapa?.orden ?? null,
  estado_publico: props.etapa?.estado_publico || '',
  es_terminal: !!props.etapa?.es_terminal,
  estado: props.etapa?.estado || 'Activo',
})

const guardar = async () => {
  if (!(await form.value?.validate())?.valid)
    return
  emit('guardar', {
    ...datos,
    orden: Number(datos.orden),
    estado_publico: datos.estado_publico || null,
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
          maxlength="80"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.orden"
          label="Orden"
          type="number"
          min="1"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.estado_publico"
          label="Estado público (opcional)"
          maxlength="100"
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
      <VCol cols="12">
        <VSwitch
          v-model="datos.es_terminal"
          label="Etapa terminal"
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
          to="/admin/catalogos/etapas-reclutamiento"
        >
          Cancelar
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
</template>
