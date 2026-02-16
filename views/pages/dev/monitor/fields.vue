<script setup lang="ts">
import type { VForm } from 'vuetify/lib/components/VForm'
import type { JobInterface } from '@/types/dev/monitor/types'


interface Emit {
  (e: 'emitirDatos', value: JobInterface ): void
}
interface PropsInterface {
  item: JobInterface | null
}

const props = defineProps<PropsInterface>()
const isFormValid = ref(false)
const refForm = ref<VForm>()
const emit = defineEmits<Emit>()
const data = ref<JobInterface>(
  { job: null,
cola: null,
tipo: null,
reintentos: null,
max_reintentos: null,
fecha: null }
)

const onSubmit = () => {
  refForm.value?.validate().then(({valid}) => {
    if (valid) {
      emit('emitirDatos', data.value)
    }
  })
}

if (props.item)
  data.value = props.item
</script>

<template>

  <VForm
    ref="refForm"
    v-model="isFormValid"
    @submit.prevent="onSubmit"
  >
    <VRow>
    
    <VCol cols="12" md="6">
      <AppTextField
        v-model="data.job"
        :rules="[requiredValidator]"
        label="Job"
        placeholder="Ingrese Job"
      />
    </VCol>
  
    <VCol cols="12" md="6">
      <AppTextField
        v-model="data.cola"
        :rules="[requiredValidator]"
        label="Cola"
        placeholder="Ingrese Cola"
      />
    </VCol>
  
    <VCol cols="12" md="6">
      <AppTextField
        v-model="data.tipo"
        :rules="[requiredValidator]"
        label="Tipo"
        placeholder="Ingrese Tipo"
      />
    </VCol>
  
    <VCol cols="12" md="6">
      <AppTextField
        v-model="data.reintentos"
        :rules="[requiredValidator]"
        label="Reintentos"
        placeholder="Ingrese Reintentos"
      />
    </VCol>
  
    <VCol cols="12" md="6">
      <AppTextField
        v-model="data.max_reintentos"
        :rules="[requiredValidator]"
        label="Max Reintentos"
        placeholder="Ingrese Max Reintentos"
      />
    </VCol>
  
    <VCol cols="12" md="6">
      <AppTextField
        v-model="data.fecha"
        :rules="[requiredValidator]"
        label="Fecha"
        placeholder="Ingrese Fecha"
      />
    </VCol>
  
      <VCol cols="12" md=12 class="text-end">
        <VBtn
          type="reset"
          color="secondary"
          to="/dev/monitor"
          class="mr-2"
        >
          <VIcon
            icon="tabler-cancel"
            start size="22"
          />
          Cancelar
        </VBtn>
        <VBtn
          type="submit"
          class="me-3"
        >
          <VIcon
            icon="tabler-device-floppy"
            start size="22"
          />
          Guardar
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
</template>

<style scoped lang="scss">

</style>
