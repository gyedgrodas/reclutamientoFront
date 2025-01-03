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
const loadings = ref(false)

const { user } = useSanctumAuth();

const cliente = useClienteRequest()

const getPreferencias = async () => {

  loadings.value = true

  try {

    const res = await cliente.get('api/preferencias')

    if (!res.data) {
      asigarValorDefectoCookies()
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



  cookieRef('color_primario_tema_light').value = res.data.color_primario_tema_light;
  cookieRef('color_oscurecimiento_primario_tema_light').value = res.data.color_oscurecimiento_primario_tema_light;
  vuetifyTheme.themes.value['light'].colors.primary = res.data.color_primario_tema_light
  vuetifyTheme.themes.value['light'].colors['primary-darken-1'] = res.data.color_oscurecimiento_primario_tema_light

  cookieRef('color_primario_tema_dark').value = res.data.color_primario_tema_dark;
  cookieRef('color_oscurecimiento_primario_tema_dark').value = res.data.color_oscurecimiento_primario_tema_dark;
  vuetifyTheme.themes.value['dark'].colors.primary = res.data.color_primario_tema_dark
  vuetifyTheme.themes.value['dark'].colors['primary-darken-1'] = res.data.color_oscurecimiento_primario_tema_dark

  cookieRef('tema').value = res.data.tema;
  configStore.theme = res.data.tema

  //este queda pendiente
  cookieRef('tema_color').value = res.data.tema_color;

  cookieRef('aspecto').value = res.data.aspecto;
  configStore.skin = res.data.aspecto

  cookieRef('esta_navBar_vertical_colapsada').value = res.data.esta_navBar_vertical_colapsada === "1" ? true : false;
  configStore.isVerticalNavCollapsed = res.data.esta_navBar_vertical_colapsada === "1" ? true : false

  cookieRef('es_navBar_vertical_semioscura').value = res.data.es_navBar_vertical_semioscura === "1" ? true : false;
  configStore.isVerticalNavSemiDark = res.data.es_navBar_vertical_semioscura === "1" ? true : false

  cookieRef('esta_navBar_vertical_habilitada').value = res.data.esta_navBar_vertical_habilitada;

  cookieRef('tipo_navBar').value = res.data.tipo_navBar;
  configStore.appContentLayoutNav = res.data.tipo_navBar

  cookieRef('ancho_contenido_aplicacion').value = res.data.ancho_contenido_aplicacion;
  configStore.appContentWidth = res.data.ancho_contenido_aplicacion

  cookieRef('orientacion').value = res.data.direccion;
  configStore.isAppRTL = res.data.direccion === "rtl" ? true : false

  cookieRef('tiene_preferencias').value = 1;
}

const asigarValorDefectoCookies = () => {

  cookieRef('color_primario_tema_light').value = '#7367F0';
  cookieRef('color_oscurecimiento_primario_tema_light').value = '#675DD8';
  vuetifyTheme.themes.value['light'].colors.primary = '#7367F0'
  vuetifyTheme.themes.value['light'].colors['primary-darken-1'] = '#675DD8'

  cookieRef('color_primario_tema_dark').value = '#7367F0';
  cookieRef('color_oscurecimiento_primario_tema_dark').value = '#675DD8';
  vuetifyTheme.themes.value['dark'].colors.primary = '#7367F0'
  vuetifyTheme.themes.value['dark'].colors['primary-darken-1'] = '#675DD8'

  cookieRef('tema').value = 'light';
  configStore.theme = 'light'

  cookieRef('tema_color').value = 'light';

  cookieRef('aspecto').value = 'default';
  configStore.skin = 'default'

  cookieRef('esta_navBar_vertical_colapsada').value = false;
  configStore.isVerticalNavCollapsed = false

  cookieRef('esta_navBar_vertical_habilitada').value = true;

  cookieRef('tipo_navBar').value = 'vertical';
  configStore.appContentLayoutNav = 'vertical'

  cookieRef('ancho_contenido_aplicacion').value = 'fluid';
  configStore.appContentWidth = 'fluid'

  cookieRef('orientacion').value = 'ltr';
  configStore.isAppRTL = false

  cookieRef('tiene_preferencias').value = 0;

}

const asignarValorDesdeCokies = () => {

  configStore.reset();

  vuetifyTheme.themes.value['light'].colors.primary = cookieRef('color_primario_tema_light').value
  vuetifyTheme.themes.value['light'].colors['primary-darken-1'] = cookieRef('color_oscurecimiento_primario_tema_light').value

  vuetifyTheme.themes.value['dark'].colors.primary = cookieRef('color_primario_tema_dark').value
  vuetifyTheme.themes.value['dark'].colors['primary-darken-1'] = cookieRef('color_oscurecimiento_primario_tema_dark').value

}


onMounted(() => {

  if(!cookieRef('tiene_preferencias').value){

    getPreferencias()

  } else {

    asignarValorDesdeCokies()

  }

})

</script>

<template>
  <Component
    v-if="!loadings"
    v-bind="layoutAttrs"
    :is="configStore.appContentLayoutNav === AppContentLayoutNav.Vertical ? DefaultLayoutWithVerticalNav : DefaultLayoutWithHorizontalNav"
  >
    <slot />
  </Component>

  <loading-spinner v-if="loadings" />
  

</template>

<style lang="scss">
// As we are using `layouts` plugin we need its styles to be imported
@use "@layouts/styles/default-layout";
</style>
