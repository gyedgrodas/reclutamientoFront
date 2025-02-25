<script lang="ts" setup>
import usuario from '@images/avatars/usuario.png'

const props = defineProps({
  user: {
    type: Object,
    required: false,
    default: () => ({}),
  },
})
</script>

<template>
  <VCard v-if="user">
    <VImg
      :style="{ backgroundColor: 'rgba(var(--v-theme-primary), 0.6)' }"
      min-height="200"
      max-height="250"
      cover
    />

    <VCardText class="d-flex align-bottom flex-sm-row flex-column justify-center gap-x-6">
      <div class="d-flex h-0">
        <VAvatar
          size="130"
          :image="user.profileImg ?? usuario"
          class="user-profile-avatar mx-auto"
        />
      </div>

      <div class="user-profile-info w-100 mt-16 pt-6 pt-sm-0 mt-sm-0">
        <h4 class="text-h4 text-center text-sm-start font-weight-medium mb-2">
          {{ user?.usuario_dominio }}
        </h4>

        <div class="d-flex align-center justify-center justify-sm-space-between flex-wrap gap-5">
          <div class="d-flex flex-wrap justify-center justify-sm-start flex-grow-1 gap-6">
            <span class="d-flex gap-x-2 align-center">
              <VIcon
                size="24"
                icon="tabler-briefcase-2"
                v-tooltip="'Puesto de trabajo'"
              />
              <div class="text-body-1 font-weight-medium">
                {{ user?.puesto?.nombre }}
              </div>
            </span>

            <span class="d-flex gap-x-2 align-center">
              <VIcon
                size="24"
                icon="tabler-map-pin"
                v-tooltip="'Region'"
              />
              <div class="text-body-1 font-weight-medium">
                {{ user?.region?.nombre }}
              </div>
            </span>

            <span class="d-flex gap-x-2 align-center">
              <VIcon
                size="24"
                icon="tabler-calendar"
                v-tooltip="'Fecha inicio de laboral'"
              />
              <div class="text-body-1 font-weight-medium">
                {{ user && user["fecha_labores"] ? new Date(user["fecha_labores"]).toLocaleDateString('es-ES', { day: '2-digit', month: 'long', year: 'numeric' }) : '' }}
              </div>
            </span>
          </div>
        </div>
      </div>
    </VCardText>
  </VCard>
</template>

<style lang="scss">
.user-profile-avatar {
  border: 5px solid rgb(var(--v-theme-surface));
  background-color: rgb(var(--v-theme-surface)) !important;
  inset-block-start: -3rem;

  .v-img__img {
    border-radius: 0.125rem;
  }
}
</style>
