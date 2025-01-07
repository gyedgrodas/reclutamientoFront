<template>
  <div>


    <VCard title="Want to integrate JWT? 🔒">


      <v-card-text>

        <p v-text="opcionesMenu"></p>
        <p v-text="navItems"></p>

      </v-card-text>




    </VCard>
  </div>
</template>


<script setup>

import navItems from '@/navigation/vertical'

const opcionesMenu = useState('menu')
// const navItems = ref(opcionesMenu.value)

</script>
