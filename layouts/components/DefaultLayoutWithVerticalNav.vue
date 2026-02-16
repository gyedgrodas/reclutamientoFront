<script lang="ts" setup>
// import navItems from '@/navigation/vertical'
import { useTheme } from 'vuetify'
import { themeConfig } from '@themeConfig'

// Components
import Footer from '@/layouts/components/Footer.vue'
import NavbarThemeSwitcher from '@/layouts/components/NavbarThemeSwitcher.vue'
import UserProfile from '@/layouts/components/UserProfile.vue'
import NavBarI18n from '@core/components/I18n.vue'
import NavSearchBar from '@/layouts/components/NavSearchBar.vue'
import NavBarNotifications from '@/layouts/components/NavBarNotifications.vue'

// @layouts plugin
import {VerticalNavLayout} from '@layouts'
import {can} from "@layouts/plugins/casl";

const vuetifyTheme = useTheme()

const navItems = useState('menu')

</script>

<template>
  <VerticalNavLayout :nav-items="navItems">
    <!-- 👉 navbar -->
    <template #navbar="{ toggleVerticalOverlayNavActive }">
      <div class="d-flex h-100 align-center">
        <IconBtn
          id="vertical-nav-toggle-btn"
          class="ms-n3 d-lg-none"
          @click="toggleVerticalOverlayNavActive(true)"
        >
          <VIcon
            size="26"
            icon="tabler-menu-2"
          />
        </IconBtn>


        <NavSearchBar class="ms-lg-n3"/>


        <VSpacer/>

        <NavBarI18n
          v-if="themeConfig.app.i18n.enable && themeConfig.app.i18n.langConfig?.length"
          :languages="themeConfig.app.i18n.langConfig"
        />
        <NavBarNotifications class="me-1" />
        <NavbarThemeSwitcher class="me-2" />
        <UserProfile />
      </div>
    </template>

    <!-- 👉 Pages -->
    <slot />

    <!-- 👉 Footer -->
    <template #footer>
      <Footer />
    </template>

    <!-- 👉 Customizer -->
    <TheCustomizer v-if="can('ver preferencias', 'UserPreferencia')"/>
  </VerticalNavLayout>
</template>
