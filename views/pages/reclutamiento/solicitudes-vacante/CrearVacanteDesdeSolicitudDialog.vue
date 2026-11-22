<script setup lang="ts">
import { requiredValidator } from '@core/utils/validators'
import type {
  DatosCrearVacanteDesdeSolicitud,
  SolicitudVacante,
  Vacante,
} from '@/types/reclutamiento'
import { nombreCompletoPersona } from '@/utils/reclutamientoUx'

const props = defineProps<{
  modelValue: boolean
  solicitud: SolicitudVacante | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: boolean): void
  (e: 'creada', vacante: Vacante): void
}>()

const { post } = useClienteRequest()
const { showToastSuccess } = useToast()

const abierto = computed({
  get: () => props.modelValue,
  set: valor => emit('update:modelValue', valor),
})

const form = ref<{ validate: () => Promise<{ valid: boolean }>; resetValidation: () => void } | null>(null)
const guardando = ref(false)
const errorCreacion = ref<string | null>(null)

const obtenerFechaHoy = () => {
  const hoy = new Date()
  const anio = hoy.getFullYear()
  const mes = String(hoy.getMonth() + 1).padStart(2, '0')
  const dia = String(hoy.getDate()).padStart(2, '0')

  return `${anio}-${mes}-${dia}`
}

const datos = reactive<DatosCrearVacanteDesdeSolicitud>({
  fecha_apertura: obtenerFechaHoy(),
  fecha_cierre_estimada: null,
  descripcion: null,
  requisitos: null,
})

const reiniciarFormulario = () => {
  datos.fecha_apertura = obtenerFechaHoy()
  datos.fecha_cierre_estimada = null
  datos.descripcion = null
  datos.requisitos = null
  errorCreacion.value = null
  nextTick(() => {
    form.value?.resetValidation()
  })
}

watch(abierto, valor => {
  if (valor)
    reiniciarFormulario()
})

const validarFechaCierre = (value: unknown) => {
  const fechaCierre = String(value ?? '').trim()
  if (!fechaCierre)
    return true
  if (datos.fecha_apertura && fechaCierre < datos.fecha_apertura)
    return 'La fecha de cierre estimada debe ser igual o posterior a la fecha de apertura'

  return true
}

const validarLongitudOpcional = (value: unknown) => {
  const texto = String(value ?? '')
  if (texto.length > 10000)
    return 'No debe superar los 10,000 caracteres'

  return true
}

const crearVacante = async () => {
  if (!props.solicitud || guardando.value)
    return

  errorCreacion.value = null

  const resultado = await form.value?.validate()
  if (!resultado?.valid)
    return

  guardando.value = true
  try {
    const payload: DatosCrearVacanteDesdeSolicitud = {
      fecha_apertura: datos.fecha_apertura,
      fecha_cierre_estimada: datos.fecha_cierre_estimada || null,
      descripcion: datos.descripcion?.trim() || null,
      requisitos: datos.requisitos?.trim() || null,
    }

    const respuesta = await post<{ data: Vacante; message: string }>(
      `/api/solicitudes-vacante/${props.solicitud.id}/crear-vacante`,
      payload,
    )

    showToastSuccess(respuesta.message || 'Vacante creada y vinculada con éxito.')
    emit('creada', respuesta.data)
    abierto.value = false
  }
  catch (error: any) {
    errorCreacion.value = error?.response?.data?.message || 'No fue posible crear la vacante a partir de esta solicitud.'
    manejaError(error)
  }
  finally {
    guardando.value = false
  }
}
</script>

<template>
  <VDialog
    v-model="abierto"
    max-width="700"
    scrollable
  >
    <VCard
      v-if="solicitud"
      class="tt-panel"
    >
      <div class="d-flex justify-space-between align-start gap-3 pa-5 pb-4">
        <div>
          <span class="tt-eyebrow">CREACIÓN DE VACANTE · SOLICITUD #{{ solicitud.id }}</span>
          <h3 class="text-h5 font-weight-bold mt-1 mb-0">
            Crear vacante desde solicitud aprobada
          </h3>
          <p class="text-body-2 text-medium-emphasis mb-0 mt-1">
            La vacante heredará automáticamente el puesto, unidad, plazas, motivo y solicitante aprobados.
          </p>
        </div>

        <VBtn
          icon="tabler-x"
          variant="tonal"
          color="secondary"
          size="small"
          :disabled="guardando"
          @click="abierto = false"
        />
      </div>

      <VDivider />

      <VCardText class="pa-5">
        <!-- Datos heredados de la solicitud -->
        <VRow
          dense
          class="mb-5"
        >
          <VCol
            cols="12"
            sm="6"
          >
            <div class="tt-detail-box">
              <span>Puesto</span>
              <strong>{{ solicitud.puesto?.nombre || `Puesto #${solicitud.puesto_id}` }}</strong>
            </div>
          </VCol>
          <VCol
            cols="12"
            sm="6"
          >
            <div class="tt-detail-box">
              <span>Unidad / Agencia</span>
              <strong>{{ solicitud.unidad?.nombre || `Unidad #${solicitud.unidad_id}` }}</strong>
            </div>
          </VCol>
          <VCol
            cols="6"
            sm="4"
          >
            <div class="tt-detail-box">
              <span>Plazas</span>
              <strong>{{ solicitud.numero_plazas }}</strong>
            </div>
          </VCol>
          <VCol
            cols="6"
            sm="4"
          >
            <div class="tt-detail-box">
              <span>Motivo</span>
              <strong>{{ solicitud.motivo }}</strong>
            </div>
          </VCol>
          <VCol
            cols="12"
            sm="4"
          >
            <div class="tt-detail-box">
              <span>Solicitante</span>
              <strong>{{ nombreCompletoPersona(solicitud.solicitante) }}</strong>
            </div>
          </VCol>
        </VRow>

        <VAlert
          v-if="errorCreacion"
          type="error"
          variant="tonal"
          class="mb-4"
        >
          {{ errorCreacion }}
        </VAlert>

        <VForm
          ref="form"
          @submit.prevent="crearVacante"
        >
          <VRow>
            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="datos.fecha_apertura"
                label="Fecha de apertura *"
                type="date"
                :disabled="guardando"
                :rules="[requiredValidator]"
              />
            </VCol>

            <VCol
              cols="12"
              sm="6"
            >
              <AppTextField
                v-model="datos.fecha_cierre_estimada"
                label="Fecha de cierre estimada"
                type="date"
                :min="datos.fecha_apertura || undefined"
                :disabled="guardando"
                :rules="[validarFechaCierre]"
                clearable
              />
            </VCol>

            <VCol cols="12">
              <AppTextarea
                v-model="datos.descripcion"
                label="Descripción del puesto"
                placeholder="Resumen de responsabilidades, alcance del cargo y objetivos..."
                rows="3"
                counter="10000"
                :disabled="guardando"
                :rules="[validarLongitudOpcional]"
              />
            </VCol>

            <VCol cols="12">
              <AppTextarea
                v-model="datos.requisitos"
                label="Requisitos del perfil"
                placeholder="Formación académica, experiencia comprobable y competencias clave..."
                rows="3"
                counter="10000"
                :disabled="guardando"
                :rules="[validarLongitudOpcional]"
              />
            </VCol>
          </VRow>
        </VForm>
      </VCardText>

      <VDivider />

      <VCardActions class="pa-4 d-flex justify-end gap-2">
        <VBtn
          variant="tonal"
          color="secondary"
          :disabled="guardando"
          @click="abierto = false"
        >
          Cancelar
        </VBtn>
        <VBtn
          color="primary"
          prepend-icon="tabler-briefcase-2"
          :loading="guardando"
          :disabled="guardando"
          @click="crearVacante"
        >
          Crear vacante
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>

<style scoped>
@import "@styles/reclutamiento-talent.scss";
</style>
