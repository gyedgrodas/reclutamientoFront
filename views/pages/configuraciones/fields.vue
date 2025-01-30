<script setup lang="ts">

import type {VForm} from "vuetify/lib/components/VForm";

const isFormValid = ref(false)

const refForm = ref<VForm>()

import type { ConfiguracionInterface } from '@/types/configuraciones/index.ts';

const data = ref( <ConfiguracionInterface>
  { nombre: null,
valor: null,
cifrado: null,
tipo: null,
grupo: null,
descripcion: null,
})


interface Emit {

  (e: 'emitirDatos', value: ConfiguracionInterface ): void

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
      emit('emitirDatos', data.value)

    }

  })

}

const tipos = ['boolean', 'float', 'integer', 'string']
const cifrado = ['Si', 'No']

</script>

<template>

  <VForm
    ref="refForm"
    v-model="isFormValid"
    @submit.prevent="onSubmit"
  >
    <VRow>

               <VCol cols="12"
                md="6"
               >
                <AppTextField
                  v-model="data.nombre"
                  :rules="[requiredValidator]"
                  label="Nombre"
                  placeholder="Ingrese Nombre"
                />
              </VCol>

               <VCol cols="12"
                md="6"
               >
                <AppTextField
                  v-model="data.valor"
                  :rules="[requiredValidator]"
                  label="Valor"
                  placeholder="Ingrese Valor"
                />
              </VCol>

              <VCol
                cols="12"
                md="6"
              >
                <AppAutocomplete
                  v-model="data.tipo"
                  :items="tipos"
                  :rules="[requiredValidator]"
                  label="Tipos"
                  placeholder="Seleccione Tipo"
                />
              </VCol>

               <VCol cols="12"
                md="6"
               >
                <AppTextField
                  v-model="data.grupo"
                  :rules="[requiredValidator]"
                  label="Grupo"
                  placeholder="Ingrese Grupo"
                />
              </VCol>

              <VCol cols="12"
                    md="12"
              >
                <AppTextarea
                  v-model="data.descripcion"
                  :rules="[requiredValidator]"
                  label="Descripción"
                  placeholder="Ingrese Descripción"
                />
              </VCol>

              <VCol cols="12"
                    md="6"
              >
                <AppAutocomplete
                  v-model="data.cifrado"
                  :items="cifrado"
                  :rules="[requiredValidator]"
                  label="Cifrado"
                  placeholder="Seleccione Cifrado"
                />
              </VCol>

        <VCol cols="12">
        <VBtn
          type="submit"
          class="me-3"
        >
          Guardar
        </VBtn>
        <VBtn
          type="reset"
          variant="tonal"
          color="error"
          to="/configuraciones"
        >
          Cancelar
        </VBtn>
      </VCol>
    </VRow>

  </VForm>

</template>

<style scoped lang="scss">

</style>
