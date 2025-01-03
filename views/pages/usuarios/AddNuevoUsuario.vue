<script setup lang="ts">
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'

import type { VForm } from 'vuetify/components/VForm'

interface Emit {
  (e: 'update:esVisible', value: boolean): void
  (e: 'userData', value: any): void
}

interface Props {
  esVisible: boolean
}

const props = defineProps<Props>()
const emit = defineEmits<Emit>()

const isFormValid = ref(false)
const refForm = ref<VForm>()
const usuario_dominio = ref('')
const cif = ref('')
const codigo_bankworks = ref('')
const codigo_ejecutivo = ref('')
const nombre = ref()
const apellido = ref('')
const email = ref()
const fecha_labores = ref()
const estado = ref()
const password = ref()
const nuevoPassword = ref()

// crear selector de puesto id 1 al 3
const puestos = [
  { id: 1, nombre: 'Gerente' },
  { id: 2, nombre: 'Ejecutivo' },
  { id: 3, nombre: 'Administrativo' },
]

const puesto = ref<string>('') // Definir el tipo como string

// 👉 drawer close
const closeNavigationDrawer = () => {
  emit('update:esVisible', false)

  nextTick(() => {
    refForm.value?.reset()
    refForm.value?.resetValidation()
  })
}

const onSubmit = () => {
  refForm.value?.validate().then(({ valid }) => {
    if (valid) {
      // Formatea los datos según JSON:API
      const data
        = {
          usuario_dominio: usuario_dominio.value,
          cif: cif.value,
          codigo_bankworks: codigo_bankworks.value,
          codigo_ejecutivo: codigo_ejecutivo.value,
          nombre: nombre.value,
          apellido: apellido.value,
          email: email.value,
          fecha_labores: fecha_labores.value,
          estado: estado.value,
          password: password.value,
          nuevoPassword: nuevoPassword.value,
        }

      // Incluye relaciones en la estructura JSON:API si las necesitas
      const relationships = {
        puesto: { data: { id: String(puesto.value), type: 'puesto' } },

        // region: { data: { id: regionId.value, type: 'regiones' } },
        // gerencia: { data: { id: gerenciaId.value, type: 'gerencias' } },
      }

      // Emite la data formateada
      emit('userData', { data, relationships })

      // Cierra el formulario y resetea
      emit('update:esVisible', false)
      nextTick(() => {
        refForm.value?.reset()
        refForm.value?.resetValidation()
      })
    }
  })
}

const handleDrawerModelValueUpdate = (val: boolean) => {
  emit('update:esVisible', val)
}
</script>

<template>
  <VNavigationDrawer
    temporary
    :width="400"
    location="end"
    class="scrollable-content"
    :model-value="props.esVisible"
    @update:model-value="handleDrawerModelValueUpdate"
  >
    <!-- 👉 Title -->
    <AppDrawerHeaderSection
      title="AGREGAR NUEVO USUARIO"
      @cancel="closeNavigationDrawer"
    />

    <VDivider />

    <PerfectScrollbar :options="{ wheelPropagation: false }">
      <VCard flat>
        <VCardText>
          <!-- 👉 Form -->
          <VForm
            ref="refForm"
            v-model="isFormValid"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- Usuario Dominio -->
              <VCol cols="12">
                <AppTextField
                  v-model="usuario_dominio"
                  :rules="[requiredValidator]"
                  label="Usuario Dominio"
                  placeholder="Usuario de dominio"
                />
              </VCol>

              <!-- CIF -->
              <VCol cols="12">
                <AppTextField
                  v-model="cif"
                  type="number"
                  :rules="[requiredValidator]"
                  label="CIF"
                  placeholder="12345678"
                />
              </VCol>

              <!-- Código Bankworks -->
              <VCol cols="12">
                <AppTextField
                  v-model="codigo_bankworks"
                  :rules="[requiredValidator]"
                  label="Código Bankworks"
                  placeholder="BW123"
                />
              </VCol>

              <!-- Código Ejecutivo -->
              <VCol cols="12">
                <AppTextField
                  v-model="codigo_ejecutivo"
                  type="number"
                  label="Código Ejecutivo"
                  placeholder="12345"
                />
              </VCol>

              <!-- Nombre -->
              <VCol cols="12">
                <AppTextField
                  v-model="nombre"
                  :rules="[requiredValidator]"
                  label="Nombre"
                  placeholder="Nombre del usuario"
                />
              </VCol>

              <!-- Apellido -->
              <VCol cols="12">
                <AppTextField
                  v-model="apellido"
                  :rules="[requiredValidator]"
                  label="Apellido"
                  placeholder="Apellido del usuario"
                />
              </VCol>

              <!-- Email -->
              <VCol cols="12">
                <AppTextField
                  v-model="email"
                  :rules="[requiredValidator, emailValidator]"
                  label="Email"
                  placeholder="usuario@example.com"
                />
              </VCol>

              <!-- Fecha de Labores -->
              <VCol cols="12">
                <AppTextField
                  v-model="fecha_labores"
                  type="date"
                  label="Fecha de Labores"
                />
              </VCol>

              <!-- Estado -->
              <VCol cols="12">
                <AppSelect
                  v-model="estado"
                  label="Estado"
                  placeholder="Seleccione un estado"
                  :rules="[requiredValidator]"
                  :items="['Cancelado', 'Inactivo', 'Activo']"
                />
              </VCol>

              <!-- Puesto ID -->
              <VCol cols="12">
                <AppSelect
                  v-model="puesto"
                  label="Puesto"
                  placeholder="Seleccione un puesto"
                  :rules="[requiredValidator]"
                  :items="puestos"
                  item-text="nombre"
                  item-value="id"
                  item-title="nombre"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="password"
                  :rules="[requiredValidator]"
                  label="Password"
                  placeholder="Password"
                />
              </VCol>

              <!-- password_confirmation -->
<!--              <VCol cols="12">-->
<!--                <AppTextField-->
<!--                  v-model="nuevoPassword"-->
<!--                  :rules="[requiredValidator]"-->
<!--                  label="Password Confirmation"-->
<!--                  placeholder="Password Confirmation"-->
<!--                />-->
<!--              </VCol>-->

              <!-- 👉 Submit and Cancel -->
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
                  @click="closeNavigationDrawer"
                >
                  Cancel
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </PerfectScrollbar>
  </VNavigationDrawer>
</template>
