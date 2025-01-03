import { createMongoAbility } from '@casl/ability'
import { abilitiesPlugin } from '@casl/vue'
import type { Rule } from './ability'

export default defineNuxtPlugin(nuxtApp => {
  const userAbilityRules = useCookie<Rule[]>('userAbilityRules')

  // Instancia de habilidad con reglas de usuario
  const initialAbility = createMongoAbility(userAbilityRules.value ?? [])

  nuxtApp.vueApp.use(abilitiesPlugin, initialAbility, {
    useGlobalProperties: true,
  })
})
