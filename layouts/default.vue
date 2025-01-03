<script lang="ts" setup>
import { useConfigStore } from '@core/stores/config'
import { AppContentLayoutNav } from '@layouts/enums'
import { switchToVerticalNavOnLtOverlayNavBreakpoint } from '@layouts/utils'
import { ref, onMounted } from "vue";
import LoadingSpinner from "@/components/Loading.vue";
import { useTheme } from "vuetify";
import { cookieRef } from "@/@layouts/stores/config";

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithHorizontalNav.vue'))
const DefaultLayoutWithVerticalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithVerticalNav.vue'))

const configStore = useConfigStore()

// ℹ️ This will switch to vertical nav when define breakpoint is reached when in horizontal nav layout
// Remove below composable usage if you are not using horizontal nav layout in your app
switchToVerticalNavOnLtOverlayNavBreakpoint()

const { layoutAttrs, injectSkinClasses } = useSkins()

injectSkinClasses()
interface Preferencias {
  color_primario_tema_light: string;
  color_oscurecimiento_primario_tema_light: string;
  color_primario_tema_dark: string;
  color_oscurecimiento_primario_tema_dark: string;
  tema: string;
  tema_color: string;
  aspecto: string;
  esta_navBar_vertical_colapsada: string;
  es_navBar_vertical_semioscura: string;
  esta_navBar_vertical_habilitada: boolean;
  tipo_navBar: string;
  ancho_contenido_aplicacion: string;
  direccion: string;
}

const vuetifyTheme = useTheme();
const loadings = ref(true);

const { user } = useSanctumAuth();
const cliente = useClienteRequest();

const getPreferencias = async (): Promise<void> => {

  try {
    const res = await cliente.get<{ data: Preferencias }>("api/preferencias");

    if (!res.data) {
      asigarValorDefectoCookies();
      return;
    }

    asignarDataACookies(res.data);
  } catch (error) {
    console.error(error);
  }

};


const asignarDataACookies = (data: Preferencias): void => {
  cookieRef("color_primario_tema_light").value = data.color_primario_tema_light;
  cookieRef("color_oscurecimiento_primario_tema_light").value =
    data.color_oscurecimiento_primario_tema_light;

  vuetifyTheme.themes.value["light"].colors.primary = data.color_primario_tema_light;
  vuetifyTheme.themes.value["light"].colors["primary-darken-1"] =
    data.color_oscurecimiento_primario_tema_light;

  cookieRef("color_primario_tema_dark").value = data.color_primario_tema_dark;
  cookieRef("color_oscurecimiento_primario_tema_dark").value =
    data.color_oscurecimiento_primario_tema_dark;

  vuetifyTheme.themes.value["dark"].colors.primary = data.color_primario_tema_dark;
  vuetifyTheme.themes.value["dark"].colors["primary-darken-1"] =
    data.color_oscurecimiento_primario_tema_dark;

  cookieRef("tema").value = data.tema;
  configStore.theme = data.tema;

  cookieRef("tema_color").value = data.tema_color;
  cookieRef("aspecto").value = data.aspecto;
  configStore.skin = data.aspecto;

  cookieRef("esta_navBar_vertical_colapsada").value =
    data.esta_navBar_vertical_colapsada === "1";
  configStore.isVerticalNavCollapsed =
    data.esta_navBar_vertical_colapsada === "1";

  cookieRef("es_navBar_vertical_semioscura").value =
    data.es_navBar_vertical_semioscura === "1";
  configStore.isVerticalNavSemiDark = data.es_navBar_vertical_semioscura === "1";

  cookieRef("esta_navBar_vertical_habilitada").value = data.esta_navBar_vertical_habilitada;

  cookieRef("tipo_navBar").value = data.tipo_navBar;
  configStore.appContentLayoutNav = data.tipo_navBar;

  cookieRef("ancho_contenido_aplicacion").value = data.ancho_contenido_aplicacion;
  configStore.appContentWidth = data.ancho_contenido_aplicacion;

  cookieRef("orientacion").value = data.direccion;
  configStore.isAppRTL = data.direccion === "rtl";

  cookieRef("tiene_preferencias").value = 1;
};

const asigarValorDefectoCookies = (): void => {
  cookieRef("color_primario_tema_light").value = "#7367F0";
  cookieRef("color_oscurecimiento_primario_tema_light").value = "#675DD8";

  vuetifyTheme.themes.value["light"].colors.primary = "#7367F0";
  vuetifyTheme.themes.value["light"].colors["primary-darken-1"] = "#675DD8";

  cookieRef("color_primario_tema_dark").value = "#7367F0";
  cookieRef("color_oscurecimiento_primario_tema_dark").value = "#675DD8";

  vuetifyTheme.themes.value["dark"].colors.primary = "#7367F0";
  vuetifyTheme.themes.value["dark"].colors["primary-darken-1"] = "#675DD8";

  cookieRef("tema").value = "light";
  configStore.theme = "light";

  cookieRef("tema_color").value = "light";

  cookieRef("aspecto").value = "default";
  configStore.skin = "default";

  cookieRef("esta_navBar_vertical_colapsada").value = false;
  configStore.isVerticalNavCollapsed = false;

  cookieRef("esta_navBar_vertical_habilitada").value = true;

  cookieRef("tipo_navBar").value = "vertical";
  configStore.appContentLayoutNav = "vertical";

  cookieRef("ancho_contenido_aplicacion").value = "fluid";
  configStore.appContentWidth = "fluid";

  cookieRef("orientacion").value = "ltr";
  configStore.isAppRTL = false;

  cookieRef("tiene_preferencias").value = 0;
};

const asignarValorDesdeCookies = (): void => {

  configStore.reset();

  vuetifyTheme.themes.value["light"].colors.primary = cookieRef("color_primario_tema_light").value;

  vuetifyTheme.themes.value["light"].colors["primary-darken-1"] = cookieRef("color_oscurecimiento_primario_tema_light").value;

  vuetifyTheme.themes.value["dark"].colors.primary = cookieRef("color_primario_tema_dark").value;

  vuetifyTheme.themes.value["dark"].colors["primary-darken-1"] = cookieRef("color_oscurecimiento_primario_tema_dark").value;

  configStore.isAppRTL = cookieRef("orientacion").value === "rtl";

};

const tienePreferencias = cookieRef<boolean>("tiene_preferencias");


if (!tienePreferencias.value) {

  getPreferencias();

} else {

  asignarValorDesdeCookies();

}
onMounted(() => {
  loadings.value = false;
});
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
