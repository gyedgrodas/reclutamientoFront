<template>
  <div>

      <VBtn
        icon="tabler-plus"
        variant="tonal"
        color="success"
        size="extra-small"
        @click="performAction"
        v-if="!esTituloSeccion"
        :to="`/admin/menu/create/${id}`"
      />

      <VBtn
        icon="tabler-edit"
        variant="tonal"
        size="extra-small"
        color="warning"
        @click="performAction"
      />

      <VBtn
        icon="tabler-trash"
        variant="tonal"
        size="extra-small"
        color="error"
        @click="performAction"
      />

  </div>
</template>

<script>
export default {
  // name: 'Actions',
  props: {
    id: {
      type: [String, Number],
      required: true,
    },
    esTituloSeccion: {
      type: Boolean,
      default: false,
    },
  },
  methods: {
    performAction() {
      console.log(`Acción ejecutada para ID: ${this.id}`);
    },
  },
};
</script>
