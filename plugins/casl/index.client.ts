import { createMongoAbility } from '@casl/ability';
import { abilitiesPlugin } from '@casl/vue';
import type { Rule } from './ability';

export default defineNuxtPlugin((nuxtApp) => {
  // Instancia inicial de habilidad con reglas vacías
  const ability = createMongoAbility<Rule[]>([]);

  // Obtiene las reglas del localStorage en el cliente
  const getUserAbilityRules = (): Rule[] => {
    try {
      const rules = localStorage.getItem('userAbilityRules');
      return rules ? JSON.parse(rules) : [];
    } catch (error) {
      console.error('Error parsing userAbilityRules:', error);
      return [];
    }
  };

  // Actualiza las reglas solo si estamos en el cliente
  const rules = getUserAbilityRules();
  ability.update(rules);

  // Registra el plugin en Vue
  nuxtApp.vueApp.use(abilitiesPlugin, ability, {
    useGlobalProperties: true,
  });
});
