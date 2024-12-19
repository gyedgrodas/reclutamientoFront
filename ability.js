import { Ability } from '@casl/ability';

// Función que crea las reglas de habilidad (ability) del usuario
export const createAbility = (roles) => {
    return new Ability([
        // Regla para permitir acceso a la "Tercer page" solo si el usuario tiene rol 'admin'
        {
            action: 'read',
            subject: 'Tercer page',
            conditions: { role: 'admin' },  // Solo los admin pueden leer esta página
        },
        // Puedes agregar más reglas según sea necesario
        {
            action: 'read',
            subject: 'Second page',  // Otra página a la que todos tienen acceso
        },
        {
            action: 'read',
            subject: 'Home',  // Página de inicio accesible para todos
        },
    ]);
};
