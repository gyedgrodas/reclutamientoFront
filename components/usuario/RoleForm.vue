<script setup lang="ts">
import { defineProps, nextTick, ref, watch } from 'vue'
import type { VForm } from 'vuetify/components/VForm'
import SeleccionPermisos from '@/views/pages/usuarios/SeleccionPermisos.vue'

const props = defineProps({
  visible: Boolean,
  rol: {
    type: Object,
    default: null,
  },
  mode: {
    type: String,
    default: 'create',
  },
})

const emit = defineEmits(['cerrar', 'actualizarTabla'])
const { showToastSuccess, showToastError } = useToast()
const { paginaEspera } = useCargandoPagina()

const { put, get, post } = useClienteRequest()

interface Permission {
  id: number
  name: string
}

// Campos y referencias del formulario

const permisosSeleccionadosAntes = ref([])
const refForm = ref<VForm>()
const name = ref('')
const guardName = ref('api')
const isFormValid = ref(false)

// Limpiar el formulario
const limpiarFormulario = () => {
  name.value = ''

  // guardName.value = ''
}

const cargarPermisosRol = async (rolId: number) => {
  try {
    const response: any = await get(`/api/roles/${rolId}/permisos`)

    permisosSeleccionadosAntes.value = response.data
  }
  catch (error) {
    showToastError('Error al cargar los permisos del rol')
  }
}

// Actualizar formulario cuando el rol cambia
watch(
  () => props.visible,
  async isVisible => {
    if (isVisible) {
      limpiarFormulario()

      if (props.mode === 'edit' && props.rol) {
        name.value = props.rol.name || ''
        await cargarPermisosRol(props.rol.id)
      }
    } else {
      // RESET TOTAL al cerrar
      permisosSeleccionadosAntes.value = []
      name.value = ''
    }
  },
  { immediate: true },
)

const guardarRol = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (!valid)
      return
    try {
      const rolData = {
        id: props.rol?.id || null,
        name: name.value,
        guard_name: guardName.value,
        permisos: permisosSeleccionadosAntes.value.slice(),
      }

      if (props.mode === 'create') {
        paginaEspera.value = true

        await post('/api/roles', { data: rolData })
        showToastSuccess('Rol creado con éxito')
      }
      else {
        paginaEspera.value = true

        await put(`/api/roles/${rolData.id}`, { data: rolData })
        showToastSuccess('Rol actualizado con éxito')
      }
      emit('actualizarTabla', true)
      emit('cerrar')
    }
    catch (error: any) {
      showToastError(`Error al guardar el rol: ${error.response.data.message}`)
      console.error('Error al guardar el rol:', error)
    }
    finally {
      emit('cerrar')
    }
    paginaEspera.value = false
  })
}
</script>

<template>
  <VDialog
    :model-value="props.visible"
    width="1200"
    @update:model-value="emit('cerrar')"
  >
    <VCard>
      <VCardTitle class="text-h4 text-center">
        {{ mode === "create" ? "Crear Nuevo Rol" : "Editar Rol" }}
      </VCardTitle>
      <VCardText>
        <VForm
          ref="refForm"
          v-model="isFormValid"
        >
          <AppTextField
            v-model="name"
            class="mb-4"
            label="Nombre del Rol"
            :rules="[requiredValidator]"
          />
          <AppTextField
            v-model="guardName"
            class="mb-4"
            label="Guard Name"
            disabled
          />
          <VRow>
            <VCol cols="12">
              <h2 class="text-center">
                {{ `Selección de Permisos` }}
              </h2>
            </VCol>
          </VRow>
          <SeleccionPermisos
            v-model:permisos-seleccionados="permisosSeleccionadosAntes"
            :permisos-seleccionados="permisosSeleccionadosAntes"
          />
        </VForm>
      </VCardText>
      <VCardActions>
        <VBtn
          color="secondary"
          class="mt-6 mr-1"
          variant="elevated"
          @click="emit('cerrar')"
        >
          <VIcon icon="tabler-cancel" start size="22" />
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          class="mt-6"
          variant="elevated"
          @click="guardarRol"
        >
          <VIcon icon="tabler-device-floppy" start size="22"/>
          {{ mode === "create" ? "Crear" : "Guardar" }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
