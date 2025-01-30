<script setup lang="ts">
import type {VForm} from "vuetify/lib/components/VForm";
import type { UsuarioInterface } from '@/types/usuarios/index.ts';
import {ref} from "vue";


const isFormValid = ref(false)
const refForm = ref<VForm>()
const { getCatalogos, catalogos } = useCatalogo()
const { showToastError } = useToast()


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
  data.value = props.item
}

const onSubmit = () => {
  refForm.value?.validate().then(({valid}) => {
    if (valid) {
      emit('emitirDatos', data.value)
    }
  })
}

const puedeMostrarDatos = computed(() => {

  return Object.values(data.value).some(valor => valor !== null && valor !== undefined);

});



const loadCatalogs = async () => {
  try {
    await getCatalogos(['puestos', 'unidades', 'regiones', 'gerencias'])
  }
  catch (error) {
    showToastError(error?.message)
  }
}

loadCatalogs()


// Datos estáticos
const estados = ['Activo', 'Inactivo', 'Cancelado']
const panel = ref(0)



// crear funcion llenarData
const llenarData = (selectorData: any) => {
  data.value.nombre = selectorData.primer_nombre + ' ' + selectorData.segundo_nombre + ' ' + selectorData.tercer_nombre
   data.value.apellido = selectorData.primer_apellido + ' ' + selectorData.segundo_apellido
   data.value.codigo_bankworks = selectorData.codigo_bankworks
   data.value.usuario_dominio = 'gy'+ selectorData.primer_nombre.substring(0, 3).toLowerCase() + selectorData.primer_apellido.toLowerCase();
   data.value.email =  data.value.usuario_dominio + '@micoopeguayacan.gt';
   data.value.cif = selectorData.cif
   data.value.asociado_id = selectorData.asociado_id
   data.value.isDisabled = true
}



const nombreBoton = computed(() => {
  return data.value.id ? 'Actualizar' : 'Guardar'
})

</script>

<template>


  <VForm
    ref="refForm"
    v-model="isFormValid"
    @submit.prevent="onSubmit"
  >
    <VRow>

      <VCol cols="12">

        <v-card v-if="!data.id">
          <v-card-text>
            <selector-buscador
                title="Buscar Asociado"
                placeholder="Ingrese el nombre del asociado"
                Endpoint="/api/asociados/buscar/select2/"
                requerido
                @data="llenarData"
            >
            </selector-buscador>
          </v-card-text>
        </v-card>

        <VExpansionPanels v-model="panel">
          <!-- SECTION INFORMACION PERSONAL -->
          <VExpansionPanel>
            <VExpansionPanelTitle>Información Personal</VExpansionPanelTitle>
            <VExpansionPanelText>
              <VRow>

                <VCol
                    cols="12"
                    md="6"
                >
                  <AppTextField
                      v-model="data.codigo_bankworks"
                      :rules="[requiredValidator]"
                      label="Codigo Bankworks"
                      placeholder="Ingrese Codigo Bankworks"
                      :disabled="data.isDisabledEdit"
                  />
                </VCol>

                <VCol
                    cols="12"
                    md="6"
                >
                  <AppTextField
                      v-model="data.usuario_dominio"
                      :rules="[requiredValidator]"
                      label="Usuario Dominio"
                      placeholder="Ingrese Usuario Dominio"
                      :disabled="data.isDisabled || data.isDisabledEdit"
                  />
                </VCol>

                <VCol
                    cols="12"
                    md="6"
                >
                  <AppTextField
                      v-model="data.codigo_ejecutivo"
                      :rules="[requiredValidator]"
                      label="Codigo Ejecutivo"
                      placeholder="Ingrese Codigo Ejecutivo"
                      :disabled=" data.isDisabledEdit"
                  />
                </VCol>

                <VCol
                    cols="12"
                    md="6"
                >
                  <AppTextField
                      v-model="data.email"
                      :rules="[requiredValidator]"
                      label="Email"
                      placeholder="Ingrese Email"
                      :disabled="data.isDisabled || data.isDisabledEdit"
                  />
                </VCol>

                <VCol
                    cols="12"
                    md="6"
                >
                  <AppAutocomplete
                      v-model="data.estado"
                      :items="estados"
                      :rules="[requiredValidator]"
                      label="Estado"
                      placeholder="Seleccione Estado"
                  />
                </VCol>

              </VRow>
            </VExpansionPanelText>
          </VExpansionPanel>
          <!-- !SECTION Delivery Address -->

          <!-- SECTION INFORMACION LABORAL-->
          <VExpansionPanel>
            <VExpansionPanelTitle>Información Laboral</VExpansionPanelTitle>
            <VExpansionPanelText>
                <VRow>


                  <VCol
                      cols="12"
                      md="6"
                  >
                    <AppDateTimePicker
                        v-model="data.fecha_puestoactual"
                        :rules="[requiredValidator]"
                        label="Fecha de Puesto Actual"
                        placeholder="aaaa/mm/dd"
                    />
                  </VCol>


                  <VCol
                      cols="12"
                      md="6"
                  >
                    <AppAutocomplete
                        v-model="data.puesto_id"
                        :items="catalogos.puestos"
                        :rules="[requiredValidator]"
                        label="Puesto"
                        placeholder="Seleccione una opción..."
                        item-title="nombre"
                        item-value="id"
                        clearable
                        eager
                    />
                  </VCol>

                  <VCol
                      cols="12"
                      md="6"
                  >
                    <AppDateTimePicker
                        v-model="data.fecha_labores"
                        :rules="[requiredValidator]"
                        label="Fecha de Ingreso en la Institución"
                        placeholder="dd-mm-yyyy"
                    />
                  </VCol>


                  <VCol
                      cols="12"
                      md="6"
                  >
                    <AppAutocomplete
                        v-model="data.unidad_id"
                        :items="catalogos.unidades"
                        :rules="[requiredValidator]"
                        label="Unidad"
                        placeholder="Seleccione una opción..."
                        item-title="nombre"
                        item-value="id"
                    />
                  </VCol>

                  <VCol
                      cols="12"
                      md="6"
                  >
                    <AppAutocomplete
                        v-model="data.region_id"
                        :items="catalogos.regiones"
                        :rules="[requiredValidator]"
                        label="Region"
                        placeholder="Seleccione una opción..."
                        item-title="nombre"
                        item-value="id"
                    />
                  </VCol>

                  <VCol
                      cols="12"
                      md="6"
                  >
                    <AppAutocomplete
                        v-model="data.gerencia_id"
                        :items="catalogos.gerencias"
                        :rules="[requiredValidator]"
                        label="Gerencia"
                        placeholder="Seleccione una opción..."
                        item-title="nombre"
                        item-value="id"
                    />
                  </VCol>


                </VRow>
            </VExpansionPanelText>
          </VExpansionPanel>
          <!-- !SECTION Delivery Options -->

          <!-- SECTION ROLES -->
          <VExpansionPanel>
            <VExpansionPanelTitle>Roles y Permisos</VExpansionPanelTitle>

            <VExpansionPanelText>

              <v-label>seccion de roles y permisos pendiente</v-label>
            </VExpansionPanelText>
          </VExpansionPanel>
          <!-- !SECTION Payment Method -->
        </VExpansionPanels>
      </VCol>
    

        
      <VCol cols="12"  v-if="puedeMostrarDatos">
        <VBtn
          type="submit"
          class="me-3"
        >
          {{ nombreBoton }}
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
