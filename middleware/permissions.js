import { useAbility } from '@casl/vue';

export default defineNuxtRouteMiddleware((route) => {
    const ability = useAbility();

    const { showToastWarning } = useToast()

    // Extraer acción y sujeto desde la meta
    const requiredAction = route.meta?.action || 'read'; // Acción por defecto: 'read'
    const requiredSubject = route.meta?.subject || route.name; // Sujeto por defecto: nombre de la ruta

    // Validar permisos usando CASL
    const hasPermission = ability.can(requiredAction, requiredSubject);

    if (!hasPermission) {

        showToastWarning('No tienes acceso a esta vista.');

        // Redirigir al usuario si no tiene permiso
        return navigateTo('/', { replace: true, state: { message: 'No tienes acceso a esta vista.' } });
    }
});
