<script lang="ts" setup>
import type {UsuarioInterface} from '@/types/usuarios/index.ts';
import {useTheme} from "vuetify";

const user = useState<UsuarioInterface>('sanctum.user.identity');

const {realizarPregunta} = useToast();
const colorPrimario = ref('')
const mostrarModal2Fa = ref(false)

const codigoFueValidado = () => {

  mostrarModal2Fa.value = false

  user.value.tieneDobleFactorActivo = true

}

const levantarModalNuevoCodigo = async () => {

  let datos = {
    titulo: 'Generar nuevo Código',
    message: 'Si generas un nuevo código, el anterior dejará de funcionar. ¿Estás seguro de continuar?',
    icono: 'warning',
    texto_btn_confirmar: 'Generar nuevo código',
    color_cancelar: '#6c757d',
    color_confirmar: colorPrimario.value,
  }

  if (await realizarPregunta(datos)) {

    mostrarModal2Fa.value = true

  }

}
const vuetifyTheme = useTheme()

// Detectar el tema actual (oscuro o claro)
const colorTema = ref(vuetifyTheme.global.name.value)



watchEffect(() => {
  const isDarkMode = colorTema.value === 'dark'

  colorPrimario.value = isDarkMode
    ? vuetifyTheme.themes.value.dark.colors.primary
    : vuetifyTheme.themes.value.light.colors.primary

})

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

        <VBtn @click="levantarModalNuevoCodigo">
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
