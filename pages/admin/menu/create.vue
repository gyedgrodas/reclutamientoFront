<script lang="ts" setup>

interface Item {
  id: string;
  titulo?: string | null;
  icon?: string | null;
  heading?: string | null;
  parent_id?: string | null;
}

</script>

<template>

  <div class="d-flex flex-wrap justify-end justify-sm-space-between gap-y-4 gap-x-6 mb-6">
    <VBtn
      class="ml-auto"
      color="secondary"
    >
      Regresar
    </VBtn>
  </div>

  <v-card>

    <v-card-title>Configurar Menu</v-card-title>

    <v-card-text>

      <VForm @submit.prevent="() => {}">
        <VRow>
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="firstName"
              label="First Name"
              placeholder="John"
            />
          </VCol>

          <!-- 👉 Last Name -->
          <VCol
            cols="12"
            md="6"
          >
            <AppTextField
              v-model="lastName"
              label="Last Name"
              placeholder="Doe"
            />
          </VCol>

          <VCol
            cols="12"
            class="d-flex gap-4"
          >
            <VBtn type="submit">
              Submit
            </VBtn>

            <VBtn
              type="reset"
              color="secondary"
              variant="tonal"
            >
              Reset
            </VBtn>
          </VCol>
        </VRow>
      </VForm>

    </v-card-text>

  </v-card>

</template>
