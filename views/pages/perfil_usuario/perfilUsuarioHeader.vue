<script lang="ts" setup>
import usuario from '@images/avatars/usuario.png'
import type { SendResponseInterface } from '@/types/sistema/types'
import type { UsuarioInterface } from '@/types/usuarios'
import { Cropper, CircleStencil } from 'vue-advanced-cropper'
import 'vue-advanced-cropper/dist/style.css'

const props = defineProps({
  user: {
    type: Object,
    required: false,
    default: () => ({}),
  },
})

const { post } = useClienteRequest()
const { showToastSuccess, showToastInfo, showToastError } = useToast()
const { refreshIdentity } = useSanctumAuth()
const { paginaEspera } = useCargandoPagina()

const fotoComoArchivo = ref<File | null>(null)
const imagenParaRecortar = ref<string | null>(null)
const usuarioAutenticado = useSanctumUser<UsuarioInterface>()
const dialog = ref(false)
const dialogRecortar = ref(false)
const input = ref(null)
const cropperRef = ref(null)

// Computed para la URL temporal del blob
const fotoTemporalURL = computed(() => {
  if (fotoComoArchivo.value) {
    return URL.createObjectURL(fotoComoArchivo.value)
  }
  return null
})

// Computed para la imagen actual
const imagenActual = computed(() => {
  return fotoTemporalURL.value || usuarioAutenticado.value?.foto_perfil || usuario
})

const actualizarFotoPerfil = async (): Promise<void> => {
  if (!fotoComoArchivo.value) {
    showToastInfo('No hay foto para actualizar')
    return
  }

  paginaEspera.value = true
  try {
    const formData = new FormData()
    formData.append('nueva_foto_perfil', fotoComoArchivo.value)
    formData.append('user_id', usuarioAutenticado.value.id.toString())

    const res: SendResponseInterface<FotoInterface> = await post('api/usuarios/actualizar/foto/perfil', formData)

    // Limpiar
    fotoComoArchivo.value = null
    imagenParaRecortar.value = null

    await refreshIdentity()
    showToastSuccess(res.message)
  }
  catch (error: any) {
    manejaError(error)
  }
  finally {
    paginaEspera.value = false
  }
}

const nuevaFotoPerfil = (archivos: File | File[] | null) => {
  const archivo = Array.isArray(archivos) ? archivos[0] : archivos

  if (!archivo) {
    showToastError('No se ha seleccionado ninguna imagen')
    return
  }

  // Validaciones
  if (!archivo.type.startsWith('image/')) {
    showToastError('Por favor selecciona una imagen válida')
    return
  }

  if (archivo.size > 5 * 1024 * 1024) {
    showToastError('La imagen debe ser menor a 5MB')
    return
  }

  // Crear URL para el recortador
  const reader = new FileReader()
  reader.onload = (e) => {
    imagenParaRecortar.value = e.target?.result as string
    dialogRecortar.value = true
  }
  reader.readAsDataURL(archivo)
}

const GuardarFotoRecortada = async () => {
  if (!cropperRef.value) return

  const { canvas } = cropperRef.value.getResult()

  if (canvas) {
    // Convertir canvas a Blob y luego a File
    canvas.toBlob(async (blob: Blob | null) => {
      if (blob) {
        const file = new File([blob], 'foto-perfil.jpg', { type: 'image/jpeg' })
        fotoComoArchivo.value = file
        dialogRecortar.value = false
        imagenParaRecortar.value = null


        await actualizarFotoPerfil()
      }
    }, 'image/jpeg', 0.9)
  }
}

const cancelarRecorte = () => {
  dialogRecortar.value = false
  imagenParaRecortar.value = null
  fotoComoArchivo.value = null
  // Resetear el input
  if (input.value) {
    input.value.$el.querySelector('input').value = ''
  }
}



// Limpiar URL del blob cuando el componente se desmonte
onUnmounted(() => {
  if (fotoTemporalURL.value) {
    URL.revokeObjectURL(fotoTemporalURL.value)
  }
})
</script>

<template>
  <VCard v-if="user">
    <VImg
      :style="{ backgroundColor: 'rgba(var(--v-theme-primary), 0.6)' }"
      min-height="200"
      max-height="250"
      cover
    />
    <VCardText class="d-flex align-bottom flex-sm-row flex-column justify-center gap-x-6">
      <div class="d-flex justify-center justify-sm-start">
        <div class="d-flex h-0">
          <VBadge
            class="mx-auto"
            style="cursor: pointer"
            :offset-x="20"
            :offset-y="70"
            location="bottom end"
          >
            <template #badge>
              <VIcon
                icon="tabler-plus"
                v-tooltip="'Agregar fotografía'"
                @click="input?.click()"
              />
            </template>

            <VAvatar
              size="130"
              :image="imagenActual"
              class="user-profile-avatar mx-auto"
              style="cursor: pointer"
              @click="dialog = true"
            />
          </VBadge>

          <VFileInput
            ref="input"
            :multiple="false"
            accept="image/*"
            hide-input
            prepend-icon=""
            @update:model-value="nuevaFotoPerfil"
          />
        </div>

        <!-- Modal para recortar imagen -->
        <VDialog
          v-model="dialogRecortar"
          max-width="600"
          persistent
          :scrim="true"
        >
          <VCard>
            <VCardTitle class="d-flex justify-space-between align-center">
              <span>Recortar imagen</span>
              <VBtn
                icon="tabler-x"
                variant="text"
                size="small"
                @click="cancelarRecorte"
              />
            </VCardTitle>

            <VCardText>
              <div class="cropper-wrapper">
                <Cropper
                  v-if="imagenParaRecortar"
                  ref="cropperRef"
                  :src="imagenParaRecortar"
                  :stencil-props="{
                    aspectRatio: 1,
                  }"
                  :stencil-component="CircleStencil"
                  class="cropper"
                />
              </div>
            </VCardText>

            <VCardActions>
              <VSpacer />
              <VBtn
                color="error"
                variant="tonal"
                @click="cancelarRecorte"
              >
                Cancelar
              </VBtn>
              <VBtn
                color="primary"
                variant="tonal"
                @click="GuardarFotoRecortada"
              >
                <VIcon icon="tabler-photo" start />
                Guardar
              </VBtn>
            </VCardActions>
          </VCard>
        </VDialog>

        <!-- Modal para ver imagen completa -->
        <VDialog v-model="dialog" max-width="600">
          <DialogCloseBtn @click="dialog = false" />
          <VCard>
            <VCardText class="pa-0">
              <VImg
                :src="imagenActual"
                cover
                @click="dialog = false"
              />
            </VCardText>
          </VCard>
        </VDialog>
      </div>

      <div class="user-profile-info w-100 mt-16 pt-6 pt-sm-0 mt-sm-0">
        <h4 class="text-h4 text-center text-sm-start font-weight-medium mb-2">
          {{ user?.nombre }} {{ user?.apellido }}
        </h4>

        <div class="d-flex align-center justify-center justify-sm-space-between flex-wrap gap-5">
          <div class="d-flex flex-wrap justify-center justify-sm-start flex-grow-1 gap-6">
            <span class="d-flex gap-x-2 align-center">
              <VIcon
                v-tooltip="'Puesto de trabajo'"
                size="24"
                icon="tabler-briefcase-2"
              />
              <div class="text-body-1 font-weight-medium">
                {{ user?.usuariosigua?.puesto?.nombre }}
              </div>
            </span>

            <span class="d-flex gap-x-2 align-center">
              <VIcon
                v-tooltip="'Region'"
                size="24"
                icon="tabler-map-pin"
              />
              <div class="text-body-1 font-weight-medium">
                {{ user?.usuariosigua?.region?.nombre }}
              </div>
            </span>

            <span class="d-flex gap-x-2 align-center">
              <VIcon
                v-tooltip="'Fecha inicio de laboral'"
                size="24"
                icon="tabler-calendar"
              />
              <div class="text-body-1 font-weight-medium">
                {{ user && user.usuariosigua?.fecha_labores ? new Date(user?.usuariosigua?.fecha_labores).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '' }}
              </div>
            </span>
          </div>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style lang="scss">
.user-profile-avatar {
  border: 5px solid rgb(var(--v-theme-surface));
  background-color: rgb(var(--v-theme-surface)) !important;
  inset-block-start: -3rem;

  .v-img__img {
    border-radius: 0.125rem;
  }
}

.cropper-wrapper {
  height: 400px;
  background: #f5f5f5;
  border-radius: 8px;
  overflow: hidden;

  .cropper {
    height: 100%;
  }
}
</style>
