export default defineNuxtRouteMiddleware(() => {
  const puedeVerDashboard = useDashboardReclutamiento()

  if (!puedeVerDashboard.value)
    return navigateTo('/')
})
