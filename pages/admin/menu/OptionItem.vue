<template>
  <li
    :id="option.id"
    style="margin-bottom: 10px"

  >


    <div style="display: flex">

      <i class="tabler-arrow-forward" style="width: 30px; height: 30px"></i>

      {{ option.titulo }}

      <Actions :id="option.id" />

    </div>


    <ul v-if="option.children && option.children.length > 0" class="list-group sortable">
      <option-item

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
