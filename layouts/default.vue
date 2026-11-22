<script lang="ts" setup>
import {useConfigStore} from '@core/stores/config'
import {AppContentLayoutNav} from '@layouts/enums'
import {switchToVerticalNavOnLtOverlayNavBreakpoint} from '@layouts/utils'
import PaginaCargando from "@/components/layout/PaginaCargando.vue";
import {useTheme} from "vuetify";
import {cookieRef} from "@/@layouts/stores/config";
import type {preferenciasUsuario} from '@core/types'

const { layoutAttrs, injectSkinClasses } = useSkins()
const { user } = useSanctumAuth()
const { get } = useClienteRequest()
const { showToastError } = useToast()
const { cargandoPagina, paginaEspera } = useCargandoPagina()
import {useIsMobile} from "@/composables/useIsMobile";
const { isMobile } = useIsMobile()

const DefaultLayoutWithHorizontalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithHorizontalNav.vue'));
const DefaultLayoutWithVerticalNav = defineAsyncComponent(() => import('./components/DefaultLayoutWithVerticalNav.vue'));
const MobileLayoutWithBottomNav = defineAsyncComponent(() => import("./components/MobileLayoutWithBottomNav.vue"));

const configStore = useConfigStore();
const vuetifyTheme = useTheme();

switchToVerticalNavOnLtOverlayNavBreakpoint();
injectSkinClasses();

const menu = useState('menu', () => []);


const currentLayout = computed(() => {
  if (isMobile.value) return MobileLayoutWithBottomNav;

  return configStore.appContentLayoutNav === AppContentLayoutNav.Vertical
    ? DefaultLayoutWithVerticalNav
    : DefaultLayoutWithHorizontalNav;
});



  const contieneRutaEnMenu = (items: any[], rutaBuscada: string): boolean => {
    return items.some(item => {
      if (item?.ruta === rutaBuscada)
        return true
      if (Array.isArray(item?.children) && item.children.length > 0)
        return contieneRutaEnMenu(item.children, rutaBuscada)

      return false
    })
  }

  const asegurarOpcionesReclutamiento = (items: any[]): any[] => {
    if (!Array.isArray(items))
      return items

    const copia = [...items]

    if (!contieneRutaEnMenu(copia, 'admin-solicitudes-vacante')) {
      const opcionSolicitudes = {
        id: -101,
        titulo: 'Solicitudes de vacante',
        icono: 'tabler-file-check',
        ruta: 'admin-solicitudes-vacante',
        titulo_seccion: null,
        parent_id: null,
        action: 'ver solicitudes vacante',
        subject: 'SolicitudVacante',
        children: [],
      }

      const indiceVacantes = copia.findIndex(item => item?.ruta === 'admin-vacantes')
      if (indiceVacantes !== -1)
        copia.splice(indiceVacantes, 0, opcionSolicitudes)
      else
        copia.push(opcionSolicitudes)
    }

    return copia
  }

  const getOpcionesMenu = async (): Promise<void> => {
    try {
      const res = await get("api/menu_opciones", {
        params: { per_page: -1 },
      });
      menu.value = asegurarOpcionesReclutamiento(res.data.data);
      return res;
    }
    catch (error) {
      throw error;
    }
  };

const getConfiguraciones = async (): Promise<void> => {
  cargandoPagina.value = true;
  try {
    await getOpcionesMenu();
    await getPreferencias();
  }
  catch (error) {
    console.log(error)
  }
  finally {
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
  }
  catch (error: { message: string }) {
    showToastError(error.message);
  }
};

const asignarDataACookies = (data: preferenciasUsuario): void => {

  cookieRef("color_primario_tema_light", '#32A343').value = data.color_primario_tema_light;
  cookieRef("color_oscurecimiento_primario_tema_light", '#32A343').value = data.color_oscurecimiento_primario_tema_light;

  vuetifyTheme.themes.value["light"].colors.primary = data.color_primario_tema_light;
  vuetifyTheme.themes.value["light"].colors["primary-darken-1"] = data.color_oscurecimiento_primario_tema_light;

  cookieRef("color_primario_tema_dark", '#32A343').value = data.color_primario_tema_dark;
  cookieRef("color_oscurecimiento_primario_tema_dark", '#32A343').value = data.color_oscurecimiento_primario_tema_dark;

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

  const navBarLayoutCookie = cookieRef('navBar_loyout', '');
  navBarLayoutCookie.value = data.navBar_loyout ?? 'vertical';
  configStore.appContentLayoutNav = navBarLayoutCookie.value;

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

  cookieRef("color_primario_tema_light", "#32A343").value = "#32A343";
  cookieRef("color_oscurecimiento_primario_tema_light", "#32A343").value = "#32A343";

  vuetifyTheme.themes.value["light"].colors.primary = "#32A343";
  vuetifyTheme.themes.value["light"].colors["primary-darken-1"] = "#32A343";

  cookieRef("color_primario_tema_dark", "#32A343").value = "#32A343";
  cookieRef("color_oscurecimiento_primario_tema_dark", "#32A343").value = "#32A343";

  vuetifyTheme.themes.value["dark"].colors.primary = "#32A343";
  vuetifyTheme.themes.value["dark"].colors["primary-darken-1"] = "#32A343";

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

  cookieRef("tiene_preferencias", false).value = false;
};

const asignarValorDesdeCookies = (): void => {

  configStore.reset();

  vuetifyTheme.themes.value["light"].colors.primary = cookieRef("color_primario_tema_light", '#32A343').value;

  vuetifyTheme.themes.value["light"].colors["primary-darken-1"] = cookieRef("color_oscurecimiento_primario_tema_light", '#32A343').value;

  vuetifyTheme.themes.value["dark"].colors.primary = cookieRef("color_primario_tema_dark", '#32A343').value;

  vuetifyTheme.themes.value["dark"].colors["primary-darken-1"] = cookieRef("color_oscurecimiento_primario_tema_dark", '#32A343').value;

  configStore.isAppRTL = cookieRef("orientacion", 'ltr').value === "rtl";

};

const tienePreferencias = cookieRef<boolean>("tiene_preferencias", false);

</script>


<template>
  <Component
    :is="currentLayout"
    v-if="!cargandoPagina"
    v-bind="layoutAttrs"
  >
    <slot/>
  </Component>

  <PaginaCargando v-if="cargandoPagina"/>

  <VOverlay
    v-model="paginaEspera"
    class="align-center justify-center"
    persistent
    scroll-strategy="none"
  >
    <div class="overlay-content text-center">
      <img alt="Logo" src="/guayacan_logo.svg" style="width: 250px">
      <h3 class="loading-text" style="margin-left: 17px">Por favor, espera...</h3>
    </div>
  </VOverlay>

</template>

<style lang="scss">
// As we are using `layouts` plugin we need its styles to be imported
@use "@layouts/styles/default-layout";
</style>
