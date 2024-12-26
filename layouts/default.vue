<script lang="ts" setup>
import { useConfigStore } from '@core/stores/config'
import { AppContentLayoutNav } from '@layouts/enums'
import { switchToVerticalNavOnLtOverlayNavBreakpoint } from '@layouts/utils'

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithHorizontalNav.vue'))
const DefaultLayoutWithVerticalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithVerticalNav.vue'))

const configStore = useConfigStore()

// ℹ️ This will switch to vertical nav when define breakpoint is reached when in horizontal nav layout
// Remove below composable usage if you are not using horizontal nav layout in your app
switchToVerticalNavOnLtOverlayNavBreakpoint()

const { layoutAttrs, injectSkinClasses } = useSkins()

injectSkinClasses()

import {ref} from 'vue'
import LoadingSpinner from "@/components/Loading.vue";
import {useTheme} from "vuetify";
const vuetifyTheme = useTheme()

import {cookieRef} from '@/@layouts/stores/config'
const loadings = ref(true)

const cliente = useClienteRequest()

const getPreferencias = async () => {

  try {

    const data = await cliente.get('api/preferencias')

    if (!data.data) {
      loadings.value = false
      return
    }

    cookieRef('color_primario_tema_claro', data.data.color_primario_tema_claro).value = data.data.color_primario_tema_claro;
    cookieRef('color_oscurecimiento_primario_tema_claro', data.data.color_primario_tema_claro).value = data.data.color_oscurecimiento_primario_tema_claro;
    vuetifyTheme.themes.value['light'].colors.primary = data.data.color_primario_tema_claro
    vuetifyTheme.themes.value['light'].colors['primary-darken-1'] = data.data.color_oscurecimiento_primario_tema_claro

    cookieRef('color_primario_tema_oscuro', data.data.color_primario_tema_oscuro).value = data.data.color_primario_tema_oscuro;
    cookieRef('color_oscurecimiento_primario_tema_oscuro', data.data.color_primario_tema_oscuro).value = data.data.color_oscurecimiento_primario_tema_oscuro;
    vuetifyTheme.themes.value['dark'].colors.primary = data.data.color_primario_tema_oscuro
    vuetifyTheme.themes.value['dark'].colors['primary-darken-1'] = data.data.color_oscurecimiento_primario_tema_oscuro

    cookieRef('tema', data.data.tema).value = data.data.tema;
    configStore.theme = data.data.tema

    //este queda pendiente
    cookieRef('tema_color', data.data.tema_color).value = data.data.tema_color;

    cookieRef('aspecto', data.data.aspecto).value = data.data.aspecto;
    configStore.skin = data.data.aspecto

    cookieRef('esta_navBar_vertical_colapsada', data.data.esta_navBar_vertical_colapsada === "1" ? true : false).value = data.data.esta_navBar_vertical_colapsada === "1" ? true : false;
    configStore.isVerticalNavCollapsed = data.data.esta_navBar_vertical_colapsada === "1" ? true : false

    cookieRef('esta_navBar_vertical_habilitada', data.data.esta_navBar_vertical_habilitada).value = data.data.esta_navBar_vertical_habilitada;

    cookieRef('tipo_navBar', data.data.tipo_navBar).value = data.data.tipo_navBar;
    configStore.appContentLayoutNav = data.data.tipo_navBar

    cookieRef('ancho_contenido_aplicacion', data.data.ancho_contenido_aplicacion).value = data.data.ancho_contenido_aplicacion;
    configStore.appContentWidth = data.data.ancho_contenido_aplicacion

    console.log(data.data.direccion)
    cookieRef('orientacion', data.data.direccion).value = data.data.direccion;
    configStore.isAppRTL = data.data.direccion === "rtl" ? true : false



  } catch (error) {

    console.log(error)

  }

  loadings.value = false


}

getPreferencias()

</script>

<template>
  <Component
    v-bind="layoutAttrs"
    :is="configStore.appContentLayoutNav === AppContentLayoutNav.Vertical ? DefaultLayoutWithVerticalNav : DefaultLayoutWithHorizontalNav"
  >
    <slot />
  </Component>
</template>

<style lang="scss">
// As we are using `layouts` plugin we need its styles to be imported
@use "@layouts/styles/default-layout";
</style>
