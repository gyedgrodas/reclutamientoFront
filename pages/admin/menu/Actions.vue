<template>
  <div>
    <!-- Aquí coloca el contenido del include 'admin.options.datatables_actions' -->

      <VBtn
        icon="tabler-plus"
        variant="tonal"
        color="success"
        size="extra-small"
        @click="performAction"

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
  name: 'Actions',
  props: {
    id: {
      type: [String, Number],
      required: true,
    },
  },
  methods: {
    performAction() {
      console.log(`Acción ejecutada para ID: ${this.id}`);
    },
  },
};
</script>
