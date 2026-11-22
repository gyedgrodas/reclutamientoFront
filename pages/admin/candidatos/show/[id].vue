<script setup lang="ts">
import { can } from '@layouts/plugins/casl'
import DocumentosCandidato from '@/views/pages/reclutamiento/candidatos/DocumentosCandidato.vue'
import type { Candidato } from '@/types/reclutamiento'

definePageMeta({ navActiveLink: 'admin-candidatos', middleware: 'permissions', action: 'ver candidatos', subject: 'Candidato' })

const { get } = useClienteRequest()
const route = useRoute()
const registro = ref<Candidato | null>(null)
const cargando = ref(true)

const coloresEstado: Record<string, string> = {
  Activo: 'success',
  Inactivo: 'secondary',
  Descartado: 'error',
}

const cargar = async () => {
  cargando.value = true
  try {
    const respuesta = await get<{ data: Candidato }>(`/api/candidatos/${route.params.id}?include=municipio,media`)

    registro.value = respuesta.data
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    cargando.value = false
  }
}

onMounted(cargar)
</script>

<template>
  <VCard title="Expediente del candidato">
    <template
      v-if="registro"
      #append
    >
      <VChip
        :color="coloresEstado[registro.estado] || 'secondary'"
        size="small"
        class="font-weight-bold"
      >
        {{ registro.estado }}
      </VChip>
    </template>

    <VCardText>
      <VProgressLinear
        v-if="cargando"
        indeterminate
      />
      <template v-else-if="registro">
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <strong>Nombre completo:</strong> {{ registro.nombres }} {{ registro.apellidos }}
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <strong>Correo:</strong> {{ registro.correo }}
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <strong>Teléfono:</strong> {{ registro.telefono || 'Sin registrar' }}
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <strong>DPI:</strong> {{ registro.dpi || 'Sin registrar' }}
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <strong>Fecha de nacimiento:</strong> {{ registro.fecha_nacimiento ? formatearFecha(registro.fecha_nacimiento) : 'Sin registrar' }}
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <strong>Género:</strong> {{ registro.genero || 'Sin registrar' }}
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <strong>Municipio:</strong> {{ registro.municipio?.nombre || 'Sin registrar' }}
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <strong>Dirección:</strong> {{ registro.direccion || 'Sin registrar' }}
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <strong>Nivel académico:</strong> {{ registro.nivel_academico || 'Sin registrar' }}
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <strong>Pretensión salarial:</strong> {{ registro.pretension_salarial ? `Q${registro.pretension_salarial}` : 'Sin registrar' }}
          </VCol>
          <VCol
            cols="12"
            md="6"
          >
            <strong>Fuente de reclutamiento:</strong> {{ registro.fuente_reclutamiento || 'Sin registrar' }}
          </VCol>
          <VCol cols="12">
            <strong>Observaciones:</strong> {{ registro.observaciones || 'Sin observaciones' }}
          </VCol>
        </VRow>

        <VDivider class="my-6" />

        <h3 class="text-h6 font-weight-bold mb-4">
          Documentos del expediente
        </h3>
        <DocumentosCandidato
          v-if="can('gestionar documentos candidato', 'Candidato')"
          :candidato="registro"
          @actualizado="cargar"
        />
        <VAlert
          v-else
          type="info"
          variant="tonal"
        >
          No tiene permisos para gestionar los documentos de este candidato.
        </VAlert>
      </template>
      <div v-else>
        No fue posible cargar el candidato. <VBtn
          variant="text"
          @click="cargar"
        >
          Reintentar
        </VBtn>
      </div>

      <VBtn
        class="mt-6"
        color="secondary"
        variant="tonal"
        to="/admin/candidatos"
      >
        Regresar
      </VBtn>
    </VCardText>
  </VCard>
</template>
