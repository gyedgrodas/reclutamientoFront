<script lang="ts" setup>

import type { UsuarioInterface } from '@/types/usuarios/index'

const usuario = useSanctumUser<UsuarioInterface>();

const nombreDeUser = usuario.value?.nombre;

</script>

<template>

  <h1>Bienvenido, {{ nombreDeUser }}</h1>

  <VCard>

    <VCardTitle>Prueba</VCardTitle>

<!--    <AgregaDobleFactorAuth />-->

  </VCard>

</template>
