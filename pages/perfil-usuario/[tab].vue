<script lang="ts" setup>
import UserProfileHeader from '@/views/pages/perfil_usuario/perfilUsuarioHeader.vue'
import Perfil from '@/views/pages/perfil_usuario/perfil/index.vue'
import Funciones from '@/views/pages/perfil_usuario/funciones/index.vue'
import Equipo from '@/views/pages/perfil_usuario/seguridad/index.vue'

definePageMeta({
  navActiveLink: 'perfil-usuario-tab',
  key: 'tab',
})

const route = useRoute('perfil-usuario-tab')

const activeTab = computed({
  get: () => route.params.tab,
  set: () => route.params.tab,
})

console.log(activeTab)

// tabs
const tabs = [
  { title: 'Perfil', icon: 'tabler-user-check', tab: 'perfil' },
  { title: 'Seguridad', icon: 'tabler-lock', tab: 'seguridad' },
  { title: 'Funciones', icon: 'tabler-layout-grid', tab: 'funciones' },
  // { title: 'Connections', icon: 'tabler-link', tab: 'connections' },
]
</script>

<template>
  <div>
    <UserProfileHeader />

    <VTabs
      v-model="activeTab"
      class="v-tabs-pill my-2"
    >
      <VTab
        v-for="item in tabs"
        :key="item.icon"
        :value="item.tab"
        :to="{ name: 'perfil-usuario-tab', params: { tab: item.tab } }"
      >
        <VIcon
          size="20"
          start
          :icon="item.icon"
        />
        {{ item.title }}
      </VTab>
    </VTabs>

    <ClientOnly>
      <VWindow
        v-model="activeTab"
        class="disable-tab-transition"
        :touch="false"
      >
        <!-- Perfil -->
        <VWindowItem value="perfil">
          <Perfil />
        </VWindowItem>

        <!-- Equipo -->
        <VWindowItem value="seguridad">
          <Equipo />
        </VWindowItem>

        <!-- Funciones -->
        <VWindowItem value="funciones">
          <Funciones />
        </VWindowItem>

      </VWindow>
    </ClientOnly>
  </div>
</template>
