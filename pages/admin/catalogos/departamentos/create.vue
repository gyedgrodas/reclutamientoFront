<script setup lang="ts">
import Fields from '@/views/pages/catalogos/departamentos/fields.vue'
import type { DatosDepartamento } from '@/types/catalogos'

definePageMeta({ navActiveLink: 'admin-catalogos-departamentos', middleware: 'permissions', action: 'crear departamentos', subject: 'Departamento' })

const { post } = useClienteRequest()
const { showToastSuccess } = useToast()
const guardando = ref(false)

const guardar = async (datos: DatosDepartamento) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await post<{ message: string }>('/api/catalogo/departamentos', datos)

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
</script>

<template>
  <VCard title="Crear departamento">
    <VCardText>
      <Fields
        :guardando="guardando"
        @guardar="guardar"
      />
    </VCardText>
  </VCard>
</template>
