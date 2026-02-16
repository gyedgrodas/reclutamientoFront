<script setup lang="ts">
interface PropsInterface {
  mostrarModal: boolean
  componente?: string | object
  titulo?: string
  subtitulo?: string
}

interface EmitsInterface {
  (e: 'update:mostrarModal', value: boolean): void
}
const attrs = useAttrs()
const props = defineProps<PropsInterface>()
const emit = defineEmits<EmitsInterface>()

const puedeMostrarModal = computed<boolean>({
  get: () => props.mostrarModal,
  set: (value: boolean) => emit('update:mostrarModal', value),
})

watch(() => props.mostrarModal, (nuevoValor: boolean) => {
  puedeMostrarModal.value = nuevoValor
})

onMounted(() => {
  const hasSlotContent = !!getCurrentInstance()?.slots?.default
  if (hasSlotContent && props.componente) {
    console.warn(
      '[ColapsableDinamico] ⚠️ Se detectó que se usó simultáneamente el slot y la prop "componente". Se ignorará el componente dinámico y se usará el slot.'
    )
  }
})
</script>

<template>
  <VDialog
    v-model="puedeMostrarModal"
    :title="titulo || 'Modal Básico'"
    v-bind="attrs"
    @click:outside="false"
  >
    <DialogCloseBtn @click="puedeMostrarModal = false" />
    <VCard :title="props.titulo || 'Modal Básico'">
    <template #subtitle v-if="props.subtitulo">
      {{ props.subtitulo || 'Subtitulo' }}
    </template>
      <VCardText>
        <slot v-if="$slots.default" />
        <component v-else-if="componente" :is="componente" v-bind="propsComponente" />
      </VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped lang="scss">

</style>
