<script setup lang="ts">
import { defineEmits, defineProps, nextTick, ref, watch } from 'vue'
import type { VForm } from 'vuetify/components/VForm'
import DualListbox from '@/components/DualListbox.vue'

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
const permisosDisponibles = ref([])
const permisoSeleccionadoAhora = ref([])
const permisosSeleccionadosAntes = ref([])
const refForm = ref<VForm>()
const name = ref('')
const guardName = ref('api')
const permisos = ref<Permission []>([])
const isFormValid = ref(false)

const cargarPermisosDisponibles = async () => {
  try {
    const response: any = await get('/api/permisos')

    permisosDisponibles.value = response.data.data
    console.log('Permisos disponibles:', permisosDisponibles.value)
  }
  catch (error) {
    showToastError('Error al cargar los permisos')
    console.error('Error al cargar los permisos:', error)
  }
}

// Limpiar el formulario
const limpiarFormulario = () => {
  name.value = ''

  // guardName.value = ''
  permisos.value = []
}

const cargarPermisosRol = async (rolId: number) => {
  try {
    const response: any = await get(`/api/roles/${rolId}/permisos`)

    permisosSeleccionadosAntes.value = response.data
  }
  catch (error) {
    showToastError('Error al cargar los permisos del rol')
    console.error('Error al cargar los permisos del rol:', error)
  }
}

// Actualizar formulario cuando el rol cambia
watch(
  () => props.visible,
  async isVisible => {
    console.log('isVisible:', props)
    limpiarFormulario()
    if (isVisible && props.mode === 'edit' && props.rol) {
      name.value = props.rol.name || ''
      cargarPermisosRol(props.rol.id)

      // guardName.value = props.rol.guard_name || ''
      // permisoSeleccionado.value = props.rol.permissions || []
    }

    else if (!isVisible) {
      await nextTick()
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
        permisos: permisoSeleccionadoAhora.value.slice(),
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

const actualizarPermisoSeleccionados = (permisoSeleccionados: any) => {
  permisoSeleccionadoAhora.value = permisoSeleccionados
}

cargarPermisosDisponibles()
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
          <DualListbox
            :items-disponibles="permisosDisponibles"
            :items-seleccionados="permisosSeleccionadosAntes"
            tipo="Permisos"
            @update:selected="actualizarPermisoSeleccionados"
          />
        </VForm>
      </VCardText>
      <VCardActions>
        <VBtn
          color="error"
          @click="visible = false"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          @click="guardarRol"
        >
          {{ mode === "create" ? "Crear" : "Actualizar" }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
