<template>
  <div>

    <VBtn
      v-if="!esTituloSeccion"
      :to="`/admin/menu/create/${id}`"
      color="success"
      icon="tabler-plus"
      size="extra-small"
      variant="tonal"
      @click="performAction"
    />

    <VBtn
      :to="`/admin/menu/edit/${id}`"
      color="warning"
      icon="tabler-edit"
      size="extra-small"
      variant="tonal"
      @click="performAction"
    />

    <VBtn
      color="error"
      icon="tabler-trash"
      size="extra-small"
      variant="tonal"
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
