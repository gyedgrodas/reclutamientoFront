<script setup lang="ts">

import {ref, onMounted} from 'vue'

const {get, post} = useClienteRequest()
const {showToastSuccess, showToastError} = useToast()

interface InterfaceProps {
  user_id: number,
  autenticar_usuario: boolean
}

const {user_id, autenticar_usuario = false } = defineProps<InterfaceProps>()

interface InterfaceEmits {
  (event: 'codigoConfirmado',  valor: any): void;
}

let emits = defineEmits<InterfaceEmits>();


const qr = ref<string | null>('')
const codigo = ref<string | null>('')

interface RespuestaRequest {
  message: string,
  token?: string,
  data: {
    qr_code: string
  }
}

const obtenerQR = async (): Promise<void> => {
  try {

    const res:RespuestaRequest = await get('api/auth/doble-factor/generar-qr/' + user_id,)

    qr.value = res.data.qr_code

  } catch (error) {

    console.error("Error al obtener el código QR:", error)

  }
}

onMounted(() => {

  obtenerQR()

})

const verificarCodigo = async () => {
  try {

    const res:RespuestaRequest = await post('api/auth/doble-factor/confirmar-codigo', {
      codigo: codigo.value,
      user_id: user_id,
      autenticar_usuario: autenticar_usuario
    })

    if(autenticar_usuario) {

      let token = res.token

      emits('codigoConfirmado',token)

      return

    }

    showToastSuccess(res.message)

    emits('codigoConfirmado', 'codigoConfirmado')

  }catch (error: unknown) {

    const err = error as { response?: { data?: { message?: string } } };

    showToastError(err.response?.data?.message ?? 'Ocurrió un error inesperado.');

  }
}

</script>

<template>

    <h4 class="text-h4 text-center mb-6">
      Add Authenticator App
    </h4>
    <h5 class="text-h5 mb-2">
      Authenticator Apps
    </h5>

    <p class="text-body-1 mb-6">
      Utilizando una aplicación de autenticación como Google Authenticator, Microsoft Authenticator, Authy o 1Password,
      escanee el código QR. Generará un código de 6 dígitos para que lo ingrese a continuación.
    </p>

    <div class="mb-6">

      <VImg :src="'data:image/png;base64,' + qr"
            alt="Código QR"
            class="mx-auto"
            width="150"
      />

    </div>

    <AppTextField
      v-model="codigo"
      name="auth-code"
      label="Ingrese el código"
      placeholder="123 456"
      class="mt-4 mb-6"
    />

    <div class="d-flex justify-end flex-wrap gap-4">
      <!--    <VBtn-->
      <!--      color="secondary"-->
      <!--      variant="tonal"-->
      <!--      @click="resetAuthCode"-->
      <!--    >-->
      <!--      Cancel-->
      <!--    </VBtn>-->

      <VBtn
        type="submit"
        @click="verificarCodigo"
      >
        Continue
        <VIcon
          end
          icon="tabler-arrow-right"
          class="flip-in-rtl"
        />
      </VBtn>
    </div>

</template>



