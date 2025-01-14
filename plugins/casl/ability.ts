import { createMongoAbility} from '@casl/ability';
import type { Subject } from '@casl/ability'; // Importación explícita del tipo

// Define Rule como una tupla de [acción, sujeto]
export type Rule = [string, Subject];

// Instancia de habilidad con el tipo correcto
export const ability = createMongoAbility<Rule>();

