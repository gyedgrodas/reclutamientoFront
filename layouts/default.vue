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

import {ref, onMounted} from 'vue'
import LoadingSpinner from "@/components/Loading.vue";
import {useTheme} from "vuetify";
const vuetifyTheme = useTheme()

import {cookieRef} from '@/@layouts/stores/config'
const loadings = ref(true)

const cliente = useClienteRequest()

const getPreferencias = async () => {

  try {

    const res = await cliente.get('api/preferencias')

    if (!res.data) {
      loadings.value = false
      return
    }

    asignarDataACokkies(res)

  } catch (error) {

    console.log(error)

  }

  loadings.value = false

}

const asignarDataACokkies = (res) => {
  cookieRef('color_primario_tema_claro', res.data.color_primario_tema_claro).value = res.data.color_primario_tema_claro;
  cookieRef('color_oscurecimiento_primario_tema_claro', res.data.color_primario_tema_claro).value = res.data.color_oscurecimiento_primario_tema_claro;
  vuetifyTheme.themes.value['light'].colors.primary = res.data.color_primario_tema_claro
  vuetifyTheme.themes.value['light'].colors['primary-darken-1'] = res.data.color_oscurecimiento_primario_tema_claro

  cookieRef('color_primario_tema_oscuro', res.data.color_primario_tema_oscuro).value = res.data.color_primario_tema_oscuro;
  cookieRef('color_oscurecimiento_primario_tema_oscuro', res.data.color_primario_tema_oscuro).value = res.data.color_oscurecimiento_primario_tema_oscuro;
  vuetifyTheme.themes.value['dark'].colors.primary = res.data.color_primario_tema_oscuro
  vuetifyTheme.themes.value['dark'].colors['primary-darken-1'] = res.data.color_oscurecimiento_primario_tema_oscuro

  cookieRef('tema', res.data.tema).value = res.data.tema;
  configStore.theme = res.data.tema

  //este queda pendiente
  cookieRef('tema_color', res.data.tema_color).value = res.data.tema_color;

  cookieRef('aspecto', res.data.aspecto).value = res.data.aspecto;
  configStore.skin = res.data.aspecto

  cookieRef('esta_navBar_vertical_colapsada', res.data.esta_navBar_vertical_colapsada === "1" ? true : false).value = res.data.esta_navBar_vertical_colapsada === "1" ? true : false;
  configStore.isVerticalNavCollapsed = res.data.esta_navBar_vertical_colapsada === "1" ? true : false

  cookieRef('esta_navBar_vertical_habilitada', res.data.esta_navBar_vertical_habilitada).value = res.data.esta_navBar_vertical_habilitada;

  cookieRef('tipo_navBar', res.data.tipo_navBar).value = res.data.tipo_navBar;
  configStore.appContentLayoutNav = res.data.tipo_navBar

  cookieRef('ancho_contenido_aplicacion', res.data.ancho_contenido_aplicacion).value = res.data.ancho_contenido_aplicacion;
  configStore.appContentWidth = res.data.ancho_contenido_aplicacion

  cookieRef('orientacion', res.data.direccion).value = res.data.direccion;
  configStore.isAppRTL = res.data.direccion === "rtl" ? true : false

  cookieRef('tiene_preferencias').value = 1;
}

onMounted(() => {

  if(!cookieRef('tiene_preferencias').value){

    getPreferencias()

  }

})

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
