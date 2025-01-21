import {createMongoAbility} from '@casl/ability';
import {abilitiesPlugin} from '@casl/vue';
import type {Rule} from './ability';
import {usePermisoStore} from '@/stores/permisos';


export default defineNuxtPlugin((nuxtApp) => {
  // Instancia inicial de habilidad con reglas vacías
  const ability = createMongoAbility<Rule[]>([]);

  const permisoStore = usePermisoStore();
  const {permisos} = permisoStore;

  // // Obtiene las reglas del localStorage en el cliente
  // const getUserAbilityRules = (): Rule[] => {
  //   try {
  //     const rules = localStorage.getItem('userAbilityRules');
  //     return rules ? JSON.parse(rules) : [];
  //   } catch (error) {
  //     console.error('Error parsing userAbilityRules:', error);
  //     return [];
  //   }
  // };

  // const rules = getUserAbilityRules();

  ability.update(permisos);
  // ability.update(rules);

  nuxtApp.vueApp.use(abilitiesPlugin, ability, {
    useGlobalProperties: true,
  });
});
