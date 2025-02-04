<script setup lang="ts">
import authV1BottomShape from '@images/svg/auth-v1-bottom-shape.svg?raw'
import authV1TopShape from '@images/svg/auth-v1-top-shape.svg?raw'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'

definePageMeta({
  layout: 'blank',
  public: true,
  sanctum: {
    excluded: true,
  }
});

if(!useState('idUsuarioTemporal').value) {

  navigateTo('/login')

}

const { post } = useClienteRequest()

const { showToastError, showToastSuccess } = useToast()

const {refreshIdentity} = useSanctumAuth();
const codigo = ref('')
const cargando = ref(false)

const verificarCodigo = async () => {

  cargando.value = true
  try {

    const usuarioTemportal = useState('idUsuarioTemporal')

    const res: {message: string} = await post('api/auth/doble-factor/validar-codigo-auth', {
      codigo: codigo.value,
      user_id: usuarioTemportal.value
    })

    const isSecure = useRequestURL().protocol.startsWith("https");

    const cookie = useCookie('sanctum.token.cookie', { secure: isSecure });

    cookie.value = res.token;

    await refreshIdentity();

    navigateTo('/')

  } catch (error) {

    showToastError(error?.response?.data?.message)

  } finally {

      cargando.value = false
  }
}

</script>

<template>
  <div class="auth-wrapper d-flex align-center justify-center pa-4">
    <div class="position-relative my-sm-16">
      <!-- 👉 Top shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1TopShape })"
        class="text-primary auth-v1-top-shape d-none d-sm-block"
      />

      <!-- 👉 Bottom shape -->
      <VNodeRenderer
        :nodes="h('div', { innerHTML: authV1BottomShape })"
        class="text-primary auth-v1-bottom-shape d-none d-sm-block"
      />

      <!-- 👉 Auth card -->
      <VCard
        class="auth-card"
        max-width="460"
        :class="$vuetify.display.smAndUp ? 'pa-6' : 'pa-0'"
      >
        <VCardItem class="justify-center">
          <VCardTitle>
            <NuxtLink to="/">
              <div class="app-logo">
                <VNodeRenderer :nodes="themeConfig.app.logo" />
                <h1 class="app-logo-title">
                  {{ themeConfig.app.title }}
                </h1>
              </div>
            </NuxtLink>
          </VCardTitle>
        </VCardItem>

        <VCardText>
          <h4 class="text-h4 mb-1">
            Verificación en dos pasos
          </h4>
          <p class="mb-1">
            Hemos enviado un código de verificación a Microsoft Authenticator en tu dispositivo móvil. Por favor, ingrésalo en el campo a continuación para continuar.
          </p>

        </VCardText>

        <VCardText>
          <VForm @submit.prevent="() => {}">
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <h6 class="text-body-1">
                  Escribe tu código de seguridad de 6 dígitos
                </h6>
                <VOtpInput
                  v-model="codigo"
                  type="number"
                  class="pa-0"
                  @finish="verificarCodigo"
                  :disabled="cargando"
                />
              </VCol>

              <VCol cols="12">
                <VBtn
                  block
                  @click="verificarCodigo"
                  :loading="cargando"
                >
                  Verificar
                </VBtn>
              </VCol>

            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </div>
  </div>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth";

.v-codigo-input {
  .v-codigo-input__content {
    padding-inline: 0;
  }
}
</style>
