import { storeToRefs } from 'pinia'
import { useTheme } from 'vuetify'
import { cookieRef, useLayoutConfigStore } from '@layouts/stores/config'
import { themeConfig } from '@themeConfig'

// SECTION Store
export const useConfigStore = defineStore('config', () => {
  // 👉 Theme
  const userPreferredColorScheme = usePreferredColorScheme()
  const tema_color = ref(cookieRef<'light' | 'dark'>('tema_color', 'light').value);
  watch(
    userPreferredColorScheme,
    val => {
      console.log('Este es el watch que se debe ejecutar cuando cambia el tema del sistema')
      if (val !== 'no-preference')
        tema_color.value = val
    },
    // { immediate: true },
  )

  const theme = ref(cookieRef('tema', themeConfig.app.theme).value);

  // 👉 isVerticalNavSemiDark
  const isVerticalNavSemiDark = cookieRef('es_navegacion_vertical_semioscura', themeConfig.verticalNav.isVerticalNavSemiDark)

  // 👉 isVerticalNavSemiDark
  const skin = cookieRef('aspecto', themeConfig.app.skin)
  
  
  function reset(): void {
    theme.value = cookieRef('tema').value
    isVerticalNavSemiDark.value = cookieRef('es_navegacion_vertical_semioscura', themeConfig.verticalNav.isVerticalNavSemiDark).value
    skin.value = cookieRef('aspecto', themeConfig.app.skin).value
    
    useLayoutConfigStore().resetLayoutConfig()
    
  }
  
  function asignarDataACookiesDefault(): void {
    
    useCookie("default_color_primario_tema_light").value = cookieRef("color_primario_tema_light").value;
    useCookie("default_color_oscurecimiento_primario_tema_light").value = cookieRef("color_oscurecimiento_primario_tema_light").value;
    useCookie("default_color_primario_tema_dark").value = cookieRef("color_primario_tema_dark").value;
    useCookie("default_color_oscurecimiento_primario_tema_dark").value = cookieRef("color_oscurecimiento_primario_tema_dark").value;
    useCookie("default_tema").value = cookieRef("tema").value;
    useCookie("default_tema_color").value = cookieRef("tema_color").value;
    useCookie("default_aspecto").value = cookieRef("aspecto").value;
    useCookie("default_esta_navBar_vertical_colapsada").value = cookieRef("esta_navBar_vertical_colapsada").value;
    useCookie("default_es_navBar_vertical_semioscura").value = cookieRef("es_navBar_vertical_semioscura").value;
    useCookie("default_navBar_loyout").value = cookieRef("navBar_loyout").value;
    useCookie("default_ancho_contenido_aplicacion").value = cookieRef("ancho_contenido_aplicacion").value;
    useCookie("default_orientacion").value = cookieRef("orientacion").value;
    useCookie("default_navBar_vertical_tipo").value = cookieRef("navBar_vertical_tipo").value;
    useCookie("default_navBar_horizontal_tipo").value = cookieRef("navBar_horizontal_tipo").value;
    
  }
  
  // ℹ️ We need to use `storeToRefs` to forward the state
  const {
    isLessThanOverlayNavBreakpoint,
    appContentWidth,
    navbarType,
    isNavbarBlurEnabled,
    appContentLayoutNav,
    isVerticalNavCollapsed,
    footerType,
    isAppRTL,
    prefijoCookie,
    horizontalNavType
  } = storeToRefs(useLayoutConfigStore())

  return {
    theme,
    isVerticalNavSemiDark,
    skin,
    horizontalNavType,
    prefijoCookie,
    // @layouts exports
    isLessThanOverlayNavBreakpoint,
    appContentWidth,
    navbarType,
    isNavbarBlurEnabled,
    appContentLayoutNav,
    isVerticalNavCollapsed,
    footerType,
    isAppRTL,
    tema_color,
    // methods
    reset,
    asignarDataACookiesDefault
  }
})
// !SECTION

// SECTION Init
export const initConfigStore = () => {
  const userPreferredColorScheme = usePreferredColorScheme()
  const vuetifyTheme = useTheme()
  const configStore = useConfigStore()
  const resolver = resolveVuetifyTheme(themeConfig.app.theme)

  watch(
    [() => configStore.theme, userPreferredColorScheme],
    () => {
      console.log('Este es el watch que se debe ejecutar cuando cambia el tema')
      vuetifyTheme.global.name.value = configStore.theme === 'system'
        ? userPreferredColorScheme.value === 'dark'
          ? 'dark'
          : 'light'
        : configStore.theme
      
      configStore.tema_color = vuetifyTheme.global.name.value
    })

  onMounted(() => {
    if (configStore.theme === 'system')
      vuetifyTheme.global.name.value = resolver
  })
}
// !SECTION
