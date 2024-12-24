import { Ability } from '@casl/ability';

// Función que crea las reglas de habilidad (ability) del usuario
export const createAbility = (roles) => {
    return new Ability([
        {
            action: 'read',
            subject: 'Tercer page',
            conditions: { role: 'admin' },
        },
        // Puedes agregar más reglas según sea necesario
        {
            action: 'read',
            subject: 'Second page',
        },
        {
            action: 'read',
            subject: 'Home',
        },
    ]);
};
