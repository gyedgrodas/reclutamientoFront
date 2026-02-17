<script lang="ts" setup>

import { useGenerateImageVariant } from '@core/composable/useGenerateImageVariant'
import authV2MaskDark from '@images/pages/misc-mask-dark.png'
import authV2MaskLight from '@images/pages/misc-mask-light.png'
import { VNodeRenderer } from '@layouts/components/VNodeRenderer'
import { themeConfig } from '@themeConfig'
import { autenticar } from '@/utils/auth/funciones'

const {refreshIdentity} = useSanctumAuth();
const {post, get} = useClienteRequest()
const route = useRoute();
const FondoOscuro = ref<string | null>(null)
const FondoClaro = ref<string | null>(null)

definePageMeta({
  sanctum: {
    excluded: true,
  },
  layout: 'blank',
  public: true,
});


const configuration = useRuntimeConfig();

const iniciarConAC = ():void => {

  if(configuration.public.entorno == 'local') {

    window.location.href = 'http://localhost:8000/auth/redirect';

  } else {

    window.location.href = `${configuration.public.apiBaseUrl}auth/redirect`;

  }

};

const ObtenerFondo = async () => {
  try {
    const res = await get('api/auth/fondo/login');
    if (res.data.claro) {
      FondoClaro.value = res.data.claro.url;
    }
    if (res.data.oscuro) {
      FondoOscuro.value = res.data.oscuro.url;
    }
  } catch (error: any) {
    console.error('Error al obtener fondo:', error);
  }
}



const isPasswordVisible = ref(false);

const authThemeImg = useGenerateImageVariant(
  FondoClaro,
  FondoOscuro,
  false
).value


console.log('authThemeImg:', authThemeImg.value);

const authThemeMask = useGenerateImageVariant(authV2MaskLight, authV2MaskDark);

const refVForm = ref();
const msgError = ref('');
const loading = ref(false);

const form = ref({
  usuario_dominio: '',
  password: '',
});

const errors = ref({
  usuario_dominio: '',
  password: '',
});

interface RespuestaSolicitud {
  token?: string;
  client_token?: string;
  data: {
    user_id: string;
    registrar_doble_factor: boolean;
  };
}

const onSubmit = async (): Promise<void> => {

  const { valid: isValid } = await refVForm.value?.validate();

  if (isValid) {
    loading.value = true
    try {

      const res: RespuestaSolicitud = await post('api/auth/login', form.value);

      if (noVieneToken(res)) {
        const valorUser = useState<string | null>('user_id', () => null);

        valorUser.value = res.data.user_id;
        if (debeRegistrarDobleFactor(res)) {
          useState<boolean>('registrar_doble_factor', () => true)
          navigateTo('/auth/RegistrarFactorAutenticacion')

          return
        }
        else {
          navigateTo('/auth/DobleFactorAutenticacion')

          return
        }

      } else {
        autenticar(res.token, res.client_token);
        loading.value = false
      }

    }
    catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      loading.value = false
      msgError.value = err.response?.data?.message ?? 'Ocurrió un error inesperado.';

    }
  }
};

const noVieneToken = (res: RespuestaSolicitud): boolean => {
  return !res.token
}

const debeRegistrarDobleFactor = (res: RespuestaSolicitud): boolean => {
  return res.data.registrar_doble_factor
}

onMounted(() => {
   ObtenerFondo()
  if(route.query?.error)
    msgError.value = <string>route.query.error;
  else
    msgError.value = '';
});

if(route.query?.token) {

  let token = route.query?.token as string;

  autenticar(token);

}

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

  <VRow v-if="!route.query?.token"
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
            v-if="authThemeImg"
            :src="authThemeImg"
            :key="authThemeImg"
            class="auth-illustration mt-16 mb-2"
            max-width="5000"
            max-height="700"
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
      class="auth-card-v2 d-flex align-center justify-center position-relative"
      cols="12"
      md="4"
    >
      <VOverlay
        v-model="loading"
        class="align-center justify-center"
        contained
        persistent
        scroll-strategy="none"
      >
<!--        <VProgressCircular-->
<!--          indeterminate-->
<!--          color="primary"-->
<!--          size="50"-->
<!--        />-->
        <div class="loader" />

      </VOverlay>
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
                  placeholder="Ingresa usuario dominio"
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
                  class="mb-8"
                />
                <VBtn
                  block
                  type="submit"
                >
                  Iniciar Sesión
                </VBtn>

                <VBtn
                  block
                  class="mt-2"
                  color="info"
                  variant="outlined"
                  @click="iniciarConAC"
                >
                  <VIcon
                    class="tabler-brand-windows"
                    color="info"
                    size="20"
                  />
                  Inicia sesión con AC
                </VBtn>
              </VCol>
            </VRow>
          </VForm>
        </VCardText>
      </VCard>
    </VCol>
  </VRow>

  <PaginaCargando v-if="route.query?.token"/>

</template>

<style lang="scss">
@use "@core/scss/template/pages/page-auth.scss";
.loader {
  width: 72px;
  height: 72px;
  border-radius: 50%;
  display: inline-block;
  border-top: 4px solid #013e71;
  border-right: 4px solid transparent;
  box-sizing: border-box;
  animation: rotation 1s linear infinite;
}
.loader::after {
  content: "";
  box-sizing: border-box;
  position: absolute;
  left: 0;
  top: 0;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  border-left: 4px solid #19ac00;
  border-bottom: 4px solid transparent;
  animation: rotation 0.5s linear infinite reverse;
}
@keyframes rotation {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
</style>
