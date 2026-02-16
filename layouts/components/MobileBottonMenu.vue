<script setup lang="ts">
import { Icon } from "@iconify/vue";
import { useRoute, useRouter } from "vue-router";
import { getComputedNavLinkToProp, isNavLinkActive } from "@layouts/utils";
import NavSearchBar from "@/layouts/components/NavSearchBar.vue";
import {can} from "@layouts/plugins/casl";

const navItems = useState("menu");
const router = useRouter();

function extractMobileItems(items: any[]): any[] {
  const result: any[] = [];
  for (const item of items) {
    // valida permisos antes de incluir
    const autorizado = item.action && item.subject
      ? can(item.action, item.subject)
      : false;

    if (item.mobile && autorizado) {
      result.push(item);
    }

    if (item.children && item.children.length > 0) {
      result.push(...extractMobileItems(item.children));
    }
  }
  return result;
}
const mobile = ref(extractMobileItems(navItems.value).slice(0, 6));
</script>

<template>
  <div class="mobile-bottom-menu">
    <template v-for="(item, index) in mobile" :key="index">
      <NuxtLink
        v-bind="getComputedNavLinkToProp(item)"
        class="menu-item"
        :class="{ active: isNavLinkActive(item, router) }"
      >
        <div class="menu-content">
          <Icon class="nav-item-icon" :icon="item.icono" />
          <span class="menu-text">{{ item.titulo }}</span>
        </div>
      </NuxtLink>
    </template>
    <div class="menu-item search-btn">
      <div class="menu-content">
        <NavSearchBar
          :texto="'Más'"
          :icono="'tabler-circle-plus'"
          :variante="'menu'"
          :deshabilitado="false"
          class="ms-lg-n3"
        />
      </div>
    </div>
  </div>
</template>

<style>
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
}

.menu-item {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  border-radius: 10px;
  text-align: center;
  /* Texto inactivo, bien visible y NO opaco */
  color: rgba(var(--v-theme-on-background), 0.75); /* 0.85 suaviza en oscuro */
  text-decoration: none;
  transition:
    box-shadow 0.2s ease,
    background-color 0.2s ease,
    color 0.2s;
}

.menu-item .nav-item-icon {
  font-size: 24px;
  color: inherit;
  transition:
    filter 0.2s,
    color 0.2s;
}

.menu-item.active,
.menu-item.active .nav-item-icon,
.menu-item.active .menu-text {
  color: rgb(var(--v-theme-primary));
}

.menu-item:hover {
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  background-color: rgba(var(--v-theme-primary), 0.1); /* 0.1 = 10% opacidad */
}

.menu-content {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.menu-text {
  font-size: 11px;
  margin-top: 2px;
  color: inherit;
}
</style>
