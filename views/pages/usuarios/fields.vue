<script setup lang="ts">

import type {VForm} from "vuetify/lib/components/VForm";

const isFormValid = ref(false)

const refForm = ref<VForm>()

import type { UsuarioInterface } from '@/types/usuarios/index.ts';
import FormularioColapsable from "@/views/pages/usuarios/FormularioColapsable.vue";
const items = ['California', 'Colorado', 'Florida', 'Georgia', 'Texas', 'Wyoming']

const data = ref( <UsuarioInterface>
  {


    usuario_dominio: null,
    cif: null,
    asociado_id: null,
    codigo_bankworks: null,
    codigo_ejecutivo: null,
    fecha_labores: null,
    email: null,
    nombre: null,
    apellido: null,
    password: '$2y$12$pKyetm.tWIymTgxGKGWyeOKrZLz8oOXuLZvODfBl5odH8LJZNF0sy',
    estado: null,
    nuevoPassword: 0,
    fecha_entra_vacaciones: null,
    fecha_sale_vaciones: null,
    puesto_id: null,
    region_id: null,
    gerencia_id: null,
    revisor_id: null,
    unidad_id: null,
    fecha_puestoactual: null,
    dpi: null,
    categoria_oficial_id: null,
    numero_cuenta_comision: null,
    solicitudcredito_verificador: 0,
    solicitudcredito_gestor: 0,
    solicitudcredito_operador: 0,
    solicitudcredito_analista: 0,
    cola_solitudes_analisis_operador_formalizacion: 0,
    cola_solitudes_analisis_gestor_formalizacion: 0,
    ctc_ventas: null,
    ctc_sclientes: null,
    ctc_cobros: null,
    gestiones_crm_vencidas: 0
  }
)

interface Emit {

  (e: 'emitirDatos', value: UsuarioInterface ): void

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
  console.log('props', props.item)
  data.value = props.item
}

const onSubmit = () => {

  refForm.value?.validate().then(({valid}) => {

    if (valid) {

      emit('emitirDatos', data.value)

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

      <VCol cols="12">
        <!-- 👉 Collapsible Section -->
        <h6 class="text-h6 mb-6">
          Crear Usuario
        </h6>

        <FormularioColapsable :formData="data" />
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
          to="/usuarios"
        >
          Cancelar
        </VBtn>
      </VCol>
    </VRow>

  </VForm>

</template>

<style scoped lang="scss">

</style>
