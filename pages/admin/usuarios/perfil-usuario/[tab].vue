<script lang="ts" setup>
import UserProfileHeader from '@/views/pages/perfil_usuario/perfilUsuarioHeader.vue'
import Perfil from '@/views/pages/perfil_usuario/perfil/index.vue'
import Funciones from '@/views/pages/perfil_usuario/funciones/index.vue'
import Equipo from '@/views/pages/perfil_usuario/seguridad/index.vue'

definePageMeta({
  navActiveLink: 'admin-usuarios-perfil-usuario-tab',
  key: 'tab',
})

const { paginaEspera } = useCargandoPagina()
const usuario = useSanctumUser()
const { get } = useClienteRequest()
const route = useRoute('admin-usuarios-perfil-usuario-tab')

const activeTab = computed({
  get: () => route.params.tab,
  set: () => route.params.tab,
})

const user = ref(null)

const mostrarUsuario = async () => {
  paginaEspera.value = true

  const userId = usuario.value.id
  if (!userId) {
    console.error('No se proporcionó un ID de usuario.')

    return
  }

  try {
    const response = await get(`/api/users/${userId}`)
    if (response && response?.data)
      user.value = response.data

    else
      console.warn('No se encontraron datos para este usuario.')
  }
  catch (error) {
    console.error('Error al obtener un usuario:', error)
  }
  finally {
    paginaEspera.value = false
  }
}

// tabs
const tabs = [
  { title: 'Perfil', icon: 'tabler-user-check', tab: 'perfil' },
  { title: 'Seguridad', icon: 'tabler-lock', tab: 'seguridad' },
  { title: 'Funciones', icon: 'tabler-layout-grid', tab: 'funciones' },

  // { title: 'Connections', icon: 'tabler-link', tab: 'connections' },
]

onMounted(() => {
  mostrarUsuario()
})
</script>

<template>
  <div>
    <UserProfileHeader :user="user" />

    <VTabs
      v-model="activeTab"
      class="v-tabs-pill my-2"
      v-if="user"
    >
      <VTab
        v-for="item in tabs"
        :key="item.icon"
        :value="item.tab"
        :to="{ name: 'admin-usuarios-perfil-usuario-tab', params: { tab: item.tab } }"
      >
        <VIcon
          size="20"
          start
          :icon="item.icon"
        />
        {{ item.title }}
      </VTab>
    </VTabs>

    <ClientOnly >
      <VWindow
        v-model="activeTab"
        class="disable-tab-transition"
        :touch="false"
      >
        <!-- Perfil -->
        <VWindowItem value="perfil">
          <Perfil :user="user" />
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
