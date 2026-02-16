<script setup lang="ts">
import {format} from 'date-fns'
import type { NotificacionInterface } from '@/types/usuarios/NotificacionesTypes'

interface PropsInterface {
  notificacion: NotificacionInterface
}

const props = defineProps<PropsInterface>()

const notification = ref<NotificacionInterface>(props.notificacion)

</script>

<template>

  <VDivider/>

  <VListItem
    link
    lines="one"
    min-height="66px"
    class="list-item-hover-class"
    @click="navigateTo('/admin/usuarios/notificaciones?id=' + notification.id)"
  >

    <div class="d-flex align-start gap-3">

      <div>
        <p class="text-sm font-weight-medium mb-1">
          {{ notification.data.titulo }}
        </p>
        <p
          class="text-body-2 mb-2"
          style=" letter-spacing: 0.4px !important; line-height: 18px;"
        >
          {{ notification.data.mensaje }}
        </p>
        <p
          class="text-sm text-disabled mb-0"
          style=" letter-spacing: 0.4px !important; line-height: 18px;"
        >
          {{ format(new Date(notification.created_at ?? ''), 'dd-MM-yyyy HH:mm:ss') }}
        </p>
      </div>
      <VSpacer/>

      <div class="d-flex flex-column align-end">
        <VIcon
          size="10"
          icon="tabler-circle-filled"
          :color="!notification.read_at ? 'primary' : '#a8aaae'"
          :class="`${notification.read_at ? 'visible-in-hover' : ''}`"
          class="mb-2"
        />
<!--        <VIcon-->
<!--          size="20"-->
<!--          icon="tabler-x"-->
<!--          class="visible-in-hover"-->
<!--        />-->
      </div>
    </div>

  </VListItem>

</template>

<style scoped lang="scss">

</style>
