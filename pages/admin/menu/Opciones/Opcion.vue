<template>
  <li
    :id="option.id"
    style="margin-bottom: 10px; list-style-type: none;"

  >

    <option-text :item="option" />

    <ul v-if="option.children && option.children.length > 0">
      <opcion
        style="margin-left: 35px; margin-top: 10px; "
        v-for="child in option.children"
        :key="child.id"
        :option="child"
      />
    </ul>
  </li>
</template>

<script>
import Actions from './OpcionBotones.vue';
import OptionText from './OpcionTexto.vue';

export default {
  // name: 'OptionItem',
  components: {OptionText, Actions},
  props: {
    option: {
      type: Object,
      required: true,
    },
  },
};
</script>

<style scoped>
/* Agrega tus estilos personalizados si es necesario */
</style>
