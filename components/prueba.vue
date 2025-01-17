<template>
  <div>
    <ul ref="parentList" class="parent-list">
      <li v-for="parent in items" :key="parent.id" class="parent-item">
        <div class="parent-header">
          <!--          {{ parent.name }}-->
        </div>

        <ul ref="childList" class="child-list">
          <li
            v-for="child in parent.children"
            :key="child.id"
            class="child-item"
          >
            {{ child.name }}
          </li>
        </ul>


      </li>
    </ul>
  </div>
</template>

<script>
import {onMounted, ref} from "vue";
import Sortable from "sortablejs";

export default {
  props: {
    initialItems: {
      type: Array,
      required: true,
    },
  },
  setup(props, {emit}) {
    const parentList = ref(null);
    const items = ref([...props.initialItems]);

    const setupChildLists = () => {
      items.value.forEach((parent, index) => {
        const childListElement = parentList.value.children[index].querySelector(
          ".child-list"
        );

        new Sortable(childListElement, {
          group: `children-${parent.id}`, // Un grupo único para cada padre
          animation: 150,
          onEnd: (event) => {
            const children = items.value[index].children;
            const [moved] = children.splice(event.oldIndex, 1);
            children.splice(event.newIndex, 0, moved);
            emit("update:items", items.value);
          },
        });
      });
    };

    onMounted(() => {
      // Configurar la lista principal (padres)
      new Sortable(parentList.value, {
        group: "parents", // Solo los padres se pueden mover entre sí
        animation: 150,
        onEnd: (event) => {
          const [moved] = items.value.splice(event.oldIndex, 1);
          items.value.splice(event.newIndex, 0, moved);
          emit("update:items", items.value);
        },
      });

      // Configurar las listas de hijos
      setupChildLists();
    });

    return {parentList, items};
  },
};
</script>

