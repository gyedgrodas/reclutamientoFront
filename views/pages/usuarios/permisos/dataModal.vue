<script setup lang="ts">
import { defineProps, onMounted, ref, watch } from 'vue'
import type { VForm } from 'vuetify/lib/components/VForm'
import DualListbox from '@/components/DualListbox.vue'

const props = defineProps<Props>()
const emit = defineEmits(['actualizarAbrirModal', 'actualizarTabla'])
const { showToastError, showToastSuccess } = useToast()
const { paginaEspera } = useCargandoPagina()

const { put, get, post } = useClienteRequest()

const isFormValid = ref(false)
const refForm = ref<VForm>()

interface Props {
  abrirModal: boolean
  isEditing?: boolean
  dialogItem?: { id: number | null; name: string; subject: string ; guard_name: string }
}

const localItem = ref({
  id: props.dialogItem?.id || null,
  name: props.dialogItem?.name || '',
  subject: props.dialogItem?.subject || '',
  guard_name: 'api',
  roles: [],
})

const rolesDisponibles = ref([])
const sujetosDisponibles = ref([])
const roleSeleccionadoAhora = ref([])
const rolesSeleccionadosAntes = ref<any[]>([])

const cargarRolesDisponibles = async () => {
  try {
    const response: any = await get('/api/roles')

    rolesDisponibles.value = response.data.data
  }
  catch (error) {
    showToastError('Error al cargar los roles')
    console.error('Error al cargar los permisos:', error)
  }
}

const cargarSujetos = async () => {
  try {
    const response: any = await get('/api/permisos/sujetos')

    sujetosDisponibles.value = response.data
  }
  catch (error) {
    showToastError('Error al cargar los sujetos')
    console.error('Error al cargar los permisos:', error)
  }
}

const cargarRolPermiso = async () => {
  if (!localItem.value.id) {
    showToastError('No se puede cargar permisos porque el ID del permiso es inválido.')
    console.error('No se puede cargar permisos porque el ID del permiso es inválido.')

    return
  }

  try {
    const response: any = await get(`/api/permisos/${localItem.value.id}/roles`)

    rolesSeleccionadosAntes.value = response.data
  }
  catch (error) {
    showToastError('Error al cargar permisos del rol')
    console.error('Error al cargar permisos del rol:', error)
  }
}

onMounted(async () => {
  await cargarRolesDisponibles()
  await cargarSujetos()
})

// Actualizar el item del dialogo
watch(
  () => props.dialogItem,
  async newVal => {
    localItem.value = { ...newVal }
    if (newVal && props.isEditing && localItem.value.id) {
      // Solo carga roles si estás editando un permiso
      await cargarRolPermiso()
    }
  },
  { deep: true, immediate: true },
)

// Cerrar el modal
const cerrarModal = () => {
  rolesSeleccionadosAntes.value = []
  emit('actualizarAbrirModal', false)
}

// Actualizar los roles seleccionados
const actualizarPermisoSeleccionados = (permisoSeleccionados: any) => {
  roleSeleccionadoAhora.value = permisoSeleccionados
}

// Crear o editar un permiso
const onSubmit = async () => {
  refForm.value?.validate().then(async ({ valid }) => {
    if (valid) {
      if (!localItem.value.name.trim())

        return

      localItem.value.roles = roleSeleccionadoAhora.value

      try {
        if (localItem.value.id) {
          const response = await put(`/api/permisos/${localItem.value.id}`, { data: localItem.value })
          if (response)
            showToastSuccess('Permiso actualizado')
          paginaEspera.value = true
        }
        else {
          const response = await post('/api/permisos', { data: localItem.value })
          if (response)
            showToastSuccess('Permiso creado')
          paginaEspera.value = true
        }
        emit('actualizarTabla', true)
      }
      catch (error) {
        paginaEspera.value = false
        showToastError('Error en la operación')
        console.error('Error en la operación:', error)
      }
      paginaEspera.value = false
      cerrarModal()
    }
  })
}
</script>

<template>
  <VForm
    ref="refForm"
    v-model="isFormValid"
  >
    <VDialog
      v-model="props.abrirModal"
      max-width="1202px"
    >
      <VCard :title="props.isEditing ? 'Editar Permiso' : 'Crear Permiso'">
        <VCardText>
          <VRow>
            <VCol
              cols="12"
              md="6"
            >
              <VTextField
                v-model="localItem.name"
                label="Nombre del permiso"
                :rules="[requiredValidator]"
              />
            </VCol>
            <VCol
              cols="12"
              md="6"
            >
              <VAutocomplete
                v-model="localItem.subject"
                :items="sujetosDisponibles"
                :rules="[requiredValidator]"
                label="Sujeto"
                variant="outlined"
              />
            </VCol>
          </VRow>

          <DualListbox
            :items-disponibles="rolesDisponibles"
            :items-seleccionados="rolesSeleccionadosAntes"
            tipo="Roles"
            @update:selected="actualizarPermisoSeleccionados"
          />
        </VCardText>
        <VCardActions>
          <VBtn
            color="error"
            @click="cerrarModal"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="success"
            @click="onSubmit"
          >
            Guardar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VForm>
</template>
