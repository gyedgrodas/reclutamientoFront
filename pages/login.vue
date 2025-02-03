<script lang="ts" setup>

import AuthProvider from '@/views/pages/authentication/AuthProvider.vue'
import {useGenerateImageVariant} from '@core/composable/useGenerateImageVariant'
import authV2LoginIllustrationBorderedDark from '@images/pages/auth-v2-login-illustration-bordered-dark.png'
import authV2LoginIllustrationBorderedLight from '@images/pages/auth-v2-login-illustration-bordered-light.png'
import authV2LoginIllustrationDark from '@images/pages/auth-v2-login-illustration-dark.png'
import authV2LoginIllustrationLight from '@images/pages/auth-v2-login-illustration-light.png'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import {VNodeRenderer} from '@layouts/components/VNodeRenderer'
import {themeConfig} from '@themeConfig'

const {login} = useSanctumAuth();
const user = useSanctumUser();

definePageMeta({
  layout: 'blank',
  public: true,
});

const isPasswordVisible = ref(false);

const authThemeImg = useGenerateImageVariant(
  authV2LoginIllustrationLight,
  authV2LoginIllustrationDark,
  authV2LoginIllustrationBorderedLight,
  authV2LoginIllustrationBorderedDark,
  true);

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark);

const refVForm = ref();
const msgError = ref('');

const form = ref({
  usuario_dominio: '',
  password: '',
});

const errors = ref({
  usuario_dominio: '',
  password: '',
});

const onSubmit = async () => {
  const {valid: isValid} = await refVForm.value?.validate();
  if (isValid) {
    try {
      // Realizar login primero (si aún no se ha hecho)
      await login(form.value)

    } catch (error) {

      // navigateTo('/auth/DobleFactorAutenticacion')

      if (error.message === 'Token was not returned from the API') {


        navigateTo('/auth/DobleFactorAutenticacion')

        return

      }

      msgError.value = error?.response?._data?.message || 'Ocurrió un error inesperado.'

    }
  }
};


watch(form, () => {
  msgError.value = ''
}, {deep: true})

</script>

<template>
  <a href="javascript:void(0)">
    <div class="auth-logo d-flex align-center gap-x-3">
      <VNodeRenderer :nodes="themeConfig.app.logo"/>
      <h1 class="auth-title">
        {{ themeConfig.app.title }}
      </h1>
    </div>
  </a>

  <VRow
    class="auth-wrapper bg-surface"
    no-gutters
  >
    <VCol
      class="d-none d-md-flex"
      md="8"
    >
      <div class="position-relative bg-background w-100 me-0">
        <div
          class="d-flex align-center justify-center w-100 h-100"
          style="padding-inline: 6.25rem;"
        >
          <VImg
            :src="authThemeImg"
            class="auth-illustration mt-16 mb-2"
            max-width="613"
          />
        </div>

        <img
          :src="authThemeMask"
          alt="auth-footer-mask"
          class="auth-footer-mask flip-in-rtl"
          height="280"
          width="100"
        >
      </div>
    </VCol>

    <VCol
      class="auth-card-v2 d-flex align-center justify-center"
      cols="12"
      md="4"
    >
      <VCard
        :max-width="500"
        class="mt-12 mt-sm-0 pa-6"
        flat
      >
        <VCardText>
          <h4 class="text-h4 mb-1">
            Bienvenido a <span class="text-capitalize">{{ themeConfig.app.title }}</span>! 👋🏻
          </h4>
          <p class="mb-0">
            Iniciar sesión con tu cuenta
          </p>
          <VAlert
            v-if="msgError"
            color="error"
            variant="tonal"
          >
            <p class="text-sm mb-0">
              <strong>{{ msgError }}</strong>
            </p>
          </VAlert>
        </VCardText>
        <VCardText>
          <VForm
            ref="refVForm"
            @submit.prevent="onSubmit"
          >
            <VRow>
              <!-- email -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.usuario_dominio"
                  :error-messages="errors.usuario_dominio"
                  :rules="[requiredValidator, usuarioValidator]"
                  autofocus
                  label="Usuario Dominio"
                  placeholder="gyxxxxxx"
                  type="email"
                />
              </VCol>

              <!-- password -->
              <VCol cols="12">
                <AppTextField
                  v-model="form.password"
                  :append-inner-icon="isPasswordVisible ? 'tabler-eye-off' : 'tabler-eye'"
                  :rules="[requiredValidator]"
                  :type="isPasswordVisible ? 'text' : 'password'"
                  label="Password"
                  placeholder="············"
                  @click:append-inner="isPasswordVisible = !isPasswordVisible"
                />

                <div class="d-flex align-center flex-wrap justify-space-between my-6">
                  <VCheckbox
                    v-model="form.remember"
                    label="Remember me"
                  />
                  <a
                    class="text-primary"
                    href="javascript:void(0)"
                  >
                    Forgot Password?
                  </a>
                </div>

                <VBtn
                  block
                  type="submit"
                >
                  Login
                </VBtn>
              </VCol>

              <!-- create account -->
              <VCol
                class="text-body-1 text-center"
                cols="12"
              >
                <span class="d-inline-block">
                  New on our platform?
                </span>
                <a
                  class="text-primary ms-1 d-inline-block text-body-1"
                  href="javascript:void(0)"
                >
                  Create an account
                </a>
              </VCol>

              <VCol
                class="d-flex align-center"
                cols="12"
              >
                <VDivider/>
                <span class="mx-4">or</span>
                <VDivider/>
              </VCol>

              <!-- auth providers -->
              <VCol
                class="text-center"
                cols="12"
              >
                <AuthProvider/>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>
</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
</style>
