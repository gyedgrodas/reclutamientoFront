<script setup lang="ts">
import Fields from '@/views/pages/catalogos/municipios/fields.vue'
import type { DatosMunicipio } from '@/types/catalogos'

definePageMeta({ navActiveLink: 'admin-catalogos-municipios', middleware: 'permissions', action: 'crear municipios', subject: 'Municipio' })

const { post } = useClienteRequest()
const { showToastSuccess } = useToast()
const guardando = ref(false)

const guardar = async (datos: DatosMunicipio) => {
  if (guardando.value)
    return
  guardando.value = true
  try {
    const respuesta = await post<{ message: string }>('/api/catalogo/municipios', datos)

    showToastSuccess(respuesta.message)
    await navigateTo('/admin/catalogos/municipios')
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
  <VCard title="Crear municipio">
    <VCardText>
      <Fields
        :guardando="guardando"
        @guardar="guardar"
      />
    </VCardText>
  </VCard>
</template>
