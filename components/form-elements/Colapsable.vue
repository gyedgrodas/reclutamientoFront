<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  titulo: String,
  abierto: Boolean,
  chipTexto: { type: String, default: null },
  chipColor: { type: String, default: 'primary' },
  componente: [String, Object],
  propsComponente: { type: Object, default: () => ({}) },
  collapseIcon: { type: String, default: 'tabler-minus' },
  expandIcon: { type: String, default: 'tabler-plus' },
  cargando: { type: Boolean, default: false },
})

const panelActivo = ref(props.abierto ? [0] : [])

watch(() => props.abierto, (val) => {
  panelActivo.value = val ? [0] : []
})

onMounted(() => {
  const hasSlotContent = !!getCurrentInstance()?.slots?.default
  if (hasSlotContent && props.componente) {
    console.warn(
      '[ColapsableDinamico] ⚠️ Se detectó que se usó simultáneamente el slot y la prop "componente". Se ignorará el componente dinámico y se usará el slot.'
    )
  }
})

defineExpose({
  panelActivo,
})

</script>
<template>
  <VExpansionPanels
    variant="accordion"
    class="expansion-panels-width-border"
     v-model="panelActivo"
  >
    <VExpansionPanel :value="0" elevation="0">
      <VExpansionPanelTitle :collapse-icon="collapseIcon" :expand-icon="expandIcon">
    <div class="d-flex justify-space-between w-100">
      <span>
      {{ titulo }}
      <VChip
      v-if="chipTexto"
      :color="chipColor"
      class="ml-2"
      size="small"
      :label="false"
      >
      {{ chipTexto }}
      </VChip>
      </span>
    </div>
      </VExpansionPanelTitle>

      <VExpansionPanelText>
        <slot v-if="$slots.default" />
        <component v-else-if="componente" :is="componente" v-bind="propsComponente" />
      </VExpansionPanelText>
    </VExpansionPanel>
    <VOverlay
      :model-value="cargando"
      class="align-center justify-center"
      contained
      persistent
      scroll-strategy="none"
    >
      <div class="overlay-content text-center align-center">

        <VProgressCircular
          class="progress-circle"
          color="primary"
          indeterminate
          size="32"
        />

      </div>
    </VOverlay>
  </VExpansionPanels>
</template>
