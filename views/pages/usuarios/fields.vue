<script setup lang="ts">
import type { VForm } from 'vuetify/components/VForm'
import { ref } from 'vue'
import type { UsuarioInterface } from '@/types/usuarios'
import DualListbox from '@/components/DualListbox.vue'

const props = defineProps({
  item: {
    type: Object || null,
    default: null,
  },
},
)

const emit = defineEmits<Emit>()
const isFormValid = ref(false)
const refForm = ref<VForm>()
const { getCatalogos, catalogos } = useCatalogo()
const { showToastError } = useToast()

const data = ref<UsuarioInterface>({
  usuario_dominio: null,
  cif: null,
  asociado_id: null,
  codigo_bankworks: null,
  codigo_ejecutivo: null,
  fecha_labores: null,
  email: null,
  nombre: null,
  apellido: null,
  estado: null,
  nuevoPassword: 0,
  fecha_entra_vacaciones: null,
  fecha_sale_vaciones: null,
  puesto_id: null,
  region_id: null,
  gerencia_id: null,
  roles: [],
  permissions: [],
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
  gestiones_crm_vencidas: 0,
})

interface Emit {

  (e: 'emitirDatos', value: UsuarioInterface ): void
  (e: 'restablecerCodigo2fa', value: any ): void

}

if (props.item)
  data.value = props.item

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid)
      emit('emitirDatos', data.value)
  })
}

const puedeMostrarDatos = computed(() => {
  return Object.values(data.value).some(valor => valor !== null && valor !== undefined)
})

const loadCatalogs = async () => {
  try {
    await getCatalogos(['puestos', 'unidades', 'regiones', 'gerencias', 'roles', 'permissions'])
  }
  catch (error) {
    showToastError(error?.message)
  }
}

const rolesSeleccionados = computed(() => {
  return Array.isArray(data.value.roles) ? data.value.roles : []
})

const permisosSeleccionados = computed(() => {
  return Array.isArray(data.value.permissions) ? data.value.permissions : []
})

const guardarRolesSeleccionados = (roles: any) => {
  data.value.roles = roles
}

const guardarPermisosSeleccionados = (permisos: any) => {
  data.value.permissions = permisos
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

const estaEditando = computed(() => {
  return data.value.id
})

const nombreBoton = computed(() => {
  return data.value.id ? 'Actualizar' : 'Guardar'
})

const restablecerCodigo = () => {

  if(estaEditando.value) {

    emit('restablecerCodigo2fa', data.value.id)

  }

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
        <VCard v-if="!data.id">
          <VCardText>
            <SelectorBuscador
              title="Buscar Asociado"
              placeholder="Ingrese el nombre del asociado"
              Endpoint="/api/asociados/buscar/select2/"
              requerido
              @data="llenarData"
            />
          </VCardText>
        </VCard>

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

          <!-- SECTION INFORMACION LABORAL -->
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
              <!-- AGREGAR EL EL COMPONENTE PARA ROLES Y PERMISOS -->
              <DualListbox
                :items-disponibles="catalogos.roles.data"
                :items-seleccionados="rolesSeleccionados"
                tipo="Roles"
                @update:selected="guardarRolesSeleccionados"
              />
              <VDivider class="my-4" />
              <DualListbox
                :items-disponibles="catalogos.permissions.data"
                :items-seleccionados="permisosSeleccionados"
                tipo="Permisos"
                @update:selected="guardarPermisosSeleccionados"
              />
            </VExpansionPanelText>
          </VExpansionPanel>

          <!--  SECTION AUTENTICACIÓN -->
          <VExpansionPanel>
            <VExpansionPanelTitle>Autenticación</VExpansionPanelTitle>

            <VExpansionPanelText>


              <VCard class="pa-4">
                <VRow align="center">
                  <!-- Autenticación en dos pasos -->
                  <VCol cols="12" md="6" class="d-flex align-center">
                    <VLabel for="twoFactorSwitch" class="mr-2 text-medium-emphasis">Autenticación en dos pasos</VLabel>
                    <VSwitch
                      id="twoFactorSwitch"
                      v-model="data.two_factor_habilitado"
                      inset
                      color="primary"
                    >
                      <template #label>
                        <strong>{{ data.two_factor_habilitado ? 'Sí' : 'No' }}</strong>
                      </template>
                    </VSwitch>
                  </VCol>

                  <VCol
                    v-if="data.two_factor_habilitado && data.id"
                    cols="12"
                    md="6"
                    class="d-flex align-center justify-end"
                  >
                    <VLabel for="resetButton" class="mr-2 text-medium-emphasis">Restablecer Código</VLabel>
                    <VBtn
                      id="resetButton"
                      color="primary"
                      variant="flat"
                      @click="restablecerCodigo"
                    >
                      <VIcon class="tabler-refresh mr-1" />
                      Restablecer
                    </VBtn>
                  </VCol>
                </VRow>
              </VCard>
            </VExpansionPanelText>
          </VExpansionPanel>
        </VExpansionPanels>
      </VCol>

      <VCol
        v-if="puedeMostrarDatos"
        cols="12"
      >
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
