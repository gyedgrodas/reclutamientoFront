import { createMongoAbility } from '@casl/ability'

// Regla genérica que permite acciones y sujetos dinámicos
export interface Rule { action: string; subject: string }

// Instancia de habilidad sin restricciones estáticas
export const ability = createMongoAbility<Rule[]>()
