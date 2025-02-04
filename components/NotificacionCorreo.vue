<script setup lang="ts">
import { ref } from 'vue'

const { post, get } = useClienteRequest()
const { showToastError, showToastSuccess } = useToast()

const titulo = 'Notificación de correo'
const usuarios = ref([])
const selectedUserId = ref(null)
const telefono = ref('')

const cargarUsuarios = async (newFilter = null) => {
  try {
    const response = await get(`/api/users?filter[nombre]=${newFilter}`)

    usuarios.value = response.data.data
  }
  catch (error) {
    console.error('Error al cargar los usuarios', error)
  }
}

const enviarCorreo = async () => {
  try {
    await post('/api/desarrollo/notificaciones', {

      user_id: selectedUserId.value,
    })

    showToastSuccess('Notificación enviada')
  }
  catch (error) {
    showToastError('Error al enviar la notificación')
    console.error('Error al enviar la notificación', error)
  }
}

const enviarSMS = async () => {
  try {
    await post('/api/desarrollo/mensajes', {
      telefono: telefono.value,
      mensaje: 'Hola, este es un mensaje de prueba',
    })

    showToastSuccess('Mensaje enviado correctamente')
    telefono.value = ''
  }
  catch (error) {
    showToastError('Error al enviar la notificación')
    console.error('Error al enviar la notificación', error)
  }
}

cargarUsuarios()
</script>

<template>
  <VCard :title="titulo">
    <VCardText>
      <VRow>
        <VCol cols="6">
          <VAutocomplete
            v-model="selectedUserId"
            :items="usuarios"
            item-title="nombre"
            item-value="id"
            label="Selecciona un usuario"
            outlined
            clearable
            @update:search="cargarUsuarios"
          />
          <VCol cols="6">
            <VBtn
              color="primary"
              outlined
              @click="enviarCorreo"
            >
              Enviar correo
            </VBtn>
          </VCol>
        </VCol>

        <VCol cols="6">
          <VTextField
            v-model="telefono"
            class="mb-4"
            label="Teléfono"
            outlined
            clearable
          />
          <VBtn
            color="primary"
            outlined
            @click="enviarSMS"
          >
            Enviar SMS
          </VBtn>
        </VCol>
      </VRow>
    </VCardText>
  </VCard>
</template>
