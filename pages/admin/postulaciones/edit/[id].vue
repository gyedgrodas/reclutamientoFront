<script setup lang="ts">
import Fields from '@/views/pages/reclutamiento/postulaciones/fields.vue'
import type { DatosPostulacion, Postulacion } from '@/types/reclutamiento'
definePageMeta({ navActiveLink: 'admin-postulaciones', middleware: 'permissions', action: 'editar postulaciones', subject: 'Postulacion' })
const { get, put } = useClienteRequest()
const { showToastSuccess } = useToast()
const route = useRoute()
const registro = ref<Postulacion | null>(null)
const cargando = ref(true)
const guardando = ref(false)
const cargar = async () => {
  try { registro.value = (await get<{ data: Postulacion }>(`/api/postulaciones/${route.params.id}`)).data }
  catch (error) { manejaError(error) } finally { cargando.value = false }
}
const guardar = async (datos: DatosPostulacion) => {
  if (guardando.value) return
  guardando.value = true
  try { showToastSuccess((await put<{ message: string }>(`/api/postulaciones/${route.params.id}`, datos)).message); await navigateTo('/admin/postulaciones') }
  catch (error) { manejaError(error) } finally { guardando.value = false }
}
onMounted(cargar)
</script>
<template><VCard title="Editar postulación"><VCardText><VProgressLinear v-if="cargando" indeterminate /><Fields v-else-if="registro" :postulacion="registro" :guardando="guardando" @guardar="guardar" /><div v-else>No fue posible cargar la postulación.</div></VCardText></VCard></template>
