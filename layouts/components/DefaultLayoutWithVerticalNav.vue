<script lang="ts" setup>
import navItems from '@/navigation/vertical'
import {themeConfig} from '@themeConfig'

const vuetifyTheme = useTheme()
import {cookieRef} from '@/@layouts/stores/config'
const configStore = useConfigStore()

// Components
import Footer from '@/layouts/components/Footer.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import NavBarI18n from '@core/components/I18n.vue'

// @layouts plugin
import {layoutConfig, VerticalNavLayout} from '@layouts'

import {ref} from 'vue'
import LoadingSpinner from "@/components/Loading.vue";
import {useTheme} from "vuetify";
import {staticPrimaryColor, staticPrimaryDarkenColor} from "@/plugins/vuetify/theme";
import {useConfigStore} from "@core/stores/config";

const loadings = ref(true)

const cliente = useClienteRequest()

const getPreferencias = async () => {

  try {

    const data = await cliente.get('api/preferencias')

    if (!data) {
      loadings.value = false
      return
    }

    cookieRef('color_primario_tema_claro', data.color_primario_tema_claro).value = data.color_primario_tema_claro;
    cookieRef('color_oscurecimiento_primario_tema_claro', data.color_primario_tema_claro).value = data.color_oscurecimiento_primario_tema_claro;
    vuetifyTheme.themes.value['light'].colors.primary = data.color_primario_tema_claro
    vuetifyTheme.themes.value['light'].colors['primary-darken-1'] = data.color_oscurecimiento_primario_tema_claro

    cookieRef('color_primario_tema_oscuro', data.color_primario_tema_oscuro).value = data.color_primario_tema_oscuro;
    cookieRef('color_oscurecimiento_primario_tema_oscuro', data.color_primario_tema_oscuro).value = data.color_oscurecimiento_primario_tema_oscuro;
    vuetifyTheme.themes.value['dark'].colors.primary = data.color_primario_tema_oscuro
    vuetifyTheme.themes.value['dark'].colors['primary-darken-1'] = data.color_oscurecimiento_primario_tema_oscuro

    cookieRef('tema', data.tema).value = data.tema;
    configStore.theme = data.tema

    //este queda pendiente
    cookieRef('tema_color', data.tema_color).value = data.tema_color;


    cookieRef('aspecto', data.aspecto).value = data.aspecto;
    configStore.skin = data.aspecto


    cookieRef('esta_navBar_vertical_colapsada', data.esta_navBar_vertical_colapsada === "1" ? true : false).value = data.esta_navBar_vertical_colapsada === "1" ? true : false;
    configStore.isVerticalNavCollapsed = data.esta_navBar_vertical_colapsada === "1" ? true : false

    cookieRef('esta_navBar_vertical_habilitada', data.esta_navBar_vertical_habilitada).value = esta_navBar_vertical_habilitada;




        // cookieRef<string | null>(`${vuetifyTheme.name.value}color_primario_tema_oscuro`, null).value = data.color_primario_tema_claro
    // cookieRef<string | null>(`${vuetifyTheme.name.value}color_oscurecimiento_primario_tema_oscuro`, null).value = data.color_oscurecimiento_primario_tema_claro
    //
    // console.log('Los valores que tienen actualmente tienen las cokkies')
    // console.log(cookieRef<string | null>(`${vuetifyTheme.name.value}color_primario_tema_oscuro`, null).value)
    // console.log(cookieRef<string | null>(`${vuetifyTheme.name.value}color_oscurecimiento_primario_tema_oscuro`, null).value)
    //
    // console.log('Los valores que tienen actualmente las configuraciones de la aplicacion')
    // console.log(vuetifyTheme.themes.value[data.tema_color].colors.primary)
    // console.log(vuetifyTheme.themes.value[data.tema_color].colors['primary-darken-1'])

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

        <NavbarThemeSwitcher/>

        <VSpacer/>

        <NavBarI18n
          v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
          :languages="themeConfig.app.i18n.langConfig"
        />
        <UserProfile/>
      </div>
    </template>

    <!-- 👉 Pages -->
    <slot/>

    <!-- 👉 Footer -->
    <template #footer>
      <Footer/>
    </template>

    <!-- 👉 Customizer -->
    <TheCustomizer/>
  </VerticalNavLayout>

  <loading-spinner v-else/>

</template>
