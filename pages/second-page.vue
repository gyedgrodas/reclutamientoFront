<template>
  <div>
    <VCard title="Create Awesome 🙌">
      <VCardText>This is your second page.</VCardText>
      <VCardText>

        <v-btn @click="setPrimaryColor({ main: '#ed10ca', darken: '#c6167a' })">CambiarTema</v-btn>

      </VCardText>
    </VCard>
  </div>
</template>



<script setup lang="tsx">
import { useStorage } from '@vueuse/core'
import { PerfectScrollbar } from 'vue3-perfect-scrollbar'
import { useTheme } from 'vuetify'
import { staticPrimaryColor, staticPrimaryDarkenColor } from '@/plugins/vuetify/theme'
import { Direction, Layout, Skins, Theme } from '@core/enums'
import { useConfigStore } from '@core/stores/config'
import horizontalLight from '@images/customizer-icons/horizontal-light.svg'
import { AppContentLayoutNav, ContentWidth } from '@layouts/enums'
import { cookieRef, namespaceConfig } from '@layouts/stores/config'
import { themeConfig } from '@themeConfig'

import borderSkin from '@images/customizer-icons/border-light.svg'
import collapsed from '@images/customizer-icons/collapsed-light.svg'
import compact from '@images/customizer-icons/compact-light.svg'
import defaultSkin from '@images/customizer-icons/default-light.svg'
import ltrSvg from '@images/customizer-icons/ltr-light.svg'
import rtlSvg from '@images/customizer-icons/rtl-light.svg'
import wideSvg from '@images/customizer-icons/wide-light.svg'

const isNavDrawerOpen = ref(false)

const configStore = useConfigStore()

// 👉 Primary Color
const vuetifyTheme = useTheme()

const cliente = useClienteRequest()


const obtenerUsers = async () => {
  await cliente.get('api/users');
}


const colors: { main: string; darken: string }[] = [
  { main: staticPrimaryColor, darken: staticPrimaryDarkenColor },
  { main: '#0D9394', darken: '#0C8485' },
  { main: '#FFB400', darken: '#E6A200' },
  { main: '#FF4C51', darken: '#E64449' },
  { main: '#16B1FF', darken: '#149FE6' },
]

const customPrimaryColor = ref('#663131')

watch(
  () => configStore.theme,
  () => {
    const cookiePrimaryColor = cookieRef(`${vuetifyTheme.name.value}ThemePrimaryColor`, null).value

    if (cookiePrimaryColor && !colors.some(color => color.main === cookiePrimaryColor))
      customPrimaryColor.value = cookiePrimaryColor
  },
  { immediate: true },
)

// ℹ️ It will set primary color for current theme only
const setPrimaryColor = useDebounceFn((color: { main: string; darken: string }) => {
  vuetifyTheme.themes.value[vuetifyTheme.name.value].colors.primary = color.main
  vuetifyTheme.themes.value[vuetifyTheme.name.value].colors['primary-darken-1'] = color.darken

  // ℹ️ We need to store this color value in cookie so vuetify plugin can pick on next reload
  cookieRef<string | null>(`${vuetifyTheme.name.value}ThemePrimaryColor`, null).value = color.main
  cookieRef<string | null>(`${vuetifyTheme.name.value}ThemePrimaryDarkenColor`, null).value = color.darken

  // ℹ️ Update initial loader color
  useStorage<string | null>(namespaceConfig('initial-loader-color'), null).value = color.main
}, 100)

// 👉 Mode
const themeMode = computed(() => {
  return [
    {
      bgImage: 'tabler-sun',
      value: Theme.Light,
      label: 'Light',
    },
    {
      bgImage: 'tabler-moon-stars',
      value: Theme.Dark,
      label: 'Dark',
    },
    {
      bgImage: 'tabler-device-desktop-analytics',
      value: Theme.System,
      label: 'System',
    },
  ]
})

// 👉 Skin
const themeSkin = computed(() => {
  return [
    {
      bgImage: defaultSkin,
      value: Skins.Default,
      label: 'Default',
    },
    {
      bgImage: borderSkin,
      value: Skins.Bordered,
      label: 'Bordered',
    },
  ]
})

// 👉 Layout
const currentLayout = ref<'vertical' | 'collapsed' | 'horizontal'>(configStore.isVerticalNavCollapsed ? 'collapsed' : configStore.appContentLayoutNav)

const layouts = computed(() => {
  return [
    {
      bgImage: defaultSkin,
      value: Layout.Vertical,
      label: 'Vertical',
    },
    {
      bgImage: collapsed,
      value: Layout.Collapsed,
      label: 'Collapsed',
    },
    {
      bgImage: horizontalLight,
      value: Layout.Horizontal,
      label: 'Horizontal',
    },
  ]
})

watch(currentLayout, () => {
  if (currentLayout.value === 'collapsed') {
    configStore.isVerticalNavCollapsed = true
    configStore.appContentLayoutNav = AppContentLayoutNav.Vertical
  }
  else {
    configStore.isVerticalNavCollapsed = false
    configStore.appContentLayoutNav = currentLayout.value
  }
})

// watch vertical sidebar collapse state
watch(
  () => configStore.isVerticalNavCollapsed,
  () => {
    currentLayout.value = configStore.isVerticalNavCollapsed
      ? 'collapsed'
      : configStore.appContentLayoutNav
  },
)

// 👉 Content Width
const contentWidth = computed(() =>
{
  return [
    {
      bgImage: compact,
      value: ContentWidth.Boxed,
      label: 'Compact',
    },
    {
      bgImage: wideSvg,
      value: ContentWidth.Fluid,
      label: 'Wide',
    },
  ]
})

// 👉 Direction
const currentDir = ref(configStore.isAppRTL ? 'rtl' : 'ltr')

const direction = computed(() => {
  return [
    {
      bgImage: ltrSvg,
      value: Direction.Ltr,
      label: 'Left to right',
    },
    {
      bgImage: rtlSvg,
      value: Direction.Rtl,
      label: 'Right to left',
    },
  ]
})

watch(currentDir, () => {
  if (currentDir.value === 'rtl')
    configStore.isAppRTL = true

  else
    configStore.isAppRTL = false
})

// check if any value set in cookie
const isCookieHasAnyValue = ref(false)

const { locale } = useI18n({ useScope: 'global' })

const isActiveLangRTL = computed(() => {
  const lang = themeConfig.app.i18n.langConfig.find(l => l.i18nLang === locale.value)

  return lang?.isRTL ?? false
})

watch([
  () => vuetifyTheme.current.value.colors.primary,
  configStore.$state,
  locale,
], () => {
  const initialConfigValue = [
    staticPrimaryColor,
    staticPrimaryColor,
    themeConfig.app.theme,
    themeConfig.app.skin,
    themeConfig.verticalNav.isVerticalNavSemiDark,
    themeConfig.verticalNav.isVerticalNavCollapsed,
    themeConfig.app.contentWidth,
    isActiveLangRTL.value,
    themeConfig.app.contentLayoutNav,
  ]

  const themeConfigValue = [
    vuetifyTheme.themes.value.light.colors.primary,
    vuetifyTheme.themes.value.dark.colors.primary,
    configStore.theme,
    configStore.skin,
    configStore.isVerticalNavSemiDark,
    configStore.isVerticalNavCollapsed,
    configStore.appContentWidth,
    configStore.isAppRTL,
    configStore.appContentLayoutNav,
  ]

  currentDir.value = configStore.isAppRTL ? 'rtl' : 'ltr'

  isCookieHasAnyValue.value = JSON.stringify(themeConfigValue) !== JSON.stringify(initialConfigValue)
}, { deep: true, immediate: true })

</script>
