<script lang="ts" setup>

import type {UsuarioInterface} from '@/types/usuarios/index.ts';

const user = useState<UsuarioInterface>('sanctum.user.identity');

const mostrarModal2Fa = ref(false)

const codigoFueValidado = () => {

  mostrarModal2Fa.value = false

    user.value.tieneDobleFactorActivo = true

}

</script>

<template>
  <VCol cols="12">
<!--    Verificación de dos pasos-->
    <VCard v-if="user.two_factor_habilitado == '1'">
      <VCardTitle>
        Verificación en dos pasos

        <VChip
          v-if="user.tieneDobleFactorActivo"
          :label="false"
          color="success"
        >
          Activo
        </VChip>

        <VChip
          v-else
          :label="false"
          color="error"
        >
          Inactivo
        </VChip>

      </VCardTitle>

      <VCardText>
        <h5 class="text-h5 text-medium-emphasis mb-4">
          Refuerza la seguridad de tu cuenta con autenticación de dos factores.
        </h5>
        <p class="mb-6">
          Añade una capa extra de protección exigiendo un segundo método de verificación al iniciar sesión.
          Mantén tu cuenta más segura y protegida contra accesos no autorizados.
        </p>

        <VBtn @click="mostrarModal2Fa = true">
          {{ user.tieneDobleFactorActivo ? 'Generar nuevo codigo' : 'Activar ahora' }}
        </VBtn>

        <VDialog
          v-model="mostrarModal2Fa"
          :width="$vuetify.display.smAndDown ? 'auto' : 900"
        >

          <VCard class="pa-2 pa-sm-10">
            <VCardText>
              <AgregaDobleFactorAuth
                :user_id="user.id"
                @codigo-confirmado="codigoFueValidado"
              />
            </VCardText>
          </VCard>

        </VDialog>

      </VCardText>
    </VCard>

  </VCol>
</template>
