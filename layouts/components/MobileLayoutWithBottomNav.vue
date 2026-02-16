<script lang="ts" setup>
import type { VerticalNavItems } from "@layouts/types";
import { useLayoutConfigStore } from "@layouts/stores/config";
import NavBarNotifications from "@/layouts/components/NavBarNotifications.vue";
import NavSearchBar from "./NavSearchBar.vue";
import { VNodeRenderer } from "@layouts/components/VNodeRenderer";
import { themeConfig } from "@themeConfig";
import MobileBottonMenu from "./MobileBottonMenu.vue";
import UserProfile from "@/layouts/components/UserProfile.vue";

const navItems = useState<VerticalNavItems>("menu", () => []);
const configStore = useLayoutConfigStore();


const showMenu = ref(true);
let lastScroll = 0;
let scrollContainer: HTMLElement | null = null;

const handleScroll = () => {
  if (!scrollContainer) return;
  const currentScroll = scrollContainer.scrollTop;
  if (currentScroll > lastScroll && currentScroll > 50) {
    // Scroll hacia abajo → ocultar menú
    showMenu.value = false;
  } else if (currentScroll < lastScroll) {
    // Scroll hacia arriba → mostrar menú
    showMenu.value = true;
  }
  lastScroll = currentScroll;
};

onMounted(() => {
  // Tomamos el contenedor que hace scroll
  scrollContainer = document.querySelector(".layout-wrapper.layout-nav-type-mobile");
  if (scrollContainer) {
    lastScroll = scrollContainer.scrollTop;
    scrollContainer.addEventListener("scroll", handleScroll);
  }
});

onUnmounted(() => {
  if (scrollContainer) scrollContainer.removeEventListener("scroll", handleScroll);
});
</script>

<template>
  <div
    class="layout-wrapper layout-nav-type-mobile d-flex flex-column"
    :class="configStore._layoutClasses"
  >

    <v-app >
      <v-app-bar class="px-3 border rounded">
        <!-- IZQUIERDA -->
        <NuxtLink to="/" class="d-inline-block" style="line-height: 0">
          <VNodeRenderer :nodes="themeConfig.app.logo" />
        </NuxtLink>
        <NavSearchBar class="ms-lg-n3" />

        <!-- ESPACIADOR -->
        <v-spacer />

        <!-- DERECHA -->
        <NavBarNotifications class="me-1" />
        <UserProfile />
      </v-app-bar>

      <v-main>
        <v-container>
          <slot />
          <div class="bottom-spacer" />
        </v-container>
      </v-main>
    </v-app>

    <!-- 👉 Menú inferior fijo -->
    <MobileBottonMenu :class="{ hidden: !showMenu } " class="border rounded" />
  </div>
</template>

<style lang="scss">
@use "@configured-variables" as variables;

.mobile-bottom-menu {
  display: flex;
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  height: 70px;
  background-color: rgb(var(--v-theme-background));
  justify-content: space-around;
  align-items: center;
  z-index: 999;
  box-shadow: 0 -2px 5px rgba(0, 0, 0, 0.05);
  padding: 0 8px;
  transition: transform 0.4s ease, opacity 0.4s ease;
  transform: translateY(0);
  opacity: 1;
}

.mobile-bottom-menu.hidden {
  transform: translateY(100%);
  opacity: 0;
}

// Solo aplica a pantallas pequeñas
@media (max-width: 768px) {
  .layout-wrapper.layout-nav-type-mobile {
    display: flex;
    flex-direction: column;
    min-height: 100dvh;
    height: 100dvh;
    overflow-x: hidden !important;

    .layout-navbar {
      z-index: variables.$layout-vertical-nav-layout-navbar-z-index;
      width: 100%;
      max-width: none;
      margin: 0;
      padding: 0;
      position: relative;
      background: rgb(var(--v-theme-background));

      &::before,
      &::after {
        content: "";
        position: absolute;
        left: -100px;
        right: -100px;
        background: rgb(var(--v-theme-background));
        z-index: -1;
      }
      &::before {
        top: -100px;
        height: 100px;
      }
      &::after {
        top: -100px;
        bottom: -20px;
      }

      .navbar-content-container {
        block-size: variables.$layout-vertical-nav-navbar-height;
        margin: 0 auto;
        position: relative;
        z-index: 1;
        width: 92%;
        max-width: 92%;

        @media (min-width: 300px) {
          width: 90%;
          max-width: 90%;
        }
        @media (min-width: 350px) {
          width: 91.5%;
          max-width: 91.5%;
        }
        @media (min-width: 400px) {
          width: 92.5%;
          max-width: 92.5%;
        }
        @media (min-width: 480px) {
          width: 94%;
          max-width: 94%;
        }
        @media (min-width: 576px) {
          width: 95%;
          max-width: 95%;
        }
        @media (min-width: 700px) and (max-width: 768px) {
          width: 96%;
          max-width: 96%;
        }
      }
    }

    //.mobile-bottom-nav {
    //  position: fixed;
    //  left: 0;
    //  right: 0;
    //  bottom: 0;
    //  width: 100vw !important;
    //  min-width: 0 !important;
    //  margin: 0 !important;
    //  padding: 12px 0;
    //  height: 70px;
    //  background-color: rgb(var(--v-theme-background));
    //  border-top: 1px solid #ddd;
    //  z-index: 2000; // Puedes ajustar según tu contexto
    //  box-shadow: 0 -2px 8px rgba(0, 0, 0, 0.1);
    //
    //  // Sin mixins ni extend, aquí la caja centrada
    //  .mobile-bottom-nav-content {
    //    padding-left: 16px;
    //    padding-right: 16px;
    //    max-width: 1280px;
    //    margin: 0 auto;
    //    height: 100%;
    //    display: flex;
    //    align-items: center;
    //    justify-content: center;
    //  }
    //}
  }

  .bottom-spacer {
    height: 82px;
    width: 100vw;
    flex-shrink: 0;
    pointer-events: none;
  }

  body {
    overflow-x: hidden !important;
  }
}

// Efecto blur en navbar si es necesario
.navbar-blur {
  backdrop-filter: blur(6px);
  transition: background-color 0.25s ease;
  background: rgba(var(--v-theme-background), 0.95) !important;

  &::before,
  &::after {
    background: rgba(var(--v-theme-background), 0.95);
    backdrop-filter: blur(6px);
  }
}

// Si usas scroll-to-top en móvil
.scroll-to-top {
  bottom: 120px !important;
}
</style>
