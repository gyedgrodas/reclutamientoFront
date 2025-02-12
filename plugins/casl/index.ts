import { createMongoAbility } from '@casl/ability'
import { abilitiesPlugin } from '@casl/vue'
import { watch } from 'vue'
import type { Rule } from './ability'

export default defineNuxtPlugin(nuxtApp => {
  const ability = createMongoAbility<Rule[]>([])

  const { user } = useSanctumAuth()

  watch(
    user,
    () => {
      const roles = user.value?.roles || []
      const isSuperAdmin = roles.includes('Super Administrador')

      if (isSuperAdmin)
        ability.update([{ action: 'manage', subject: 'all' }])
      else
        ability.update(user.value?.abilityRules || [])

      // Reglas normales
    },
    { immediate: true, deep: true },
  )

  nuxtApp.vueApp.use(abilitiesPlugin, ability, {
    useGlobalProperties: true,
  })
})
