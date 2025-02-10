<script setup lang="ts">

import authV1BottomShape from '@images/svg/auth-v1-bottom-shape.svg?raw'
import authV1TopShape from '@images/svg/auth-v1-top-shape.svg?raw'
import {themeConfig} from "@themeConfig";
import {VNodeRenderer} from "@layouts/components/VNodeRenderer";

definePageMeta({
  layout: 'blank',
  public: true,
  sanctum: {
    excluded: true,
  }
});

const { refreshIdentity } = useSanctumAuth()

if(!useState('registrar_doble_factor').value) {

  navigateTo('/login')

}

const user_id = useState<number>('user_id').value;

const codigoFueValidado =  async (token: string): Promise<void> => {

  const isSecure = useRequestURL().protocol.startsWith("https");

  const cookie = useCookie('sanctum.token.cookie', { secure: isSecure });

  cookie.value = token;

  await refreshIdentity();

  navigateTo('/')
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

          <AgregaDobleFactorAuth :user_id="user_id"
                                 @codigo-confirmado="codigoFueValidado"
                                 :autenticar_usuario="true"
          />

        </VCardText>

      </VCard>
    </div>
  </div>

</template>
