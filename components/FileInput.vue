<script setup lang="ts">
import vueFilePond from 'vue-filepond'
import FilePondPluginImagePreview from 'filepond-plugin-image-preview'
import FilePondPluginFileValidateType from 'filepond-plugin-file-validate-type'
import FilePondPluginPdfPreview from 'filepond-plugin-pdf-preview'
import 'filepond/dist/filepond.min.css'
import 'filepond-plugin-image-preview/dist/filepond-plugin-image-preview.min.css'
import 'filepond-plugin-pdf-preview/dist/filepond-plugin-pdf-preview.min.css'
import { useTheme } from 'vuetify'

// Emitir eventos al componente padre
const emit = defineEmits(['addfile', 'removefile', 'processfile'])

const { showToastError } = useToast()

// Obtener el tema global de Vuetify
const vuetifyTheme = useTheme()

// Detectar el tema actual (oscuro o claro)
const colorTema = ref(vuetifyTheme.global.name.value)

// Usar `watchEffect` para monitorear cambios reactivos en el tema y colores
watchEffect(() => {
  const isDarkMode = colorTema.value === 'dark'

  const primaryColor = isDarkMode
    ? vuetifyTheme.themes.value.dark.colors.primary
    : vuetifyTheme.themes.value.light.colors.primary

  // Actualizar variables CSS dinámicas globales
  const root = document.documentElement

  root.style.setProperty('--filepond--color-primary', primaryColor)
  root.style.setProperty('--filepond--color-primary-hover', primaryColor)
  root.style.setProperty('--filepond--color-background', isDarkMode ? 'dark' : 'light')
})

// Actualizar `colorTema` cuando el nombre del tema cambie
watch(() => vuetifyTheme.global.name.value, newValue => {
  colorTema.value = newValue
})

// Función para mostrar alertas personalizadas
const mostrarAlerta = error => {
  console.log('Error al subir archivo:', error)
  if (error.body.body === 'Max files')
    showToastError('Alcanzaste el límite de archivos permitidos')
  else
    showToastError(`Error al subir archivo: ${error.body.body}`)
}

// Capturar advertencias emitidas por FilePond
const handleWarning = (error, file, status) => {
  mostrarAlerta({ body: error, file, status })
}

// Instanciar FilePond con los plugins necesarios
const FilePond = vueFilePond(FilePondPluginImagePreview, FilePondPluginFileValidateType, FilePondPluginPdfPreview)
</script>

<template>
  <FilePond
    v-bind="{
      ...$attrs,
      class: [
        'app-filepond',
        $attrs.class || '', // Mantén las clases externas si se pasan
      ],
      credits: null, // Ejemplo de atributos adicionales personalizados
      id: $attrs.id || `filepond-${Math.random().toString(36).substr(2, 9)}`, // Generar un ID único si no se pasa uno
      allowMultiple: $attrs.multiple !== undefined, // Permitir múltiples archivos si se especifica el atributo 'multiple'
    }"
    @addfile="(error, fileItem) => {
      !error
        ? emit('addfile', fileItem.file) // Emitir archivo si no hay error
        : console.error('Error al agregar archivo:', error)
    }"
    @removefile="(error, file) => {
      !error
        ? emit('removefile', file) // Emitir evento si no hay error
        : console.error('Error al eliminar archivo:', error)
    }"
    @processfile="(error, file) => {
      !error
        ? emit('processfile', file) // Emitir evento si no hay error
        : console.error('Error al procesar archivo:', error)
    }"
    @warning="handleWarning"
  />
</template>

<style>
/* Estilos personalizados del componente FilePond */
.app-filepond {
  font-family: 'Inter', sans-serif;
}

.app-filepond .filepond--drop-label {
  color: var(--filepond--color-primary, #ff3d77);
  background-color: var(--filepond--color-background, #25293C);
}

.app-filepond .filepond--file {
  background-color: var(--filepond--color-primary-hover, #ff3d77);
}

.app-filepond .filepond--root .filepond--panel-root {
  background-color: var(--filepond--color-background, #25293C);
  border: 1px solid var(--filepond--color-primary, #ff3d77);
}

.app-filepond .filepond--pdf-preview-wrapper:before {
  background-color: var(--filepond--color-primary, #25293C);
}
</style>
