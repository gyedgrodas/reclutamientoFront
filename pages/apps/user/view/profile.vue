<script setup lang="ts">
import PanelUsuario from '@/views/apps/user/view/panel-usuario.vue'
import BitacoraUsuario from '@/views/apps/user/view/bitacora-usuario.vue' // Importa el componente para la bitácora
import imagenFondo from '@images/avatars/imagenFondo.png' // Imagen de fondo del perfil de usuario
import usuario from '@images/avatars/usuario.png'
import AccountSettingsSecurity from '@/views/pages/account-settings/AccountSettingsSecurity.vue'

interface Props {
  user: any | null
}

const tabs = [
  { icon: 'tabler-users', title: 'Cuenta', tab: 'account' },
  { icon: 'tabler-lock', title: 'Seguridad', tab: 'security' },
  { icon: 'tabler-bell', title: 'Notificaciones', tab: 'notifications' },
]

const activeTab = ref('account') // Pestaña activa por defecto
</script>

<template>
  <VRow>
    <!-- // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: -->
    <!-- Portada del perfil -->
    <VCol cols="12">
      <VCard class="mb-4">
        <!-- Imagen de fondo -->
        <VImg
          :src="imagenFondo"
          height="250"
          cover
          class="rounded-t-lg"
        />

        <!-- Avatar y datos generales -->
        <VCardText class="text-center">
          <div
            class="d-flex justify-center"
            style="margin-top: -50px;"
          >
            <VAvatar
              rounded
              :size="100"
            >
              <VImg :src="usuario" />
              <!-- colocar logica para tener la fotografia del usuario -->
              <!--
                |                                                           |
                |                                                           |
                |                                                           |
                |                                                           |
                |                                                           |
                |                                                           |
              -->
            </VAvatar>
          </div>
        </VCardText>
      </VCard>
    </VCol>
    <!-- // :::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::::: -->

    <!-- Siempre muestra el PanelUsuario a la izquierda -->
    <VCol
      cols="12"
      md="5"
      lg="4"
    >
      <PanelUsuario />
    </VCol>

    <!-- ::::::::::Contenido de las pestañas:::::::::: -->
    <VCol
      cols="12"
      md="7"
      lg="8"
    >
      <VTabs
        v-model="activeTab"
        class="v-tabs-pill"
      >
        <VTab
          v-for="item in tabs"
          :key="item.tab"
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

      <VWindow
        v-model="activeTab"
        class="mt-6"
        disabled-tab-transition
        :touch="false"
      >
        <!-- Contenido para la pestaña Account -->
        <VWindowItem value="account">
          <BitacoraUsuario />
        </VWindowItem>

        <!-- Contenido para la pestaña Security -->
        <VWindowItem value="security">
          <AccountSettingsSecurity
            :user="$props.user"
            @user-data="$emit('user-data', $event)"
          />
        </VWindowItem>

        <!-- Contenido para la pestaña Notifications -->
        <VWindowItem value="notifications">
          <p>Notificaciones: Sin contenido.</p>
        </VWindowItem>
      </VWindow>
    </VCol>
  </VRow>
</template>
