<script setup lang="ts">
import { computed } from 'vue'
import { construirIsoGuatemala, extraerFechaHoraGuatemala } from '@/utils/entrevistasGuatemala'

const props = defineProps<{ url?: string | null; limite?: string | null; disabled?: boolean }>()

const emit = defineEmits<{
  (e: 'update:url', valor: string | null): void
  (e: 'update:limite', valor: string | null): void
}>()

const fechaLocal = computed({
  get: () => {
    const partes = extraerFechaHoraGuatemala(props.limite)

    return partes.fecha ? `${partes.fecha}T${partes.hora}` : ''
  },
  set: (valor: string) => {
    const [fecha, hora] = valor.split('T')

    emit('update:limite', fecha && hora ? construirIsoGuatemala(fecha, hora) : null)
  },
})
</script>

<template>
  <div class="tt-detail-box">
    <strong>Invitación a evaluación psicométrica</strong>
    <p class="text-caption text-medium-emphasis mt-1">
      Al guardar esta etapa se prepara un correo con el enlace y el plazo. Horario de Guatemala.
    </p>
    <VRow dense>
      <VCol cols="12">
        <AppTextField
          :model-value="url"
          label="Enlace de la prueba (HTTPS)"
          type="url"
          :disabled="disabled"
          @update:model-value="emit('update:url', $event || null)"
        />
      </VCol>
      <VCol cols="12">
        <AppTextField
          v-model="fechaLocal"
          label="Fecha y hora límite"
          type="datetime-local"
          :disabled="disabled"
        />
      </VCol>
    </VRow>
  </div>
</template>
