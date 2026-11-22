<script setup lang="ts">
import type { Candidato, MediaArchivo } from '@/types/reclutamiento'

const props = defineProps<{ candidato: Candidato }>()
const emit = defineEmits<{ (e: 'actualizado'): void }>()

const { post, deleted } = useClienteRequest()
const { showToastSuccess, preguntaEliminar } = useToast()

const colecciones = [
  { value: 'curriculum', titulo: 'Currículum', icono: 'tabler-file-cv' },
  { value: 'dpi', titulo: 'DPI', icono: 'tabler-id' },
  { value: 'titulos_academicos', titulo: 'Títulos académicos', icono: 'tabler-school' },
  { value: 'otros_documentos', titulo: 'Otros documentos', icono: 'tabler-paperclip' },
] as const

const subiendo = ref<string | null>(null)

const documentosPorColeccion = (coleccion: string): MediaArchivo[] =>
  (props.candidato.media || []).filter(archivo => archivo.collection_name === coleccion)

const formatearTamano = (bytes: number) => {
  if (!bytes)
    return '0 B'

  const unidades = ['B', 'KB', 'MB', 'GB']
  const indice = Math.floor(Math.log(bytes) / Math.log(1024))

  return `${(bytes / 1024 ** indice).toFixed(1)} ${unidades[indice]}`
}

const subirArchivo = async (coleccion: string, archivos: File | File[] | null) => {
  const archivo = Array.isArray(archivos) ? archivos[0] : archivos

  if (!archivo)
    return

  subiendo.value = coleccion
  try {
    const formData = new FormData()

    formData.append('archivo', archivo)
    formData.append('coleccion', coleccion)

    const respuesta = await post<{ message: string }>(`/api/candidatos/${props.candidato.id}/documentos`, formData)

    showToastSuccess(respuesta.message)
    emit('actualizado')
  }
  catch (error) {
    manejaError(error)
  }
  finally {
    subiendo.value = null
  }
}

const eliminarArchivo = async (archivo: MediaArchivo) => {
  if (!await preguntaEliminar(`¿Desea eliminar el documento "${archivo.name}"?`))
    return

  try {
    const respuesta = await deleted<{ message: string }>(`/api/candidatos/${props.candidato.id}/documentos/${archivo.id}`)

    showToastSuccess(respuesta.message)
    emit('actualizado')
  }
  catch (error) {
    manejaError(error)
  }
}
</script>

<template>
  <VRow>
    <VCol
      v-for="coleccion in colecciones"
      :key="coleccion.value"
      cols="12"
      md="6"
    >
      <VCard
        variant="tonal"
        class="h-100"
      >
        <VCardItem>
          <template #prepend>
            <VIcon :icon="coleccion.icono" />
          </template>
          <VCardTitle class="text-subtitle-1">
            {{ coleccion.titulo }}
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <div
            v-if="!documentosPorColeccion(coleccion.value).length"
            class="text-caption text-medium-emphasis mb-3"
          >
            Sin documentos cargados.
          </div>

          <VList
            v-else
            density="compact"
            class="mb-2 bg-transparent"
          >
            <VListItem
              v-for="archivo in documentosPorColeccion(coleccion.value)"
              :key="archivo.id"
              :href="archivo.original_url"
              target="_blank"
              rel="noopener noreferrer"
            >
              <template #prepend>
                <VIcon icon="tabler-file" />
              </template>
              <VListItemTitle>{{ archivo.file_name }}</VListItemTitle>
              <VListItemSubtitle>{{ formatearTamano(archivo.size) }}</VListItemSubtitle>
              <template #append>
                <VBtn
                  icon="tabler-trash"
                  variant="text"
                  size="small"
                  color="error"
                  @click.prevent="eliminarArchivo(archivo)"
                />
              </template>
            </VListItem>
          </VList>

          <VFileInput
            density="compact"
            label="Subir documento"
            prepend-icon=""
            prepend-inner-icon="tabler-upload"
            accept=".pdf,.jpg,.jpeg,.png"
            :loading="subiendo === coleccion.value"
            :disabled="subiendo === coleccion.value"
            @update:model-value="archivos => subirArchivo(coleccion.value, archivos)"
          />
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>
