import type { LiteralUnion } from 'type-fest'
import { cookieRef } from '@layouts/stores/config'

export const resolveVuetifyTheme = (defaultTheme: LiteralUnion<'light' | 'dark' | 'system', string>): 'light' | 'dark' => {
  const cookieColorScheme = cookieRef<'light' | 'dark'>('tema_color', usePreferredDark().value ? 'dark' : 'light')
  const storedTheme = cookieRef('tema', defaultTheme).value

  return storedTheme === 'system'
    ? cookieColorScheme.value === 'dark'
      ? 'dark'
      : 'light'
    : storedTheme as 'light' | 'dark'
}
