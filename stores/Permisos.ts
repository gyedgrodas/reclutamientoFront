import {defineStore} from 'pinia';

export const usePermisoStore = defineStore('permisos', () => {

  const {user} = useSanctumAuth();

  const permisos = ref([]);

  watch(
    () => user,
    () => {
      permisos.value = user?.value?.abilityRules || [];
    },
    {immediate: true}
  );

  return {
    permisos
  };

});

