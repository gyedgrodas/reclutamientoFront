import {AppContentLayoutNav, NavbarType} from '@layouts/enums'
import {injectionKeyIsVerticalNavHovered} from '@layouts/symbols'
import {_setDirAttr} from '@layouts/utils'

// ℹ️ We should not import themeConfig here but in urgency we are doing it for now
import {layoutConfig} from '@themeConfig'

// export const namespaceConfig = (str: string) => `${layoutConfig.app.title}-${str}`

export const cookieRef = <T>(key: string, defaultValue: T) => {
  
  return useCookie<T>(useLayoutConfigStore().prefijoCookie + key, {default: () => defaultValue})
  
}

export const useLayoutConfigStore = defineStore('layoutConfig', () => {
  const route = useRoute()
  
  const {isAuthenticated, user} = useSanctumAuth();
  
  const prefijoCookie = ref('default_');
  
  watch(
    isAuthenticated,
    (val) => {
      prefijoCookie.value = val ? `${user.value.id}_` : 'default_';
    },
    { immediate: true }
  );

  
  // 👉 Navbar Type
  const navbarType = ref(layoutConfig.navbar.type)
  
  // 👉 Navbar Type
  const isNavbarBlurEnabled = cookieRef('desenfoque_habilitado_barra_navegacion', layoutConfig.navbar.navbarBlur)
  
  // 👉 Vertical Nav Collapsed
  const isVerticalNavCollapsed = cookieRef('esta_navBar_vertical_colapsada', layoutConfig.verticalNav.isVerticalNavCollapsed)
  
  // 👉 App Content Width
  const appContentWidth = cookieRef('ancho_contenido_aplicacion', layoutConfig.app.contentWidth)
  
  // 👉 App Content Layout Nav
  const appContentLayoutNav = ref(layoutConfig.app.contentLayoutNav)
  
  watch(appContentLayoutNav, val => {
    console.log('Este watch se ejecuta cuando cambia el menu de navegacion (vertical, horizontal)')
    // If Navbar type is hidden while switching to horizontal nav => Reset it to sticky
    if (val === AppContentLayoutNav.Horizontal) {
      cookieRef('navBar_loyout', val).value = val
      if (navbarType.value === NavbarType.Hidden)
        navbarType.value = NavbarType.Sticky
      
      isVerticalNavCollapsed.value = false
    }
  })
  
  // 👉 Horizontal Nav Type
  const horizontalNavType = ref(layoutConfig.horizontalNav.type)
  
  //  👉 Horizontal Nav Popover Offset
  const horizontalNavPopoverOffset = ref(layoutConfig.horizontalNav.popoverOffset)
  
  // 👉 Footer Type
  const footerType = ref(layoutConfig.footer.type)
  
  // 👉 Misc
  const isLessThanOverlayNavBreakpoint = computed(() => useMediaQuery(`(max-width: ${layoutConfig.app.overlayNavFromBreakpoint}px)`).value)
  
  function resetLayoutConfig() {
    appContentWidth.value = cookieRef('ancho_contenido_aplicacion').value
    navbarType.value = cookieRef('navBar_vertical_tipo').value
    isNavbarBlurEnabled.value = cookieRef('desenfoque_habilitado_barra_navegacion').value
    appContentLayoutNav.value = cookieRef('navBar_loyout').value
    isVerticalNavCollapsed.value = cookieRef('esta_navBar_vertical_colapsada').value
    footerType.value = cookieRef('tipo_pie_pagina').value
    horizontalNavType.value = cookieRef('navBar_horizontal_tipo').value
    horizontalNavPopoverOffset.value = cookieRef('offset_popover_nav_horizontal').value
  }
  
  // 👉 Layout Classes
  const _layoutClasses = computed(() => {
    const {y: windowScrollY} = useWindowScroll()
    
    return [
      `layout-nav-type-${appContentLayoutNav.value}`,
      `layout-navbar-${navbarType.value}`,
      `layout-footer-${footerType.value}`,
      {
        'layout-vertical-nav-collapsed':
          isVerticalNavCollapsed.value
          && appContentLayoutNav.value === 'vertical'
          && !isLessThanOverlayNavBreakpoint.value,
      },
      {[`horizontal-nav-${horizontalNavType.value}`]: appContentLayoutNav.value === 'horizontal'},
      `layout-content-width-${appContentWidth.value}`,
      {'layout-overlay-nav': isLessThanOverlayNavBreakpoint.value},
      {'window-scrolled': unref(windowScrollY)},
      route.meta.layoutWrapperClasses ? route.meta.layoutWrapperClasses : null,
    ]
  })
  
  // 👉 RTL
  // const isAppRTL = ref(layoutConfig.app.isRTL)
  const isAppRTL = ref(false)
  
  watch(isAppRTL, val => {
    console.log('Este watch se ejecuta cuando cambia el valor de isAppRTL')
    _setDirAttr(val ? 'rtl' : 'ltr')
  })
  
  // 👉 Is Vertical Nav Mini
  /*
    This function will return true if current state is mini. Mini state means vertical nav is:
      - Collapsed
      - Isn't hovered by mouse
      - nav is not less than overlay breakpoint (hence, isn't overlay menu)

    ℹ️ We are getting `isVerticalNavHovered` as param instead of via `inject` because
        we are using this in `VerticalNav.vue` component which provide it and I guess because
        same component is providing & injecting we are getting undefined error
  */
  const isVerticalNavMini = (isVerticalNavHovered: Ref<boolean> | null = null) => {
    const isVerticalNavHoveredLocal = isVerticalNavHovered || inject(injectionKeyIsVerticalNavHovered) || ref(false)
    
    return computed(() => isVerticalNavCollapsed.value && !isVerticalNavHoveredLocal.value && !isLessThanOverlayNavBreakpoint.value)
  }
  

  
  return {
    appContentWidth,
    appContentLayoutNav,
    navbarType,
    isNavbarBlurEnabled,
    isVerticalNavCollapsed,
    horizontalNavType,
    horizontalNavPopoverOffset,
    footerType,
    isLessThanOverlayNavBreakpoint,
    isAppRTL,
    _layoutClasses,
    isVerticalNavMini,
    prefijoCookie,
    resetLayoutConfig,
  }
})
