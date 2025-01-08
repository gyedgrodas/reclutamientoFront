<template>
  <li
    :id="option.id"
    style="margin-bottom: 10px; list-style-type: none;"

  >


    <div style="display: flex">

      <i :class=" option.titulo && !option.icon ? 'tabler-circle' : option.icon " style="width: 25px; height: 25px"></i>

      {{ option.titulo ?? option.heading + ' (sección)' }}

      &nbsp;

      <Actions :id="option.id" />

    </div>


    <ul v-if="option.children && option.children.length > 0">
      <option-item
        style="margin-left: 35px; margin-top: 10px; "
        v-for="child in option.children"
        :key="child.id"
        :option="child"
      />
    </ul>
  </li>
</template>

<script>
import Actions from './Actions.vue';

export default {
  name: 'OptionItem',
  components: { Actions },
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
