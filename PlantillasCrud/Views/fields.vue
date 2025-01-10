<script setup lang="ts">

import type {VForm} from "vuetify/lib/components/VForm";

const data = ref({})

const isFormValid = ref(false)

const refForm = ref<VForm>()

interface Emit {
  // (e: 'update:esVisible', value: boolean): void
  (e: 'emitirDatos', value: any): void
}

interface Props {
  esVisible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const onSubmit = () => {
  refForm.value?.validate().then(({valid}) => {
    if (valid) {
      // // Formatea los datos según JSON:API
      // const data = {
      //   usuario_dominio: usuario_dominio.value,
      //   cif: cif.value,
      //   codigo_bankworks: codigo_bankworks.value,
      //   codigo_ejecutivo: codigo_ejecutivo.value,
      //   nombre: nombre.value,
      //   apellido: apellido.value,
      //   email: email.value,
      //   fecha_labores: fecha_labores.value,
      //   estado: estado.value,
      //   password: password.value,
      //   nuevoPassword: nuevoPassword.value,
      // }
      //
      // Emite la data formateada
      emit('emitirDatos', data)

      nextTick(() => {
        refForm.value?.reset()
        refForm.value?.resetValidation()
      })
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
          to=" {{ directory }} /"
        >
          Cancel
        </VBtn>
      </VCol>
    </VRow>

  </VForm>


</template>

<style scoped lang="scss">

</style>
