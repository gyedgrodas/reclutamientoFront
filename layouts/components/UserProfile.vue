<script setup lang="ts">
import {useCargandoPagina} from "@/composables/useCargandoPagina";
import usuario from '@images/avatars/usuario.png'
import type { UsuarioInterface } from '@/types/usuarios/index'
import {useIsMobile} from "@/composables/useIsMobile";
const {paginaEspera} = useCargandoPagina()

const { post } = useClienteRequest()
const { isAuthenticated, refreshIdentity } = useSanctumAuth()
const { isMobile } = useIsMobile()

interface RespuestaRequest {
  data?: {
    azure_logout_url?: string
  }
  message?: string
}

const cerrarSesion = async (): Promise<void> => {
  try {
    if (!isAuthenticated.value) return;

    paginaEspera.value = true;

    const res:RespuestaRequest = await post('api/auth/logout', {});

    if (res?.data?.azure_logout_url) {
      window.location.href = res.data.azure_logout_url;
    } else {
      const cookie = useCookie<string>('sanctum.token.cookie');
      cookie.value = '';

      await refreshIdentity();
    }
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
  } finally {
    paginaEspera.value = false;
  }
};

const user = useSanctumUser<UsuarioInterface>()

const fotoActual = computed(() => {
  return user.value?.foto_perfil || usuario
})

</script>

<template>
  <VMenu min-width="180px" max-width="220px" location="bottom end" offset="10">
    <template #activator="{ props }">
      <!-- Contenedor principal -->
      <div v-bind="props" class="d-flex align-center cursor-pointer">
        <!-- Avatar con Badge -->
        <VBadge
          dot
          location="bottom right"
          offset-x="3"
          offset-y="3"
          bordered
          color="success"
        >
          <VAvatar color="primary" variant="tonal" :size="isMobile ? '28' : '40'">
            <VImg :src="fotoActual" />
          </VAvatar>
        </VBadge>

        <!-- Nombre del usuario -->
        <VListItemTitle
          class="text-subtitle-1 font-weight-medium ms-3"
          v-show="!isMobile"
        >
          {{ user?.usuario_dominio }}
        </VListItemTitle>

        <!-- Ícono de flecha -->
        <VIcon
          v-show="!isMobile"
          class="ms-2"
          icon="tabler-chevron-down"
          size="20"
        />
      </div>
    </template>

    <!-- Menú desplegable -->
    <VList>
      <!-- 👉 User Avatar & Name en el menú -->
      <VListItem>
        <template #prepend>
          <VAvatar color="primary" variant="tonal" :size="isMobile ? '28' : '40'">
            <VImg :src="fotoActual" />
          </VAvatar>
        </template>
        <VListItemTitle class="font-weight-semibold">
          {{ user?.usuario_dominio }}
        </VListItemTitle>
        <VListItemSubtitle
          class="text-wrap text-truncate"
          :title="user?.puesto_nombre"
        >
          {{ user?.puesto_nombre }}
        </VListItemSubtitle>
      </VListItem>

      <VDivider class="my-2" />

      <!-- 👉 Perfil -->
      <VListItem
        link
        :to="{ name: 'perfil-usuario-tab', params: { tab: 'perfil' } }"
      >
        <template #prepend>
          <VIcon class="me-2" icon="tabler-user" size="22" />
        </template>
        <VListItemTitle>Perfil</VListItemTitle>
      </VListItem>

      <VDivider class="my-2" />

      <!-- 👉 Cerrar Sesión -->
      <VListItem @click="cerrarSesion">
        <template #prepend>
          <VIcon class="me-2" icon="tabler-logout" size="22" />
        </template>
        <VListItemTitle>Cerrar Sesión</VListItemTitle>
      </VListItem>
    </VList>
  </VMenu>
</template>
