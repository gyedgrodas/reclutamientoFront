import {createMongoAbility} from '@casl/ability';
import {abilitiesPlugin} from '@casl/vue';
import type {Rule} from './ability';
import {watch} from 'vue';

export default defineNuxtPlugin((nuxtApp) => {

  const ability = createMongoAbility<Rule[]>([]);

  const {user} = useSanctumAuth();

  watch(
    user,
    () => {
      console.log('Detectango los cambios del usuario y asignando los nuevos permisos: ', user.value?.abilityRules);
      ability.update(user.value?.abilityRules || []);
    },
    {immediate: true, deep: true}
  );

  nuxtApp.vueApp.use(abilitiesPlugin, ability, {
    useGlobalProperties: true,
  });
});
