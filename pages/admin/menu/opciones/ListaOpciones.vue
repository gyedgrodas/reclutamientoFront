<template>
  <ul style="list-style-type: none; ">
    <option-item
      v-for="option in opciones"
      :key="option.id"
      :option="option"
    />
  </ul>
</template>

<script>
import OptionItem from './Opcion.vue';

export default {
  name: 'OptionsList',
  components: { OptionItem },
  props: {
    opciones: {
      type: Array,
      required: true,
    },
  },
};
</script>

<style scoped>
/* Agrega tus estilos personalizados si es necesario */
</style>
