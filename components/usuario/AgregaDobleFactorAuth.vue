<script setup lang="ts">

import { ref, onMounted } from 'vue'

const { post } = useClienteRequest()
const { user } = useSanctumAuth()

const { showToastSuccess, showToastError } = useToast()

const qr = ref('')

const codigo = ref('')

const obtenerQR = async () => {
  try {

    const res = await post('api/auth/doble-factor/crear', {})

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

    const res: {message: string} = await post('api/auth/doble-factor/confirmar-codigo', {
      codigo: codigo.value
    })

    showToastSuccess(res.message)

  } catch (error) {

    showToastError(error)

  }
}

</script>

<template>

  <VCol class="v-col-12 text-center">

    <img :src="'data:image/png;base64,' + qr" alt="Código QR de prueba">

    <VTextField v-model="codigo"
                label="Código de verificación"
                outlined
                type="number"
    ></VTextField>

    <VBtn @click="verificarCodigo" block>Verificar</VBtn>

  </VCol>

</template>
