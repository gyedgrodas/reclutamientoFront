<script setup lang="ts">

import type {VForm} from "vuetify/lib/components/VForm";

const isFormValid = ref(false)

const refForm = ref<VForm>()

// import { {{ model }} } from '@/pages/{{ modelPlural }}/Interface.ts';

const data = ref({})

interface Emit {

  (e: 'emitirDatos', value: any): void

}

const props = defineProps({
    item: {
      type: Object || null,
      default: null
    }
  }
)
const emit = defineEmits<Emit>()

if (props.item) {
  data.value = props.item
}

const onSubmit = () => {

  refForm.value?.validate().then(({valid}) => {

    if (valid) {

      emit('emitirDatos', data)

    }

  })

}

</script>

<template>

  <VForm
    ref="refForm"
    v-model="isFormValid"
    @submit.prevent="onSubmit"
  >
    <VRow>
    {{ inputsFormulario }}
      <VCol cols="12">
        <VBtn
          type="submit"
          class="me-3"
        >
          Submit
        </VBtn>
        <VBtn
          type="reset"
          variant="tonal"
          color="error"
          to="/{{ directory }}"
        >
          Cancel
        </VBtn>
      </VCol>
    </VRow>

  </VForm>

</template>

<style scoped lang="scss">

</style>
