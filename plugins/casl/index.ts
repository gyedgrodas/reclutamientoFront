import { createMongoAbility } from '@casl/ability'
import { abilitiesPlugin } from '@casl/vue'
import type { Rule } from './ability'

export default defineNuxtPlugin(nuxtApp => {


  const getUserAbilityRules = (): Rule[] => {
    if (process?.useClient) {
      const rules = localStorage.getItem('userAbilityRules')
      return rules ? JSON.parse(rules) : []
    }
    return []
  }

  // Instancia de habilidad con reglas de usuario
  const initialAbility = createMongoAbility(getUserAbilityRules())

  nuxtApp.vueApp.use(abilitiesPlugin, initialAbility, {
    useGlobalProperties: true,
  })
})



