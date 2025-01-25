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

  <h1>Bienvenidos a Go Credit {{ user?.nombre+' '+user?.apellido }} </h1>

</template>

<style scoped lang="scss">

</style>
