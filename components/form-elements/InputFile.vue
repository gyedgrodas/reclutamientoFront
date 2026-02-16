<script setup lang="ts">
import { ref, computed, useAttrs, onMounted, watch, nextTick, defineOptions } from 'vue'

// --- IMPORTS ---
import { GestorDeArchivos } from '@/clases/archivo/GestorArchivos'
import { ORIGINADOR, SIGUA } from '@/constantes/Const-Sistema'
import type { UsuarioInterface } from '@/types/usuarios'

defineOptions({ inheritAttrs: false })

// --- PROPS ---
const props = defineProps({
  multiple: { type: Boolean, default: false },
  previsualizarArchivos: { type: Array, default: () => [] },
  name: { type: String, default: '' },
  subidaAutomatica: { type: Boolean, default: false },
  urlSubida: { type: String, default: '' },
  urlEliminacion: { type: String, default: '' },
  archivos: { type: [Array, Object], default: () => [] },
  lectura: { type: Boolean, default: false },
  destino: { type: String, default: ORIGINADOR },
  model_type: { type: String, default: '' },
  model_id: { type: Number, default: 0 },
  coleccion: { type: String, default: '' },
  asociado_id: { type: Number, default: null },
  claseId: { type: Number, default: null },
  tipoId: { type: Number, default: null },

  // --- PROPS DE CONTROL ---
  activarCamaraPc: { type: Boolean, default: false },

  // --- NUEVA PROP: TAMAÑO MÁXIMO ---
  // Define el límite en Megabytes (Ej: 5, 10, 20). Defecto: 10MB
  maxSizeMb: { type: Number, default: 1 }
})

const emit = defineEmits(['update:archivos', 'archivoSubido', 'archivoEliminado'])

// --- COMPOSABLES ---
const { post, deleted } = (props.subidaAutomatica && props.destino == ORIGINADOR)
  ? useClienteRequest()
  : useClienteRequestSigua()
const { showToastSuccess, showToastError } = useToast()
const attrs = useAttrs()
const usuarioAutenticado = useSanctumUser<UsuarioInterface>()

// --- STATE ---
const gestorArchivos = new GestorDeArchivos(props.multiple ?? false)
const estaArrastrandoArchivo = ref(false)
const input = ref<HTMLInputElement | null>(null)
const archivoParaVisualizar = ref(null)
const dialog = ref(false)
const viewerRefs = ref([])

// --- STATE INTERFAZ ---
const mostrarMenuSeleccion = ref(false)
const mostrarCamaraModal = ref(false)
const videoRef = ref<HTMLVideoElement | null>(null)
const canvasRef = ref<HTMLCanvasElement | null>(null)
const streamCamara = ref<MediaStream | null>(null)

// ==========================================
// 1. VALIDACIONES (TIPO Y TAMAÑO)
// ==========================================

const aceptaImagenes = computed(() => {
  const accept = (attrs.accept as string) || ''
  if (!accept) return true
  return /image|\.jpg|\.jpeg|\.png|\.webp|\.bmp|\*/i.test(accept)
})

const tiposPermitidos = computed(() => {
  let tipos = (attrs.accept as string) ?? 'image/*,.pdf'
  return tipos.split(',').map(t => t.trim()).filter(t => t !== '')
})

// --- VALIDACIÓN DE TIPO ---
const esTipoPermitido = (archivo: File) =>{
  return tiposPermitidos.value.some(tipo => {
    if (tipo.endsWith('/*')) return archivo.type.startsWith(tipo.replace('/*', ''))
    else if (tipo.startsWith('.')) return archivo.name.toLowerCase().endsWith(tipo.toLowerCase())
    else return archivo.type === tipo
  })
}

// --- NUEVA: VALIDACIÓN DE TAMAÑO ---
const esTamanoValido = (archivo: File) => {
  // Convertimos MB a Bytes (MB * 1024 * 1024)
  const maxBytes = props.maxSizeMb * 1024 * 1024
  if (archivo.size > maxBytes) {
    showToastError(`El archivo "${archivo.name}" excede el límite de ${props.maxSizeMb}MB.`)
    return false
  }
  return true
}

// --- FILTROS PRINCIPALES ---
const filtrarArchivosValidos = (documentos: File[]) => {
  // 1. Filtro por Tipo
  const archivosTipoValido = documentos.filter(archivo => {
    if (esTipoPermitido(archivo)) return true
    else {
      showToastError(`El archivo "${archivo.name}" no es permitido.`)
      return false
    }
  })

  // 2. Filtro por Tamaño (NUEVO)
  return archivosTipoValido.filter(archivo => esTamanoValido(archivo))
}

// ==========================================
// 2. DETECCIÓN DE DISPOSITIVO & CONTROL
// ==========================================

const esMovil = () => {
  if (typeof navigator === 'undefined') return false
  const userAgent = navigator.userAgent || navigator.vendor || (window as any).opera;
  const movilEstandar = /Android|webOS|iPhone|iPod|BlackBerry|IEMobile|Opera Mini/i.test(userAgent);
  const esIpad = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  return movilEstandar || esIpad;
}

const manejarClickDropzone = () => {
  if (props.lectura) return

  if (esMovil()) {
    // @ts-ignore
    input.value?.click()
    return
  }

  if (aceptaImagenes.value && props.activarCamaraPc) {
    mostrarMenuSeleccion.value = true
  } else {
    // @ts-ignore
    input.value?.click()
  }
}

// ==========================================
// 3. LÓGICA MENÚ PC
// ==========================================

const seleccionarOpcionCamara = () => {
  mostrarMenuSeleccion.value = false
  iniciarCamara()
}

const seleccionarOpcionArchivos = () => {
  mostrarMenuSeleccion.value = false
  nextTick(() => {
    // @ts-ignore
    input.value?.click()
  })
}

// ==========================================
// 4. LÓGICA WEBCAM
// ==========================================

const iniciarCamara = async () => {
  if (!props.multiple && gestorArchivos.archivos.value?.length > 0) {
    showToastError('Solo se permite un archivo')
    return
  }
  mostrarCamaraModal.value = true
  await nextTick()
  try {
    streamCamara.value = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'user', width: { ideal: 1280 }, height: { ideal: 720 } }
    })
    if (videoRef.value) videoRef.value.srcObject = streamCamara.value
  } catch (err) {
    showToastError('No se pudo acceder a la cámara.')
    cerrarCamara()
  }
}

const detenerCamara = () => {
  if (streamCamara.value) {
    streamCamara.value.getTracks().forEach(track => track.stop())
    streamCamara.value = null
  }
}

const cerrarCamara = () => {
  detenerCamara()
  mostrarCamaraModal.value = false
}

const capturarFoto = () => {
  if (!videoRef.value || !canvasRef.value) return
  const video = videoRef.value
  const canvas = canvasRef.value
  canvas.width = video.videoWidth
  canvas.height = video.videoHeight
  const context = canvas.getContext('2d')
  if (context) {
    context.drawImage(video, 0, 0, canvas.width, canvas.height)
    canvas.toBlob(async (blob) => {
      if (blob) {
        const nombreArchivo = `camara_pc_${Date.now()}.jpg`
        const archivoFile = new File([blob], nombreArchivo, { type: 'image/jpeg' })

        // APLICAMOS FILTRO TAMBIÉN AQUÍ
        const archivosValidos = filtrarArchivosValidos([archivoFile])

        if (archivosValidos.length > 0) {
          if (props.subidaAutomatica) await subirArchivo(archivosValidos)
          else await gestorArchivos.agregar(archivosValidos[0])
          emitirArchivosActuales()
          showToastSuccess('Foto capturada')
        }
        cerrarCamara()
      }
    }, 'image/jpeg', 0.9)
  }
}

// ==========================================
// 5. LÓGICA GENERAL ARCHIVOS
// ==========================================

async function abrirModalPrevisualizacion(archivo) {
  archivoParaVisualizar.value = archivo
  dialog.value = true
}

const abrirViewer = async (idx) => {
  await nextTick()
  const el = viewerRefs.value[idx]
  if (el && el.$viewer) el.$viewer.show()
}

const onArchivoSeleccionado = async (archivos: File | File[]) => {
  if (props.lectura) return
  const archivosArray = Array.isArray(archivos) ? archivos : [archivos]
  if (!props.multiple && archivosArray.length > 1) {
    showToastError('Solo se permite un archivo')
    return
  }

  // APLICAMOS FILTRO UNIFICADO (TIPO + TAMAÑO)
  const archivosValidos = filtrarArchivosValidos(archivosArray)

  if (archivosValidos.length === 0) return
  if (props.subidaAutomatica) await subirArchivo(archivosValidos)
  else await gestorArchivos.agregar(archivosValidos)
  emitirArchivosActuales()
}

async function documentoCargado(evento: DragEvent) {
  estaArrastrandoArchivo.value = false
  const archivosCargados = Array.from(evento.dataTransfer?.files || [])
  if (!props.multiple && (archivosCargados.length > 1 || gestorArchivos.archivos.value.length > 0)) {
    showToastError('Solo se permite un archivo')
    return
  }

  // APLICAMOS FILTRO UNIFICADO (TIPO + TAMAÑO)
  const archivosValidos = filtrarArchivosValidos(archivosCargados)

  if(props.subidaAutomatica && archivosValidos.length > 0) await subirArchivo(archivosValidos)
  else if (archivosValidos.length > 0) await gestorArchivos.agregar(archivosValidos)

  emitirArchivosActuales()
}

function emitirArchivosActuales() {
  const archivos = gestorArchivos.archivos.value.map(archivo => archivo.file || { id: archivo.id, url: archivo.previewUrl })
  emit('update:archivos', archivos)
}

const procesarPrevisualizaciones = () => {
  // @ts-ignore
  if (props.previsualizarArchivos && props.previsualizarArchivos.length > 0) {
    gestorArchivos.agregar(props.previsualizarArchivos)
  }
}

const manejarDragOver = () => { if (!props.lectura) estaArrastrandoArchivo.value = true }
const manejarDragLeave = () => { if (!props.lectura) estaArrastrandoArchivo.value = false }
const manejarDrop = (e) => { if (!props.lectura) documentoCargado(e) }

const eliminarArchivo = async (archivo) => {
  if(props.urlEliminacion && !archivo.file){
    try {
      const response = await deleted(props.urlEliminacion + '/' + archivo.id)
      showToastSuccess(response.message)
    } catch (error) { /* @ts-ignore */ manejaError(error) }
  }
  gestorArchivos.eliminarPorId(archivo.id)
  emitirArchivosActuales()
  emit('archivoEliminado', archivo)
}

const subirArchivo = async (archivosCargados) => {
  if (!props.subidaAutomatica) return
  const formData = new FormData()
  if (props.multiple) archivosCargados.forEach(a => a && formData.append(`${props.name}[]`, a))
  else if (archivosCargados[0]) formData.append(props.name, archivosCargados[0])

  formData.append('model_type', props.model_type)
  // @ts-ignore
  formData.append('model_id', props.model_id)
  formData.append('coleccion_name', props.coleccion)
  // @ts-ignore
  if (props.asociado_id) formData.append('asociado_id', props.asociado_id)
  // @ts-ignore
  if (props.claseId) formData.append('clase_id', props.claseId)
  // @ts-ignore
  if (props.tipoId) formData.append('tipo_id', props.tipoId)
  if (props.destino === SIGUA && usuarioAutenticado.value?.id)
    formData.append('usuario_id', usuarioAutenticado.value.id.toString())

  try {
    const response = await post(props.urlSubida, formData)
    await gestorArchivos.agregar(response.data)
    showToastSuccess(response.message)
    emit('archivoSubido', response.data)
  } catch (error) { /* @ts-ignore */ manejaError(error) }
}

onMounted(() => {
  procesarPrevisualizaciones()
  if (props.subidaAutomatica && !props.urlSubida) throw new Error('[InputFile] URL Subida requerida.')
})
watch(() => props.previsualizarArchivos, procesarPrevisualizaciones, { deep: false })

</script>

<template>
  <VRow
    ref="dropzone"
    dense
    class="mb-5 preview-dropzone text-center justify-center align-center"
    @click="manejarClickDropzone"
    @dragover.prevent="manejarDragOver"
    @dragleave="manejarDragLeave"
    @drop.prevent="manejarDrop"
    :class="{ 'preview-dropzone': true, dragging: estaArrastrandoArchivo, 'modo-lectura': lectura }"
  >
    <div class="dropzone-message d-flex flex-column align-center" v-if="!gestorArchivos.archivos.value?.length">
      <VIcon size="48" class="tabler-cloud-upload mb-2" color="primary"/>
      <p class="drop-text mb-1">
        {{ esMovil() ? 'Toca para agregar' : (aceptaImagenes && activarCamaraPc ? 'Click o arrastra archivos aquí' : 'Click para subir archivos') }}
      </p>
      <span class="text-caption text-disabled">Max: {{ props.maxSizeMb }}MB</span>
    </div>

    <template v-else>
      <div v-for="(archivo, i) in gestorArchivos.archivos.value" :key="archivo.id" style="width: 250px" class="text-center ma-2">
        <VCard style="padding: 10px" class="fill-height" @click.stop>
          <div :ref="el => viewerRefs[i] = el" v-viewer v-if="archivo.esImagen()" style="cursor: pointer">
            <img class="preview-frame" :src="archivo.urlPrevisualizacion" />
          </div>
          <iframe v-if="archivo.esPdf()" class="preview-frame" :src="archivo.urlPrevisualizacion" />
          <iframe
            v-else-if="archivo.esWord()"
            class="preview-frame word-miniatura"
            :src="archivo.urlPrevisualizacion"
            title="Vista previa Word"
          />
          <div class="text-end mt-3">
            <VBtn  icon="tabler-eye" @click.stop="archivo.esImagen() ? abrirViewer(i) : abrirModalPrevisualizacion(archivo)" class="mr-1" size="small" variant="outlined"/>
            <VBtn v-if="!lectura && (props.urlEliminacion || !archivo.file)" icon="tabler-trash" color="error" size="small" variant="outlined" @click.stop="eliminarArchivo(archivo)"/>
            <!--ELIMINAR DEL PREVIEW CUANDO ES DOCUMENTO DE WORD-->
            <VBtn v-if="archivo.esWord()" icon="tabler-trash" color="error" size="small" variant="outlined" @click.stop="eliminarArchivo(archivo)"/>
          </div>
        </VCard>
      </div>
    </template>
  </VRow>

  <VFileInput v-bind="$attrs" ref="input" :model-value="[]" class="d-none" :multiple="multiple" @update:modelValue="onArchivoSeleccionado"/>

  <VDialog v-model="mostrarMenuSeleccion" max-width="400" content-class="dialog-center">
    <VCard class="glass-modal rounded-xl" theme="dark">
      <VCardTitle class="text-center pt-5 pb-2 text-h6 font-weight-bold">
        ¿Cómo deseas subir el archivo?
      </VCardTitle>

      <VCardText class="pb-5">
          <VListItem
            v-if="aceptaImagenes"
            @click="seleccionarOpcionCamara"
            class="mb-3 rounded-lg option-item"
          >
            <div class="d-flex align-center justify-center py-2">
              <VIcon icon="tabler-camera" color="primary" size="24" class="mr-3"/>
              <span class="text-body-1 font-weight-medium">Usar Webcam</span>
            </div>
          </VListItem>

          <VListItem
            @click="seleccionarOpcionArchivos"
            class="rounded-lg option-item"
          >
            <div class="d-flex align-center justify-center py-2">
              <VIcon icon="tabler-folder-open" color="secondary" size="24" class="mr-3"/>
              <span class="text-body-1 font-weight-medium">Explorador de Archivos</span>
            </div>
          </VListItem>
      </VCardText>
    </VCard>
  </VDialog>

  <VDialog v-model="mostrarCamaraModal" persistent max-width="700">
    <VCard>
      <VCardTitle class="d-flex justify-space-between align-center bg-primary text-white">
        <span>Tomar Foto</span>
        <VBtn icon="tabler-close" variant="text" color="white" @click="cerrarCamara" />
      </VCardTitle>
      <VCardText class="pa-0 bg-black text-center position-relative" style="min-height: 300px;">
        <video ref="videoRef" autoplay playsinline style="width: 100%; height: auto; display: block;"></video>
        <canvas ref="canvasRef" style="display: none;"></canvas>
      </VCardText>
      <VCardActions class="justify-center py-4">
        <VBtn color="error" variant="text" @click="cerrarCamara">Cancelar</VBtn>
        <VBtn color="primary" variant="elevated" prepend-icon="tabler-camera" @click="capturarFoto">Capturar</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>

  <VDialog v-model="dialog" width="80vw" class="dialog-viewport" persistent>
    <DialogCloseBtn @click="dialog = false" class="z-10"/>
    <VCard class="h-100 d-flex flex-column">
      <VCardText class="pa-0 h-100"><iframe v-if="archivoParaVisualizar" :src="archivoParaVisualizar?.obtenerUrlParaModal?.()" class="w-100 h-100" frameborder="0"/></VCardText>
    </VCard>
  </VDialog>
</template>

<style scoped>
.glass-modal {
  background-color: rgba(15, 15, 15, 0.1) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
}
.option-item {
  background-color: rgba(15, 15, 15, 0.1);
  transition: all 0.3s ease;
  cursor: pointer;
}
.option-item:hover {
  background-color: rgba(15, 15, 15, 0.1);
  transform: translateY(-2px);
  border-color: rgba(var(--v-theme-primary), 0.5);
  box-shadow: 0 4px 15px rgba(0,0,0,0.3);
}
.glass-modal .v-card-title {
  color: rgba(255, 255, 255, 0.9);
  letter-spacing: 0.5px;
}
.dialog-viewport >>> .v-overlay__content { height: 85vh; }
.preview-dropzone { border: 2px dashed rgba(var(--v-theme-primary), 0.5); border-radius: 12px; padding: 16px; cursor: pointer; transition: background-color 0.2s ease; min-height: 200px; display: flex; flex-wrap: wrap; }
.preview-dropzone:hover { background-color: rgba(var(--v-theme-primary), 0.045); }
.preview-dropzone.modo-lectura { cursor: default; border-style: solid; }
.preview-frame { width: 100%; height: 180px; object-fit: cover; border-radius: 8px; }
.dropzone-message { width: 100%; color: #999; font-size: 1rem; font-weight: 500; user-select: none; }
.d-none { display: none !important; }
</style>
