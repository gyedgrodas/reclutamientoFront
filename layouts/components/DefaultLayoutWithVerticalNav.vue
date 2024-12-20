<script lang="ts" setup>
import navItems from '@/navigation/vertical'
import { themeConfig } from '@themeConfig'
const vuetifyTheme = useTheme()

// Components
import Footer from '@/layouts/components/Footer.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import NavBarI18n from '@core/components/I18n.vue'

// @layouts plugin
import { VerticalNavLayout } from '@layouts'

import { ref } from 'vue'
import LoadingSpinner from "@/components/Loading.vue";
import {useTheme} from "vuetify";

const loadings = ref(true)

const cliente = useClienteRequest()

const getPreferencias = async () => {

  try {

    const data = await cliente.get('api/preferencias')

    if (!data) {
      loadings.value = false
      return
    }

    console.log(data.color_primario_tema_claro)

    console.log(data.tema_claro_color_oscurecimiento_primario)

    vuetifyTheme.themes.value[data.combinacion_colores].colors.primary = data.color_primario_tema_claro
    vuetifyTheme.themes.value[data.combinacion_colores].colors['primary-darken-1'] = data.tema_claro_color_oscurecimiento_primario

    //asignar a las variables reactivas las preferencias de los usuarios
    //
    // theme: configStore.theme,
    //   skin: configStore.skin,
    //   isVerticalNavSemiDark: configStore.isVerticalNavSemiDark,
    //   appContentLayoutNav: configStore.appContentLayoutNav,
    //   appContentWidth: configStore.appContentWidth,
    //   isAppRTL: configStore.isAppRTL,
    //   isVerticalNavCollapsed: configStore.isVerticalNavCollapsed,
    //   color_primario: vuetifyTheme.themes.value[vuetifyTheme.name.value].colors.primary,
    //   Color_oscuro_primario: vuetifyTheme.themes.value[vuetifyTheme.name.value].colors['primary-darken-1'],


  } catch (error) {

    console.log(error)

  }

  loadings.value = false


}

getPreferencias()


</script>

<template>
  <VerticalNavLayout :nav-items="navItems" v-if="!loadings">
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <IconBtn
          id="vertical-nav-toggle-btn"
          class="ms-n3 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon
            size="26"
            icon="tabler-menu-2"
          />
        </IconBtn>

        <NavbarThemeSwitcher />

        <VSpacer />

        <NavBarI18n
          v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
          :languages="themeConfig.app.i18n.langConfig"
        />
        <UserProfile />
      </div>
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
     <TheCustomizer />
  </VerticalNavLayout>

  <loading-spinner v-else />

</template>
