<script lang="ts">
import {defineComponent} from 'vue'

export default defineComponent({
  name: "index",
  data() {
    return {
      user: null as unknown
    }
  },
  mounted() {
    const userRef = useSanctumUser()
    this.user = userRef.value // Acceder al valor del ref
  }
})
</script>
<template>

  <h2>Bienvenido, {{ user?.nombre}} </h2>

  <favoritos/>

</template>

<style scoped lang="scss">

</style>
