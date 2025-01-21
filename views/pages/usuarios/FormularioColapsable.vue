<script lang="ts" setup>
import {ref, defineProps} from 'vue'
import type {UsuarioInterface} from '@/types/usuarios'

const props = defineProps<{
  formData: UsuarioInterface
}>()

// Simula una llamada para obtener los catálogos
const {get} = useClienteRequest()
const catalogos = await get('/api/data/all')
console.log('catalogos', catalogos)

// Datos estáticos
const estados = ['Activo', 'Inactivo', 'Cancelado']
const panel = ref(0)



// crear funcion llenarData
const llenarData = (data: any) => {
  console.log('llenardata', data.cif)
  props.formData.nombre = data.primer_nombre + ' ' + data.segundo_nombre + ' ' + data.tercer_nombre
  props.formData.apellido = data.primer_apellido + ' ' + data.segundo_apellido
  props.formData.codigo_bankworks = data.codigo_bankworks
  props.formData.usuario_dominio = 'gy'+ data.primer_nombre.substring(0, 3).toLowerCase() + data.primer_apellido.toLowerCase();
  props.formData.email = props.formData.usuario_dominio + '@micoopeguayacan.gt';
  props.formData.cif = data.cif
  props.formData.asociado_id = data.id
  props.formData.isDisabled = true
}

console.log('props.formData', props.formData)

</script>

<template>
  <v-card v-if="props.formData.isDisabled">
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
                v-model="props.formData.codigo_bankworks"
                :rules="[requiredValidator]"
                label="Codigo Bankworks"
                placeholder="Ingrese Codigo Bankworks"
                :disabled="props.formData.isDisabledEdit"
            />
          </VCol>

          <VCol
              cols="12"
              md="6"
          >
            <AppTextField
                v-model="props.formData.usuario_dominio"
                :rules="[requiredValidator]"
                label="Usuario Dominio"
                placeholder="Ingrese Usuario Dominio"
                :disabled="props.formData.isDisabled || props.formData.isDisabledEdit"
            />
          </VCol>

          <VCol
              cols="12"
              md="6"
          >
            <AppTextField
                v-model="props.formData.codigo_ejecutivo"
                :rules="[requiredValidator]"
                label="Codigo Ejecutivo"
                placeholder="Ingrese Codigo Ejecutivo"
                :disabled=" props.formData.isDisabledEdit"
            />
          </VCol>

          <VCol
              cols="12"
              md="6"
          >
            <AppTextField
                v-model="props.formData.email"
                :rules="[requiredValidator]"
                label="Email"
                placeholder="Ingrese Email"
                :disabled="props.formData.isDisabled || props.formData.isDisabledEdit"
            />
          </VCol>

          <VCol
              cols="12"
              md="6"
          >
            <AppAutocomplete
                v-model="props.formData.estado"
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
                v-model="props.formData.fecha_puestoactual"
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
                v-model="props.formData.puesto_id"
                :items="catalogos.data.puestos"
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
                v-model="props.formData.fecha_labores"
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
                v-model="props.formData.unidad_id"
                :items="catalogos.data.unidads"
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
                v-model="props.formData.region_id"
                :items="catalogos.data.regiones"
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
                v-model="props.formData.gerencia_id"
                :items="catalogos.data.gerencias"
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
</template>

<style lang="scss">
.delivery-options {
  cursor: pointer;

  .v-selection-control-group {
    inline-size: 100%;
  }
}

.delivery-option {
  padding: 1rem;
  border: 1px solid rgba(var(--v-border-color), var(--v-border-opacity));

  &.active {
    border-color: rgb(var(--v-theme-primary));
  }
}
</style>
