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
  
  
  function reset() {
    theme.value = cookieRef('tema').value
    isVerticalNavSemiDark.value = cookieRef('es_navegacion_vertical_semioscura', themeConfig.verticalNav.isVerticalNavSemiDark).value
    skin.value = cookieRef('aspecto', themeConfig.app.skin).value
    
    useLayoutConfigStore().resetLayoutConfig()
    
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
