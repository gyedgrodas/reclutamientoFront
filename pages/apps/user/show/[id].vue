<script lang="ts" setup>
import { useRoute } from 'vue-router'
import { ref } from 'vue'
import UserProfileHeader from '@/views/pages/show-usuario/perfilUsuarioHeader.vue'
import { useCargandoPagina } from '@/composables/useCargandoPagina'
import Perfil from '@/views/pages/show-usuario/perfil/index.vue'
import Funciones from '@/views/pages/show-usuario/funciones/index.vue'
import Equipo from '@/views/pages/show-usuario/equipo/index.vue'

const { get } = useClienteRequest()

const { paginaEspera } = useCargandoPagina()

const activarPaginaCargando = () => {
  paginaEspera.value = true
}

const desactivarPaginaCargando = () => {
  paginaEspera.value = false
}

const route = useRoute()

const tabs = [
  { title: 'Perfil', icon: 'tabler-user-check', tab: 'perfil' },
  { title: 'Equipo', icon: 'tabler-users', tab: 'equipo' },
  { title: 'Funciones', icon: 'tabler-layout-grid', tab: 'funciones' },
]

// Estado de la pestaña activa
const activeTab = ref(localStorage.getItem('activeTab') || 'perfil')

// Actualizar la pestaña activa guardada en localStorage
const updateActiveTab = (tab: unknown) => {
  localStorage.setItem('activeTab', tab as string)
}

const dataUser = ref()

const mostrarUsuario = async () => {
  activarPaginaCargando()

  const userId = route.params.id
  if (!userId) {
    console.error('No se proporcionó un ID de usuario.')

    return
  }

  try {
    const response = await get(`/api/users/${userId}`)
    if (response && response.data)
      dataUser.value = response.data

    else
      console.warn('No se encontraron datos para este usuario.')
  }
  catch (error) {
    console.error('Error al obtener un usuario:', error)
  }
  finally {
    desactivarPaginaCargando()
  }
}

// Llamar a mostrarUsuario al montar el componente
onMounted(() => {
  mostrarUsuario()
})
</script>

<template>
  <div>
    <UserProfileHeader :user="dataUser" />

    <VTabs
      v-model="activeTab"
      class="v-tabs-pill my-2"
      @update:model-value="updateActiveTab"
    >
      <VTab
        v-for="item in tabs"
        :key="item.icon"
        :value="item.tab"
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
          <Perfil :user="dataUser" />
        </VWindowItem>

        <!-- Equipo -->
        <VWindowItem value="equipo">
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
