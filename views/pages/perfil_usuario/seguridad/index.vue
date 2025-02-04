<script lang="ts" setup>


const isOneTimePasswordDialogVisible = ref(false)

</script>

<template>
  <VCol cols="12">
    <VCard title="Two-steps verification">
      <VCardText>
        <h5 class="text-h5 text-medium-emphasis mb-4">
          Two factor authentication is not enabled yet.
        </h5>
        <p class="mb-6">
          Two-factor authentication adds an additional layer of security to your account by
          requiring more than just a password to log in.
          <a
            href="javascript:void(0)"
            class="text-decoration-none"
          >Learn more.</a>
        </p>

        <VBtn @click="isOneTimePasswordDialogVisible = true">
          Enable two-factor authentication
        </VBtn>
      </VCardText>
    </VCard>
  </VCol>

  <AgregaDobleFactorAuth/>

</template>
