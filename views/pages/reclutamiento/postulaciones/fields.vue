<script setup lang="ts">
import { requiredValidator } from '@core/utils/validators'
import type { DatosPostulacion, EtapaReclutamiento, Postulacion } from '@/types/reclutamiento'
const props = defineProps<{ postulacion?: Postulacion; guardando: boolean }>()
const emit = defineEmits<{ (e: 'guardar', datos: DatosPostulacion): void }>()
const { get } = useClienteRequest()
const form = ref<any>(null)
const candidatos = ref<any[]>([])
const vacantes = ref<any[]>([])
const etapas = ref<EtapaReclutamiento[]>([])
const responsables = ref<any[]>([])

const etapaOriginal = props.postulacion?.etapa_reclutamiento_id
  ?? props.postulacion?.etapaReclutamiento?.id
  ?? props.postulacion?.etapa_reclutamiento?.id
  ?? null

const datos = reactive<DatosPostulacion>({
  candidato_id: props.postulacion?.candidato_id ?? null,
  vacante_id: props.postulacion?.vacante_id ?? null,
  etapa_reclutamiento_id: etapaOriginal,
  responsable_id: props.postulacion?.responsable_id ?? null,
  fecha_postulacion: props.postulacion?.fecha_postulacion?.slice(0, 10) || new Date().toISOString().slice(0, 10),
  fecha_ultima_actualizacion: props.postulacion?.fecha_ultima_actualizacion ?? null,
  estado: props.postulacion?.estado || 'En proceso',
  observaciones: props.postulacion?.observaciones ?? null,
})

const normalizarId = (id: number | null | undefined) => id == null ? null : String(id)

const hayMovimiento = computed(() => !!props.postulacion && (
  normalizarId(datos.etapa_reclutamiento_id) !== normalizarId(etapaOriginal)
  || datos.estado !== props.postulacion.estado
  || normalizarId(datos.responsable_id) !== normalizarId(props.postulacion.responsable_id)
))

const observacionMovimiento = ref<string | null>('')
const contarCaracteres = (valor: string | null) => Array.from(valor ?? '').length

const validarObservacionMovimiento = (valor: string | null) =>
  contarCaracteres(valor) <= 2000 || 'Máximo 2000 caracteres'

watch(hayMovimiento, aplica => {
  if (!aplica)
    observacionMovimiento.value = ''
})

const lista = (response: any) => Array.isArray(response.data) ? response.data : (response.data?.data || [])
const cargar = async () => {
  try {
    const [c, v, e, r] = await Promise.all([
      get<any>('/api/candidatos?page[size]=100'),
      get<any>('/api/vacantes?include=puesto,unidad&page[size]=100'),
      get<any>('/api/catalogo/etapas-reclutamiento?limit=100'),
      get<any>('/api/usuarios?page[size]=100'),
    ])
    candidatos.value = lista(c); vacantes.value = lista(v); etapas.value = lista(e); responsables.value = lista(r)
  } catch (error) { manejaError(error) }
}

const guardar = async () => {
  if (!(await form.value?.validate())?.valid)
    return

  const observacion = observacionMovimiento.value?.trim()

  emit('guardar', {
    ...datos,
    ...(hayMovimiento.value && observacion ? { observacion_movimiento: observacion } : {}),
  })
}

onMounted(cargar)
</script>
<template>
  <VForm ref="form" @submit.prevent="guardar">
    <VRow>
      <VCol cols="12" md="6"><AppAutocomplete v-model="datos.candidato_id" label="Candidato" :items="candidatos" item-title="nombres" item-value="id" :rules="[requiredValidator]" clearable><template #item="{ props: itemProps, item }"><VListItem v-bind="itemProps" :title="`${item.raw.nombres} ${item.raw.apellidos}`" :subtitle="item.raw.correo" /></template></AppAutocomplete></VCol>
      <VCol cols="12" md="6"><AppAutocomplete v-model="datos.vacante_id" label="Vacante" :items="vacantes" item-title="id" item-value="id" :rules="[requiredValidator]" clearable><template #item="{ props: itemProps, item }"><VListItem v-bind="itemProps" :title="`#${item.raw.id} · ${item.raw.puesto?.nombre || 'Vacante'}`" :subtitle="item.raw.unidad?.nombre" /></template></AppAutocomplete></VCol>
      <VCol cols="12" md="4"><AppAutocomplete v-model="datos.etapa_reclutamiento_id" label="Etapa" :items="etapas" item-title="nombre" item-value="id" :rules="[requiredValidator]" clearable /></VCol>
      <VCol cols="12" md="4"><AppAutocomplete v-model="datos.responsable_id" label="Responsable" :items="responsables" item-title="nombres" item-value="id" clearable /></VCol>
      <VCol cols="12" md="4"><AppTextField v-model="datos.fecha_postulacion" label="Fecha de postulación" type="date" :rules="[requiredValidator]" /></VCol>
      <VCol cols="12" md="4"><AppSelect v-model="datos.estado" label="Estado" :items="['En proceso', 'Descartada', 'Contratada', 'Retirada']" :rules="[requiredValidator]" /></VCol>
      <VCol cols="12"><AppTextarea v-model="datos.observaciones" label="Observaciones generales" /></VCol>
      <VCol v-if="hayMovimiento" cols="12">
        <AppTextarea
          v-model="observacionMovimiento"
          label="Observación del movimiento (opcional)"
          hint="Se guardará en el historial, no en las observaciones generales."
          persistent-hint
          :counter="2000"
          :counter-value="contarCaracteres"
          :rules="[validarObservacionMovimiento]"
        />
      </VCol>
      <VCol cols="12" class="d-flex gap-2"><VBtn type="submit" :loading="guardando">Guardar</VBtn><VBtn to="/admin/postulaciones" color="secondary" variant="tonal">Cancelar</VBtn></VCol>
    </VRow>
  </VForm>
</template>
