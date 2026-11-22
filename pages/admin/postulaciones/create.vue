<script setup lang="ts">
import Fields from '@/views/pages/reclutamiento/postulaciones/fields.vue'
import type { DatosPostulacion } from '@/types/reclutamiento'
definePageMeta({ navActiveLink: 'admin-postulaciones', middleware: 'permissions', action: 'crear postulaciones', subject: 'Postulacion' })
const { post } = useClienteRequest()
const { showToastSuccess } = useToast()
const guardando = ref(false)
const guardar = async (datos: DatosPostulacion) => {
  if (guardando.value) return
  guardando.value = true
  try {
    const respuesta = await post<{ message: string }>('/api/postulaciones', datos)
    showToastSuccess(respuesta.message)
    await navigateTo('/admin/postulaciones')
  } catch (error) { manejaError(error) } finally { guardando.value = false }
}
</script>
<template><VCard title="Registrar postulación"><VCardText><Fields :guardando="guardando" @guardar="guardar" /></VCardText></VCard></template>
