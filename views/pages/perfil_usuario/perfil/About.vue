<script lang="ts" setup>

const props = defineProps({
  data: {
    type: Object,
    required: true,
  },
});

</script>

<template>
  <VCard class="mb-6">
    <VCardText>
      <p class="text-sm text-disabled">
        ACERCA DE
      </p>

      <VList class="card-list text-medium-emphasis">


        <!--// 👉 Nombre de usuario-->
        <VListItem>

          <VListItemTitle >
            <span class="d-flex align-center">
            <VIcon
              icon="tabler-user"
              size="24"
              class="me-2"
            />
            <div class="text-body-1 font-weight-medium me-2">Nombre de Usuario:</div>
            <div>{{ props?.data.nombre}} {{ props?.data.apellido }}</div>
                </span>
          </VListItemTitle>
        </VListItem>

        <!--// 👉 Cif-->
        <VListItem>

          <VListItemTitle class="mb-3">
             <span class="d-flex align-center">
            <VIcon icon="tabler-scan" size="24"
                class="me-2" />
            <div class="text-body-1 font-weight-medium me-2">CIF:</div>
            <div>{{ props?.data.cif }}</div>
                 </span>
          </VListItemTitle>

        </VListItem>

        <!--// 👉 Email-->
        <VListItem>

          <VListItemTitle class="mb-3">
             <span class="d-flex align-center">
            <VIcon icon="tabler-mail" size="24"
                class="me-2" />
            <div class="text-body-1 font-weight-medium me-2">Correo Electrónico:</div>
            <div>{{ props?.data.email }}</div>
               </span>
          </VListItemTitle>

        </VListItem>

        <!--// 👉 Usuario Dominio-->
        <VListItem>

          <VListItemTitle class="mb-3">
             <span class="d-flex align-center">
            <VIcon icon="tabler-user-hexagon" size="24"
                   class="me-2"/>
            <div class="text-body-1 font-weight-medium me-2">usuario Dominio:</div>
            <div>{{ props?.data.usuario_dominio }}</div>
            </span>
          </VListItemTitle>
        </VListItem>

        <!-- 👉 Estado-->
        <VListItem>

          <VListItemTitle class="mb-3">
             <span class="d-flex align-center">
            <VIcon icon="tabler-circle-check" size="24"
                class="me-2" />
            <div class="text-body-1 font-weight-medium me-2">Estado:</div>
            <div>Activo</div>
            </span>
          </VListItemTitle>
        </VListItem>

      </VList>

      <p class="text-sm text-disabled mt-6">
        CONTACTOS
      </p>

<!--      <VList class="card-list text-medium-emphasis">-->
<!--        <VListItem-->
<!--          v-for="item in props.data.contacts"-->
<!--          :key="item.property"-->
<!--        >-->
<!--          <VListItemTitle class="mb-3">-->
<!--            <span class="d-flex align-center">-->
<!--              <VIcon-->
<!--                :icon="item.icon"-->
<!--                size="24"-->
<!--                class="me-2"-->
<!--              />-->
<!--              <div class="text-body-1 font-weight-medium me-2">{{ item.property }}:</div>-->
<!--              <div>{{ item.value }}</div>-->
<!--            </span>-->
<!--          </VListItemTitle>-->
<!--        </VListItem>-->
<!--      </VList>-->

      <p class="text-sm text-disabled mt-6">
        EQUIPOS
      </p>

<!--      <VList class="card-list text-medium-emphasis">-->
<!--        <VListItem-->
<!--          v-for="item in props.data.teams"-->
<!--          :key="item.property"-->
<!--        >-->
<!--          <VListItemTitle class="mb-3">-->
<!--            <span class="d-flex align-center">-->
<!--              <div class="text-body-1 font-weight-medium me-2">{{ item.property }}</div>-->
<!--              <div>{{ item.value }}</div>-->
<!--            </span>-->
<!--          </VListItemTitle>-->
<!--        </VListItem>-->
<!--      </VList>-->
    </VCardText>
  </VCard>

  <VCard>
    <VCardText>
      <p class="text-sm text-disabled">
        DESCRIPCIÓN GENERAL
      </p>

<!--      <VList class="card-list text-medium-emphasis">-->
<!--        <VListItem-->
<!--          v-for="item in props.data.overview"-->
<!--          :key="item.property"-->
<!--        >-->
<!--          <VListItemTitle class="mb-3">-->
<!--            <span class="d-flex align-center">-->
<!--              <VIcon-->
<!--                :icon="item.icon"-->
<!--                size="24"-->
<!--                class="me-2"-->
<!--              />-->
<!--              <div class="text-body-1 font-weight-medium me-2">{{ item.property }}:</div>-->
<!--              <div>{{ item.value }}</div>-->
<!--            </span>-->
<!--          </VListItemTitle>-->
<!--        </VListItem>-->
<!--      </VList>-->
    </VCardText>
  </VCard>
</template>

<style lang="scss" scoped>
.card-list {
  --v-card-list-gap: 16px;
}
</style>
