<script lang="ts" setup>
import {useConfigStore} from '@core/stores/config'
import {AppContentLayoutNav} from '@layouts/enums'
import {switchToVerticalNavOnLtOverlayNavBreakpoint} from '@layouts/utils'
import {ref} from "vue";
import PaginaCargando from "@/components/PaginaCargando.vue";
import {useTheme} from "vuetify";
import {cookieRef} from "@/@layouts/stores/config";
import type {preferenciasUsuario} from '@core/types'

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithHorizontalNav.vue'));
const DefaultLayoutWithVerticalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithVerticalNav.vue'));

const configStore = useConfigStore();

// ℹ️ This will switch to vertical nav when define breakpoint is reached when in horizontal nav layout
// Remove below composable usage if you are not using horizontal nav layout in your app
switchToVerticalNavOnLtOverlayNavBreakpoint();

const {layoutAttrs, injectSkinClasses} = useSkins();

const menu = useState('menu', () => []);

injectSkinClasses();

const vuetifyTheme = useTheme();
const loadings = ref(true);

const {user} = useSanctumAuth();

const {get} = useClienteRequest();

const {showToastError} = useToast();

const {cargandoPagina, paginaEspera} = useCargandoPagina();

const getOpcionesMenu = async (): Promise<void> => {

  try {

    const res = await get("api/menu_opciones", {
      per_page: -1,
    });

    menu.value = res.data.data;

    return res;

  } catch (error) {

    throw error;

  }
};

const getConfiguraciones = async (): Promise<void> => {

  cargandoPagina.value = true;

  try {

    await getOpcionesMenu();

    await getPreferencias();

    // showToastSuccess("Configuraciones obtenidas con éxito");

  } catch (error) {

    showToastError("Error al cargar las configuraciones");

  } finally {

    cargandoPagina.value = false;
  }

};

getConfiguraciones();

const getPreferencias = async (): Promise<void> => {

  if (tienePreferencias.value)
    return asignarValorDesdeCookies();

  try {

    const res = await get<{ data: preferenciasUsuario }>("api/user_preferencias");

    if (!res.data) {
      asigarValorDefectoCookies();
      return;
    }

    await asignarDataACookies(res.data);

    configStore.asignarDataACookiesDefault()

  } catch (error: { message: string }) {

    showToastError(error.message);

  }

};

const asignarDataACookies = (data: preferenciasUsuario): void => {

  cookieRef("color_primario_tema_light", '#7367F0').value = data.color_primario_tema_light;
  cookieRef("color_oscurecimiento_primario_tema_light", '#675DD8').value = data.color_oscurecimiento_primario_tema_light;

  vuetifyTheme.themes.value["light"].colors.primary = data.color_primario_tema_light;
  vuetifyTheme.themes.value["light"].colors["primary-darken-1"] = data.color_oscurecimiento_primario_tema_light;

  cookieRef("color_primario_tema_dark", '#7367F0').value = data.color_primario_tema_dark;
  cookieRef("color_oscurecimiento_primario_tema_dark", '#675DD8').value = data.color_oscurecimiento_primario_tema_dark;

  vuetifyTheme.themes.value["dark"].colors.primary = data.color_primario_tema_dark;
  vuetifyTheme.themes.value["dark"].colors["primary-darken-1"] = data.color_oscurecimiento_primario_tema_dark;

  cookieRef("tema", 'light').value = data.tema;
  configStore.theme = data.tema;

  cookieRef("tema_color", 'light').value = data.tema_color;
  cookieRef("aspecto", 'default').value = data.aspecto;
  configStore.skin = data.aspecto;

  cookieRef("esta_navBar_vertical_colapsada", false).value = data.esta_navBar_vertical_colapsada;
  configStore.isVerticalNavCollapsed = data.esta_navBar_vertical_colapsada == true;

  cookieRef("es_navBar_vertical_semioscura", false).value = data.es_navBar_vertical_semioscura;
  configStore.isVerticalNavSemiDark = data.es_navBar_vertical_semioscura === true;

  cookieRef('navBar_loyout', 'vertical').value = data.navBar_loyout;
  configStore.appContentLayoutNav = data.navBar_loyout;

  cookieRef("ancho_contenido_aplicacion", 'boxed').value = data.ancho_contenido_aplicacion;
  configStore.appContentWidth = data.ancho_contenido_aplicacion;

  cookieRef("orientacion", 'ltr').value = data.direccion;
  configStore.isAppRTL = data.direccion === "rtl";

  cookieRef("navBar_vertical_tipo", 'sticky').value = data.navBar_vertical_tipo;
  configStore.navbarType = data.navBar_vertical_tipo;

  cookieRef("navBar_horizontal_tipo", 'sticky').value = data.navBar_horizontal_tipo;
  configStore.horizontalNavType = data.navBar_horizontal_tipo;

  cookieRef("tiene_preferencias", false).value = true;

};

const asigarValorDefectoCookies = (): void => {

  cookieRef("color_primario_tema_light", "#7367F0").value = "#7367F0";
  cookieRef("color_oscurecimiento_primario_tema_light", "#675DD8").value = "#675DD8";

  vuetifyTheme.themes.value["light"].colors.primary = "#7367F0";
  vuetifyTheme.themes.value["light"].colors["primary-darken-1"] = "#675DD8";

  cookieRef("color_primario_tema_dark", "#7367F0").value = "#7367F0";
  cookieRef("color_oscurecimiento_primario_tema_dark", "#675DD8").value = "#675DD8";

  vuetifyTheme.themes.value["dark"].colors.primary = "#7367F0";
  vuetifyTheme.themes.value["dark"].colors["primary-darken-1"] = "#675DD8";

  cookieRef("tema", "light").value = "light";
  configStore.theme = "light";

  cookieRef("tema_color", "light").value = "light";

  cookieRef("aspecto", "default").value = "default";
  configStore.skin = "default";

  cookieRef("esta_navBar_vertical_colapsada", false).value = false;
  configStore.isVerticalNavCollapsed = false;


  cookieRef('navBar_loyout', "vertical").value = "vertical";
  configStore.appContentLayoutNav = "vertical";

  cookieRef("ancho_contenido_aplicacion", "fluid").value = "fluid";
  configStore.appContentWidth = "fluid";

  cookieRef("orientacion", "ltr").value = "ltr";
  configStore.isAppRTL = false;

  cookieRef("tiene_preferencias", false).value = true;
};

const asignarValorDesdeCookies = (): void => {

  configStore.reset();

  vuetifyTheme.themes.value["light"].colors.primary = cookieRef("color_primario_tema_light", '#7367F0').value;

  vuetifyTheme.themes.value["light"].colors["primary-darken-1"] = cookieRef("color_oscurecimiento_primario_tema_light", '#675DD8').value;

  vuetifyTheme.themes.value["dark"].colors.primary = cookieRef("color_primario_tema_dark", '#7367F0').value;

  vuetifyTheme.themes.value["dark"].colors["primary-darken-1"] = cookieRef("color_oscurecimiento_primario_tema_dark", '#675DD8').value;

  configStore.isAppRTL = cookieRef("orientacion", 'ltr').value === "rtl";

};

const tienePreferencias = cookieRef<boolean>("tiene_preferencias", false);

</script>


<template>
  <Component
    :is="configStore.appContentLayoutNav === AppContentLayoutNav.Vertical ? DefaultLayoutWithVerticalNav : DefaultLayoutWithHorizontalNav"
    v-if="!cargandoPagina"
    v-bind="layoutAttrs"
  >
    <slot/>
  </Component>

  <PaginaCargando v-if="cargandoPagina"/>

  <VOverlay
    v-model="paginaEspera"
    class="align-center justify-center"
    contained
    persistent
    scroll-strategy="none"
  >
    <div class="overlay-content text-center align-center">
      <!-- Indicador circular de carga -->
      <!--      <VProgressCircular-->
      <!--        class="progress-circle"-->
      <!--        color="primary"-->
      <!--        indeterminate-->
      <!--        size="64"-->
      <!--      />-->
      <img alt="" src="../assets/guayacan_logo.svg" style="width: 250px">
      <h3 class="loading-text" style="margin-left: 17px">Por favor, espera...</h3>
    </div>
  </VOverlay>

  <!--  <VOverlay-->
  <!--    v-model="paginaEspera"-->
  <!--    class="custom-overlay"-->
  <!--    contained-->
  <!--    persistent-->
  <!--    scroll-strategy="none"-->
  <!--  >-->
  <!--    <div class="overlay-content">-->
  <!--      &lt;!&ndash; Indicador circular de carga &ndash;&gt;-->
  <!--      <VProgressCircular-->
  <!--        class="progress-circle"-->
  <!--        color="primary"-->
  <!--        indeterminate-->
  <!--        size="64"-->
  <!--      />-->
  <!--      &lt;!&ndash; Texto &ndash;&gt;-->
  <!--      <span class="loading-text">Por favor, espera...</span>-->
  <!--    </div>-->
  <!--  </VOverlay>-->


</template>

<style lang="scss">
// As we are using `layouts` plugin we need its styles to be imported
@use "@layouts/styles/default-layout";
</style>
