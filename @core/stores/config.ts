import { storeToRefs } from 'pinia'
import { useTheme } from 'vuetify'
import { cookieRef, useLayoutConfigStore } from '@layouts/stores/config'
import { themeConfig } from '@themeConfig'

// SECTION Store
export const useConfigStore = defineStore('config', () => {
  // 👉 Theme
  const userPreferredColorScheme = usePreferredColorScheme()
  const cookieColorScheme = cookieRef<'light' | 'dark'>('tema_color', 'light')
  watch(
    userPreferredColorScheme,
    val => {
      console.log('Este es el watch que se debe ejecutar cuando cambia el tema del sistema')
      if (val !== 'no-preference')
        cookieColorScheme.value = val
    },
    // { immediate: true },
  )

  const theme = cookieRef('tema', themeConfig.app.theme)

  // 👉 isVerticalNavSemiDark
  const isVerticalNavSemiDark = cookieRef('es_navegacion_vertical_semioscura', themeConfig.verticalNav.isVerticalNavSemiDark)

  // 👉 isVerticalNavSemiDark
  const skin = cookieRef('aspecto', themeConfig.app.skin)

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
  } = storeToRefs(useLayoutConfigStore())

  return {
    theme,
    isVerticalNavSemiDark,
    skin,

    // @layouts exports
    isLessThanOverlayNavBreakpoint,
    appContentWidth,
    navbarType,
    isNavbarBlurEnabled,
    appContentLayoutNav,
    isVerticalNavCollapsed,
    footerType,
    isAppRTL,
  }
})
// !SECTION

// SECTION Init
export const initConfigStore = () => {
  const userPreferredColorScheme = usePreferredColorScheme()
  const vuetifyTheme = useTheme()
  const configStore = useConfigStore()
  const resolver = resolveVuetifyTheme(themeConfig.app.theme)
  const cookieColorScheme = cookieRef<'light' | 'dark'>('tema_color', 'light')

  watch(
    [() => configStore.theme, userPreferredColorScheme],
    () => {
      console.log('Este es el watch que se debe ejecutar cuando cambia el tema')
      vuetifyTheme.global.name.value = configStore.theme === 'system'
        ? userPreferredColorScheme.value === 'dark'
          ? 'dark'
          : 'light'
        : configStore.theme
      
        cookieColorScheme.value = vuetifyTheme.global.name.value
    })

  onMounted(() => {
    if (configStore.theme === 'system')
      vuetifyTheme.global.name.value = resolver
  })
}
// !SECTION
