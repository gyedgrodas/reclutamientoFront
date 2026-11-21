<script setup lang="ts">
import Fields from '@/views/pages/catalogos/departamentos/fields.vue'
import type { DatosDepartamento, Departamento } from '@/types/catalogos'

definePageMeta({ navActiveLink: 'admin-catalogos-departamentos', middleware: 'permissions', action: 'editar departamentos', subject: 'Departamento' })

const { get, put } = useClienteRequest()
const { showToastSuccess } = useToast()
const route = useRoute()
const registro = ref<Departamento | null>(null)
const guardando = ref(false)
const cargando = ref(true)

const cargar = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: Departamento }>(`/api/catalogo/departamentos/${route.params.id}`)

    registro.value = respuesta.data
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargando.value = false
  }
}

const guardar = async (datos: DatosDepartamento) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await put<{ message: string }>(`/api/catalogo/departamentos/${route.params.id}`, datos)

    showToastSuccess(respuesta.message)
    await navigateTo('/admin/catalogos/departamentos')
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    guardando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <VCard title="Editar departamento">
    <VCardText>
      <VProgressLinear
        v-if="cargando"
        indeterminate
      />
      <Fields
        v-else-if="registro"
        :departamento="registro"
        :guardando="guardando"
        @guardar="guardar"
      />
      <div v-else>
        No fue posible cargar el departamento. <VBtn
          variant="text"
          @click="cargar"
        >
          Reintentar
        </VBtn>
      </div>
    </VCardText>
  </VCard>
</template>
