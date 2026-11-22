<script setup lang="ts">
import { emailValidator, requiredValidator } from '@core/utils/validators'
import type { Candidato, DatosCandidato, MunicipioResumen } from '@/types/reclutamiento'

const props = defineProps<{ candidato?: Candidato; guardando: boolean }>()
const emit = defineEmits<{ (e: 'guardar', datos: DatosCandidato): void }>()
const { getCatalogos } = useCatalogo()
const form = ref<{ validate: () => Promise<{ valid: boolean }> } | null>(null)

const datos = reactive<DatosCandidato>({
  nombres: props.candidato?.nombres || '',
  apellidos: props.candidato?.apellidos || '',
  correo: props.candidato?.correo || '',
  telefono: props.candidato?.telefono ?? null,
  dpi: props.candidato?.dpi ?? null,
  fecha_nacimiento: props.candidato?.fecha_nacimiento ?? null,
  genero: props.candidato?.genero ?? null,
  direccion: props.candidato?.direccion ?? null,
  municipio_id: props.candidato?.municipio_id ?? null,
  nivel_academico: props.candidato?.nivel_academico ?? null,
  pretension_salarial: props.candidato?.pretension_salarial ?? null,
  fuente_reclutamiento: props.candidato?.fuente_reclutamiento ?? null,
  estado: props.candidato?.estado || 'Activo',
  observaciones: props.candidato?.observaciones ?? null,
})

const generos = [
  { title: 'Masculino', value: 'Masculino' },
  { title: 'Femenino', value: 'Femenino' },
  { title: 'Otro', value: 'Otro' },
]

const nivelesAcademicos = [
  { title: 'Primaria', value: 'Primaria' },
  { title: 'Básico', value: 'Básico' },
  { title: 'Diversificado', value: 'Diversificado' },
  { title: 'Universitario', value: 'Universitario' },
  { title: 'Postgrado', value: 'Postgrado' },
]

const fuentesReclutamiento = [
  { title: 'Referido', value: 'Referido' },
  { title: 'Bolsa de Empleo', value: 'Bolsa de Empleo' },
  { title: 'Redes Sociales', value: 'Redes Sociales' },
  { title: 'Feria de Empleo', value: 'Feria de Empleo' },
  { title: 'Otro', value: 'Otro' },
]

const estados = [
  { title: 'Activo', value: 'Activo' },
  { title: 'Inactivo', value: 'Inactivo' },
  { title: 'Descartado', value: 'Descartado' },
]

const municipios = ref<MunicipioResumen[]>([])
const cargandoCatalogos = ref(false)
const catalogosListos = ref(false)

// El endpoint del catálogo puede responder el arreglo directo o el paginador de Laravel
const comoLista = (valor: any): any[] => Array.isArray(valor) ? valor : (valor?.data ?? [])

const cargarCatalogos = async () => {
  cargandoCatalogos.value = true
  try {
    const catalogos = await getCatalogos(['municipios'])

    municipios.value = comoLista(catalogos.municipios)
    catalogosListos.value = true
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargandoCatalogos.value = false
  }
}

const guardar = async () => {
  if (!(await form.value?.validate())?.valid || !catalogosListos.value)
    return

  emit('guardar', { ...datos })
}

onMounted(cargarCatalogos)
</script>

<template>
  <VForm
    ref="form"
    @submit.prevent="guardar"
  >
    <VRow>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.nombres"
          label="Nombres"
          maxlength="100"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.apellidos"
          label="Apellidos"
          maxlength="100"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.correo"
          label="Correo electrónico"
          maxlength="150"
          :rules="[requiredValidator, emailValidator]"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.telefono"
          label="Teléfono"
          maxlength="20"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.dpi"
          label="DPI"
          maxlength="20"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.fecha_nacimiento"
          label="Fecha de nacimiento"
          type="date"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppSelect
          v-model="datos.genero"
          label="Género"
          :items="generos"
          clearable
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppAutocomplete
          v-model="datos.municipio_id"
          label="Municipio de residencia"
          :items="municipios"
          item-title="nombre"
          item-value="id"
          clearable
          :loading="cargandoCatalogos"
        />
      </VCol>
      <VCol cols="12">
        <AppTextField
          v-model="datos.direccion"
          label="Dirección"
          maxlength="255"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppSelect
          v-model="datos.nivel_academico"
          label="Nivel académico"
          :items="nivelesAcademicos"
          clearable
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppTextField
          v-model="datos.pretension_salarial"
          label="Pretensión salarial (Q)"
          type="number"
          min="0"
          step="0.01"
        />
      </VCol>
      <VCol
        cols="12"
        md="6"
      >
        <AppSelect
          v-model="datos.fuente_reclutamiento"
          label="Fuente de reclutamiento"
          :items="fuentesReclutamiento"
          clearable
        />
      </VCol>
      <VCol
        v-if="props.candidato"
        cols="12"
        md="6"
      >
        <AppSelect
          v-model="datos.estado"
          label="Estado"
          :items="estados"
          :rules="[requiredValidator]"
        />
      </VCol>
      <VCol cols="12">
        <AppTextarea
          v-model="datos.observaciones"
          label="Observaciones"
        />
      </VCol>
      <VCol
        v-if="!catalogosListos && !cargandoCatalogos"
        cols="12"
      >
        <VAlert
          type="error"
          variant="tonal"
        >
          No fue posible cargar el catálogo de municipios. <VBtn
            variant="text"
            @click="cargarCatalogos"
          >
            Reintentar
          </VBtn>
        </VAlert>
      </VCol>
      <VCol
        cols="12"
        class="d-flex gap-2"
      >
        <VBtn
          type="submit"
          :loading="guardando"
          :disabled="guardando || !catalogosListos"
        >
          Guardar
        </VBtn>
        <VBtn
          color="secondary"
          variant="tonal"
          to="/admin/candidatos"
        >
          Cancelar
        </VBtn>
      </VCol>
    </VRow>
  </VForm>
</template>
