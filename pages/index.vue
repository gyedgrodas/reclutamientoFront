<script lang="ts">
import { defineComponent } from 'vue'

export default defineComponent({
  name: 'Index',
  data() {
    return {
      user: null as unknown,
    }
  },
  mounted() {
    const userRef = useSanctumUser()

    this.user = userRef.value // Acceder al valor del ref
  },
})
</script>

<template>
  <Favoritos />
</template>

<style scoped lang="scss">

</style>
