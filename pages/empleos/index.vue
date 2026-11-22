<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'

definePageMeta({
  sanctum: {
    excluded: true,
  },
  layout: 'blank',
  public: true,
})

interface VacantePortal {
  id: number
  titulo: string
  puesto_id?: number
  unidad: string
  departamento: string
  numero_plazas: number
  plazas_disponibles: number
  motivo: string
  descripcion: string | null
  requisitos: string | null
  fecha_apertura: string | null
  fecha_cierre_estimada: string | null
  estado: string
}

interface PostulacionPortal {
  id: number
  vacante_id: number
  puesto: string
  unidad: string
  etapa: string
  etapa_id: number
  fecha_postulacion: string
  estado: string
}

interface CandidatoPortal {
  id: number
  user_id: number | null
  nombres: string
  apellidos: string
  correo: string
  telefono: string | null
  dpi: string | null
  fecha_nacimiento: string | null
  genero: string | null
  direccion: string | null
  municipio_id: number | null
  nivel_academico: string | null
  pretension_salarial: number | null
  documentos?: {
    curriculum: any
    foto_perfil: any
    dpi: any
    titulos_academicos: any[]
    otros_documentos: any[]
  }
}

const { get, post, put, deleted } = useClienteRequest()
const { showToastSuccess, showToastError } = useToast()

const tabActual = ref<'vacantes' | 'mis-postulaciones' | 'perfil'>('vacantes')

// Estados de datos
const vacantes = ref<VacantePortal[]>([])
const misPostulaciones = ref<PostulacionPortal[]>([])
const perfil = ref<CandidatoPortal | null>(null)
const departamentos = ref<{ id: number; nombre: string }[]>([])
const municipios = ref<{ id: number; nombre: string; departamento_id: number }[]>([])

const cargandoVacantes = ref(false)
const cargandoPostulaciones = ref(false)
const cargandoPerfil = ref(false)
const guardandoPerfil = ref(false)
const subiendoDoc = ref<string | null>(null)

// Filtros de búsqueda
const busquedaTexto = ref('')
const filtroDepartamento = ref<string | null>(null)

// Autenticación y caché persistente de sesión del candidato
const PORTAL_CACHE_KEY = 'tt_portal_candidato_session_v1'

const tokenCookie = useCookie<string | null>('portal_candidato_token', {
  maxAge: 60 * 60 * 24 * 30,
  path: '/',
  sameSite: 'lax',
})

const nivelesAcademicos = [
  { title: 'Primaria', value: 'Primaria' },
  { title: 'Básico', value: 'Básico' },
  { title: 'Diversificado', value: 'Diversificado' },
  { title: 'Universitario / Licenciatura', value: 'Universitario' },
  { title: 'Maestría / Postgrado', value: 'Postgrado' },
]

const guardarSesionCache = () => {
  if (typeof localStorage === 'undefined')
    return
  try {
    if (!tokenCookie.value) {
      localStorage.removeItem(PORTAL_CACHE_KEY)

      return
    }
    localStorage.setItem(PORTAL_CACHE_KEY, JSON.stringify({
      token: tokenCookie.value,
      perfil: perfil.value,
      misPostulaciones: misPostulaciones.value,
      tabActual: tabActual.value,
      updatedAt: Date.now(),
    }))
  }
  catch (e) {
    console.warn('No se pudo guardar caché de sesión:', e)
  }
}

const limpiarSesionCache = () => {
  if (typeof localStorage === 'undefined')
    return
  try {
    localStorage.removeItem(PORTAL_CACHE_KEY)
  }
  catch {
    // Ignorar errores de almacenamiento
  }
}

const hidratarSesionCache = () => {
  if (typeof localStorage === 'undefined')
    return
  try {
    const raw = localStorage.getItem(PORTAL_CACHE_KEY)
    if (!raw)
      return
    const parsed = JSON.parse(raw)
    if (parsed?.token && !tokenCookie.value)
      tokenCookie.value = parsed.token
    if (parsed?.perfil && !perfil.value)
      perfil.value = parsed.perfil
    if (Array.isArray(parsed?.misPostulaciones) && misPostulaciones.value.length === 0)
      misPostulaciones.value = parsed.misPostulaciones
    if (parsed?.tabActual && ['vacantes', 'mis-postulaciones', 'perfil'].includes(parsed.tabActual) && (parsed?.token || tokenCookie.value))
      tabActual.value = parsed.tabActual
  }
  catch (e) {
    console.warn('No se pudo hidratar caché de sesión:', e)
  }
}

hidratarSesionCache()

watch(tabActual, () => {
  if (tokenCookie.value && perfil.value)
    guardarSesionCache()
})

const authOptions = (extraHeaders: Record<string, string> = {}) => ({
  headers: {
    ...(tokenCookie.value ? { Authorization: `Bearer ${tokenCookie.value}` } : {}),
    ...extraHeaders,
  },
})

const esCandidatoAutenticado = computed(() => Boolean(tokenCookie.value && perfil.value))

// Diálogos
const dialogAuth = ref(false)
const authTab = ref<'login' | 'registro'>('login')
const procesandoAuth = ref(false)
const authError = ref('')

const formLogin = ref({
  correo: '',
  password: '',
})

const formRegistro = ref({
  nombres: '',
  apellidos: '',
  correo: '',
  password: '',
  telefono: '',
  dpi: '',
})

// Diálogo de detalle de vacante
const dialogDetalle = ref(false)
const vacanteSeleccionada = ref<VacantePortal | null>(null)

// Diálogo de confirmación de postulación
const dialogConfirmarPostulacion = ref(false)
const vacanteParaPostular = ref<VacantePortal | null>(null)
const postulando = ref(false)

// Carga inicial de vacantes y catálogos
const cargarVacantes = async () => {
  cargandoVacantes.value = true
  try {
    const res = await get<any>('/api/portal/vacantes')
    const lista = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])

    vacantes.value = lista
  }
  catch (error) {
    console.error('Error al cargar vacantes públicas:', error)
  }
  finally {
    cargandoVacantes.value = false
  }
}

const cargarCatalogos = async () => {
  try {
    const res = await get<any>('/api/portal/catalogos')

    departamentos.value = res.data?.departamentos || []
    municipios.value = res.data?.municipios || []
  }
  catch (error) {
    console.error('Error al cargar catálogos:', error)
  }
}

const cargarMisPostulaciones = async () => {
  if (!tokenCookie.value)
    return
  cargandoPostulaciones.value = true
  try {
    const res = await get<any>('/api/portal/mis-postulaciones', authOptions())
    const lista = Array.isArray(res?.data) ? res.data : (Array.isArray(res) ? res : [])

    misPostulaciones.value = lista
    guardarSesionCache()
  }
  catch (error) {
    console.error('Error al cargar postulaciones:', error)
  }
  finally {
    cargandoPostulaciones.value = false
  }
}

const cargarPerfilCandidato = async () => {
  if (!tokenCookie.value)
    return
  cargandoPerfil.value = true
  try {
    const res = await get<any>('/api/portal/perfil', authOptions())

    if (res?.data && !Array.isArray(res.data) && res.data.id) {
      perfil.value = res.data
      guardarSesionCache()
      await cargarMisPostulaciones()
    }
  }
  catch (error: any) {
    if (error?.response?.status === 401) {
      console.warn('Token de candidato expirado o inválido.')
      tokenCookie.value = null
      perfil.value = null
      misPostulaciones.value = []
      tabActual.value = 'vacantes'
      limpiarSesionCache()
    }
    else {
      console.warn('No se pudo refrescar perfil desde el servidor; conservando sesión en caché:', error)
    }
  }
  finally {
    cargandoPerfil.value = false
  }
}

// Vacantes filtradas
const vacantesFiltradas = computed(() => {
  const q = (busquedaTexto.value || '').trim().toLowerCase()

  return vacantes.value.filter(v => {
    const coincideTexto = !q
      || (v.titulo && v.titulo.toLowerCase().includes(q))
      || (v.unidad && v.unidad.toLowerCase().includes(q))
      || (v.departamento && v.departamento.toLowerCase().includes(q))
      || (v.descripcion && v.descripcion.toLowerCase().includes(q))
      || (v.requisitos && v.requisitos.toLowerCase().includes(q))

    const coincideDepto = !filtroDepartamento.value || v.departamento === filtroDepartamento.value

    return coincideTexto && coincideDepto
  })
})

const departamentosUnicos = computed(() => {
  const deptos = new Set(vacantes.value.map(v => v.departamento).filter(Boolean))

  return Array.from(deptos)
})

const totalPlazas = computed(() => {
  return vacantes.value.reduce((acc, v) => acc + (v.plazas_disponibles || 0), 0)
})

const yaPostulado = (vacanteId: number) => {
  return misPostulaciones.value.some(p => p.vacante_id === vacanteId)
}

// Acciones de autenticación
const iniciarSesion = async () => {
  procesandoAuth.value = true
  authError.value = ''
  try {
    const res = await post<{ data: { token: string; user: any; candidato: CandidatoPortal } }>('/api/portal/auth/login', formLogin.value)

    tokenCookie.value = res.data.token
    perfil.value = res.data.candidato
    guardarSesionCache()
    showToastSuccess(`¡Bienvenido de vuelta, ${res.data.candidato?.nombres || 'Candidato'}!`)
    dialogAuth.value = false
    await cargarPerfilCandidato()

    // Si había una vacante pendiente de postular, abrir confirmación
    if (vacanteParaPostular.value)
      dialogConfirmarPostulacion.value = true
  }
  catch (error: any) {
    authError.value = error.response?.data?.message || error.response?.data?.errors?.correo?.[0] || 'Error al iniciar sesión'
  }
  finally {
    procesandoAuth.value = false
  }
}

const registrarse = async () => {
  procesandoAuth.value = true
  authError.value = ''
  try {
    const res = await post<{ data: { token: string; user: any; candidato: CandidatoPortal } }>('/api/portal/auth/registro', formRegistro.value)

    tokenCookie.value = res.data.token
    perfil.value = res.data.candidato
    guardarSesionCache()
    showToastSuccess('¡Cuenta creada con éxito! Bienvenido a nuestro equipo.')
    dialogAuth.value = false
    await cargarMisPostulaciones()

    if (vacanteParaPostular.value)
      dialogConfirmarPostulacion.value = true
  }
  catch (error: any) {
    const errores = error.response?.data?.errors

    authError.value = errores ? Object.values(errores).flat().join('. ') : (error.response?.data?.message || 'Error al registrar candidato')
  }
  finally {
    procesandoAuth.value = false
  }
}

const cerrarSesion = () => {
  tokenCookie.value = null
  perfil.value = null
  misPostulaciones.value = []
  tabActual.value = 'vacantes'
  limpiarSesionCache()
  showToastSuccess('Has cerrado sesión correctamente.')
}

// Ver detalle de vacante
const verDetalleVacante = (vacante: VacantePortal) => {
  vacanteSeleccionada.value = vacante
  dialogDetalle.value = true
}

// Iniciar proceso de postulación
const solicitarPostulacion = (vacante: VacantePortal) => {
  vacanteParaPostular.value = vacante
  if (dialogDetalle.value)
    dialogDetalle.value = false

  if (!tokenCookie.value || !perfil.value) {
    authTab.value = 'registro'
    authError.value = ''
    dialogAuth.value = true

    return
  }

  dialogConfirmarPostulacion.value = true
}

const confirmarPostulacion = async () => {
  if (!vacanteParaPostular.value)
    return
  postulando.value = true
  try {
    await post('/api/portal/postular', { vacante_id: vacanteParaPostular.value.id }, authOptions())
    showToastSuccess('¡Tu postulación ha sido enviada con éxito!')
    dialogConfirmarPostulacion.value = false
    await cargarMisPostulaciones()
    await cargarVacantes()
    tabActual.value = 'mis-postulaciones'
    guardarSesionCache()
  }
  catch (error: any) {
    const msg = error.response?.data?.errors?.vacante_id?.[0] || error.response?.data?.message || 'No se pudo registrar la postulación.'

    showToastError(msg)
  }
  finally {
    postulando.value = false
  }
}

// Guardar perfil
const guardarPerfil = async () => {
  if (!perfil.value)
    return
  guardandoPerfil.value = true
  try {
    const res = await put<{ data: CandidatoPortal }>('/api/portal/perfil', {
      nombres: perfil.value.nombres,
      apellidos: perfil.value.apellidos,
      telefono: perfil.value.telefono,
      dpi: perfil.value.dpi,
      fecha_nacimiento: perfil.value.fecha_nacimiento,
      genero: perfil.value.genero,
      direccion: perfil.value.direccion,
      municipio_id: perfil.value.municipio_id,
      nivel_academico: perfil.value.nivel_academico,
      pretension_salarial: perfil.value.pretension_salarial,
    }, authOptions())

    perfil.value = {
      ...perfil.value,
      ...res.data,
      documentos: res.data?.documentos || perfil.value.documentos,
    }
    guardarSesionCache()
    showToastSuccess('Perfil actualizado correctamente.')
  }
  catch (error: any) {
    const errores = error.response?.data?.errors
    const detalle = errores ? Object.values(errores).flat().join('. ') : null

    showToastError(detalle || error.response?.data?.message || 'Error al actualizar perfil.')
  }
  finally {
    guardandoPerfil.value = false
  }
}

// Carga de archivo
const subirArchivo = async (event: Event, coleccion: string) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file)
    return

  const formData = new FormData()

  formData.append('archivo', file)
  formData.append('coleccion', coleccion)

  subiendoDoc.value = coleccion
  try {
    await post('/api/portal/documentos', formData, authOptions({
      'Content-Type': 'multipart/form-data',
    }))
    showToastSuccess(`Documento (${coleccion}) cargado con éxito.`)
    await cargarPerfilCandidato()
  }
  catch (error: any) {
    showToastError(error.response?.data?.message || 'Error al subir documento.')
  }
  finally {
    subiendoDoc.value = null
    target.value = ''
  }
}

const eliminarArchivo = async (mediaId: number) => {
  try {
    await deleted(`/api/portal/documentos/${mediaId}`, authOptions())
    showToastSuccess('Documento eliminado.')
    await cargarPerfilCandidato()
  }
  catch (error: any) {
    showToastError('Error al eliminar documento.')
  }
}

const municipiosFiltrados = computed(() => {
  return municipios.value
})

const getEtapaColor = (etapaNombre: string) => {
  const nombre = (etapaNombre || '').toLowerCase()
  if (nombre.includes('contratad'))
    return 'success'
  if (nombre.includes('oferta'))
    return 'primary'
  if (nombre.includes('entrevista'))
    return 'info'
  if (nombre.includes('psicom') || nombre.includes('evalua'))
    return 'warning'
  if (nombre.includes('descartad'))
    return 'error'

  return 'secondary'
}

onMounted(async () => {
  hidratarSesionCache()
  await Promise.all([cargarVacantes(), cargarCatalogos()])
  if (tokenCookie.value)
    await cargarPerfilCandidato()
})
</script>

<template>
  <VThemeProvider
    theme="light"
    with-background
    class="portal-empleos-page"
  >
    <!-- Navbar Superior -->
    <header class="portal-header">
      <div class="portal-header__container">
        <div
          class="portal-header__brand cursor-pointer"
          @click="tabActual = 'vacantes'"
        >
          <div class="portal-logo-badge">
            <VIcon
              icon="tabler-briefcase"
              color="white"
              size="24"
            />
          </div>
          <div>
            <h1 class="portal-title">
              Reclutamiento Guayacán
            </h1>
            <span class="portal-subtitle">Bolsa de Empleo Institucional</span>
          </div>
        </div>

        <nav class="portal-header__nav">
          <VBtn
            :variant="tabActual === 'vacantes' ? 'tonal' : 'text'"
            :color="tabActual === 'vacantes' ? 'primary' : undefined"
            class="nav-tab-btn"
            :class="{ 'nav-tab-btn--active': tabActual === 'vacantes' }"
            @click="tabActual = 'vacantes'"
          >
            <VIcon
              icon="tabler-list-search"
              class="me-1"
            />
            Convocatorias
          </VBtn>

          <template v-if="esCandidatoAutenticado">
            <VBtn
              :variant="tabActual === 'mis-postulaciones' ? 'tonal' : 'text'"
              :color="tabActual === 'mis-postulaciones' ? 'primary' : undefined"
              class="nav-tab-btn"
              :class="{ 'nav-tab-btn--active': tabActual === 'mis-postulaciones' }"
              @click="tabActual = 'mis-postulaciones'"
            >
              <VIcon
                icon="tabler-file-check"
                class="me-1"
              />
              Mis Postulaciones
              <VBadge
                v-if="misPostulaciones.length"
                :content="misPostulaciones.length"
                color="primary"
                inline
                class="ms-1"
              />
            </VBtn>

            <VBtn
              :variant="tabActual === 'perfil' ? 'tonal' : 'text'"
              :color="tabActual === 'perfil' ? 'primary' : undefined"
              class="nav-tab-btn"
              :class="{ 'nav-tab-btn--active': tabActual === 'perfil' }"
              @click="tabActual = 'perfil'"
            >
              <VIcon
                icon="tabler-user-circle"
                class="me-1"
              />
              Mi Expediente
            </VBtn>

            <VMenu
              location="bottom end"
              theme="light"
            >
              <template #activator="{ props }">
                <VBtn
                  v-bind="props"
                  variant="tonal"
                  color="primary"
                  class="user-profile-btn ms-2"
                >
                  <VAvatar
                    size="28"
                    color="primary"
                    class="me-2 text-white text-caption"
                  >
                    {{ perfil?.nombres?.charAt(0) || 'C' }}
                  </VAvatar>
                  <span class="d-none d-sm-inline">{{ perfil?.nombres?.split(' ')[0] }}</span>
                  <VIcon
                    icon="tabler-chevron-down"
                    size="18"
                    class="ms-1"
                  />
                </VBtn>
              </template>
              <VList min-width="180">
                <VListItem @click="tabActual = 'perfil'">
                  <template #prepend>
                    <VIcon
                      icon="tabler-user"
                      size="18"
                      class="me-2"
                    />
                  </template>
                  <VListItemTitle>Ver mi perfil</VListItemTitle>
                </VListItem>
                <VListItem @click="tabActual = 'mis-postulaciones'">
                  <template #prepend>
                    <VIcon
                      icon="tabler-history"
                      size="18"
                      class="me-2"
                    />
                  </template>
                  <VListItemTitle>Mis aplicaciones</VListItemTitle>
                </VListItem>
                <VDivider class="my-1" />
                <VListItem
                  color="error"
                  @click="cerrarSesion"
                >
                  <template #prepend>
                    <VIcon
                      icon="tabler-logout"
                      size="18"
                      class="me-2"
                      color="error"
                    />
                  </template>
                  <VListItemTitle class="text-error">
                    Cerrar sesión
                  </VListItemTitle>
                </VListItem>
              </VList>
            </VMenu>
          </template>

          <template v-else>
            <VBtn
              variant="outlined"
              color="primary"
              class="ms-2"
              @click="authTab = 'login'; authError = ''; dialogAuth = true"
            >
              <VIcon
                icon="tabler-login"
                class="me-1"
              />
              Ingresar
            </VBtn>
            <VBtn
              color="primary"
              class="ms-2"
              @click="authTab = 'registro'; authError = ''; dialogAuth = true"
            >
              <VIcon
                icon="tabler-user-plus"
                class="me-1"
              />
              Registrarme
            </VBtn>
          </template>
        </nav>
      </div>
    </header>

    <!-- Contenido Principal -->
    <main class="portal-main">
      <!-- PESTAÑA: VACANTES DISPONIBLES -->
      <div v-if="tabActual === 'vacantes'">
        <!-- Hero Section -->
        <section class="portal-hero">
          <div class="portal-hero__inner">
            <span class="portal-hero__tag">Oportunidades Laborales Abiertas</span>
            <h2 class="portal-hero__headline">
              Construye tu futuro profesional con nosotros
            </h2>
            <p class="portal-hero__lead">
              Explora las convocatorias vigentes, conoce los requisitos y postúlate 100% en línea de forma transparente.
            </p>

            <!-- Barra de Búsqueda -->
            <div class="portal-search-bar">
              <VRow
                no-gutters
                align="center"
              >
                <VCol
                  cols="12"
                  md="6"
                  class="pa-2 portal-search-col-divider"
                >
                  <VTextField
                    v-model="busquedaTexto"
                    placeholder="Buscar puesto, palabra clave o requisitos..."
                    prepend-inner-icon="tabler-search"
                    density="comfortable"
                    hide-details
                    variant="plain"
                    class="portal-search-input"
                    clearable
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="4"
                  class="pa-2"
                >
                  <VSelect
                    v-model="filtroDepartamento"
                    :items="departamentosUnicos"
                    placeholder="Todos los departamentos"
                    prepend-inner-icon="tabler-map-pin"
                    density="comfortable"
                    hide-details
                    variant="plain"
                    class="portal-search-input"
                    :menu-props="{ theme: 'light' }"
                    clearable
                  />
                </VCol>
                <VCol
                  cols="12"
                  md="2"
                  class="pa-2 text-center text-md-end"
                >
                  <VBtn
                    color="primary"
                    block
                    size="large"
                    class="portal-btn-green"
                    @click="cargarVacantes"
                  >
                    Filtrar
                  </VBtn>
                </VCol>
              </VRow>
            </div>

            <!-- Métricas resumen -->
            <div class="portal-hero__stats">
              <div class="hero-stat-pill">
                <VIcon
                  icon="tabler-briefcase"
                  size="20"
                  color="primary"
                  class="me-2"
                />
                <strong class="me-1">{{ vacantes.length }}</strong> Convocatorias Activas
              </div>
              <div class="hero-stat-pill">
                <VIcon
                  icon="tabler-users"
                  size="20"
                  color="primary"
                  class="me-2"
                />
                <strong class="me-1">{{ totalPlazas }}</strong> Plazas Disponibles
              </div>
              <div class="hero-stat-pill">
                <VIcon
                  icon="tabler-shield-check"
                  size="20"
                  color="primary"
                  class="me-2"
                />
                Proceso 100% Digital
              </div>
            </div>
          </div>
        </section>

        <!-- Listado de Vacantes -->
        <section class="portal-container py-8">
          <div class="d-flex justify-space-between align-center mb-6">
            <div>
              <h3 class="portal-section-title">
                Plazas Disponibles
                <span class="portal-section-count ms-2">({{ vacantesFiltradas.length }})</span>
              </h3>
              <p class="portal-section-subtitle mb-0">
                Selecciona una vacante para consultar los requisitos y postularte.
              </p>
            </div>
            <VBtn
              variant="outlined"
              color="primary"
              size="small"
              prepend-icon="tabler-refresh"
              :loading="cargandoVacantes"
              @click="cargarVacantes"
            >
              Actualizar
            </VBtn>
          </div>

          <!-- Spinner cargando -->
          <div
            v-if="cargandoVacantes"
            class="text-center py-12"
          >
            <VProgressCircular
              indeterminate
              color="primary"
              size="48"
            />
            <p class="mt-4 text-medium-emphasis">
              Consultando convocatorias vigentes...
            </p>
          </div>

          <!-- Estado vacío -->
          <div
            v-else-if="vacantesFiltradas.length === 0"
            class="portal-empty-card text-center py-12"
          >
            <VIcon
              icon="tabler-folder-off"
              size="56"
              color="secondary"
              class="mb-3"
            />
            <h4 class="text-h6 font-weight-bold">
              No se encontraron convocatorias
            </h4>
            <p class="text-body-2 text-medium-emphasis mb-4">
              {{ busquedaTexto || filtroDepartamento ? 'Intenta modificar los filtros de búsqueda para ver más resultados.' : 'Actualmente no hay vacantes abiertas. Vuelve a consultar pronto.' }}
            </p>
            <VBtn
              v-if="busquedaTexto || filtroDepartamento"
              variant="outlined"
              color="primary"
              @click="busquedaTexto = ''; filtroDepartamento = null"
            >
              Limpiar filtros
            </VBtn>
          </div>

          <!-- Grid de tarjetas de vacantes -->
          <VRow v-else>
            <VCol
              v-for="v in vacantesFiltradas"
              :key="v.id"
              cols="12"
              md="6"
              lg="4"
            >
              <div class="job-card">
                <div class="job-card__header">
                  <VChip
                    size="small"
                    color="success"
                    variant="tonal"
                    prepend-icon="tabler-circle-check"
                    class="font-weight-medium"
                  >
                    Convocatoria Abierta
                  </VChip>
                  <VChip
                    size="small"
                    color="primary"
                    variant="flat"
                    class="font-weight-bold"
                  >
                    {{ v.plazas_disponibles }} {{ v.plazas_disponibles === 1 ? 'plaza' : 'plazas' }}
                  </VChip>
                </div>

                <h4 class="job-card__title">
                  {{ v.titulo }}
                </h4>

                <div class="job-card__location">
                  <VIcon
                    icon="tabler-building"
                    size="16"
                    class="me-1 text-primary flex-shrink-0"
                  />
                  <span>{{ v.unidad }}</span>
                </div>
                <div class="job-card__location job-card__location--dept mt-1">
                  <VIcon
                    icon="tabler-map-pin"
                    size="16"
                    class="me-1 flex-shrink-0"
                  />
                  <span>{{ v.departamento }}</span>
                </div>

                <p
                  v-if="v.descripcion"
                  class="job-card__desc mt-3"
                >
                  {{ v.descripcion.length > 130 ? `${v.descripcion.substring(0, 130)}...` : v.descripcion }}
                </p>
                <p
                  v-else
                  class="job-card__desc job-card__desc--empty mt-3 fst-italic"
                >
                  Consulte los detalles para ver requisitos y competencias del puesto.
                </p>

                <div class="job-card__footer">
                  <div class="job-card__date">
                    <VIcon
                      icon="tabler-calendar"
                      size="15"
                      class="me-1 flex-shrink-0"
                    />
                    <span>Límite: {{ v.fecha_cierre_estimada || 'Abierta hasta cubrir' }}</span>
                  </div>

                  <div class="d-flex gap-2">
                    <VBtn
                      variant="outlined"
                      density="comfortable"
                      color="primary"
                      size="small"
                      @click="verDetalleVacante(v)"
                    >
                      Detalles
                    </VBtn>

                    <VBtn
                      v-if="yaPostulado(v.id)"
                      color="success"
                      variant="tonal"
                      density="comfortable"
                      size="small"
                      prepend-icon="tabler-check"
                      disabled
                    >
                      Postulado
                    </VBtn>
                    <VBtn
                      v-else
                      color="primary"
                      density="comfortable"
                      size="small"
                      prepend-icon="tabler-send"
                      @click="solicitarPostulacion(v)"
                    >
                      Postularme
                    </VBtn>
                  </div>
                </div>
              </div>
            </VCol>
          </VRow>
        </section>
      </div>

      <!-- PESTAÑA: MIS POSTULACIONES -->
      <div
        v-else-if="tabActual === 'mis-postulaciones'"
        class="portal-container py-8"
      >
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h3 class="portal-section-title">
              Mis Postulaciones Activas
            </h3>
            <p class="portal-section-subtitle mb-0">
              Rastrea el progreso en tiempo real de los procesos en los que estás participando.
            </p>
          </div>
          <VBtn
            variant="outlined"
            color="primary"
            prepend-icon="tabler-arrow-left"
            @click="tabActual = 'vacantes'"
          >
            Explorar más vacantes
          </VBtn>
        </div>

        <div
          v-if="cargandoPostulaciones"
          class="text-center py-12"
        >
          <VProgressCircular
            indeterminate
            color="primary"
            size="44"
          />
          <p class="mt-3 text-medium-emphasis">
            Consultando tus postulaciones...
          </p>
        </div>

        <div
          v-else-if="misPostulaciones.length === 0"
          class="portal-empty-card text-center py-12"
        >
          <VIcon
            icon="tabler-send-off"
            size="56"
            color="secondary"
            class="mb-3"
          />
          <h4 class="text-h6 font-weight-bold">
            Aún no te has postulado a ninguna vacante
          </h4>
          <p class="text-body-2 text-medium-emphasis mb-4">
            Revisa nuestras convocatorias abiertas y postúlate a la plaza que mejor se adapte a tu perfil.
          </p>
          <VBtn
            color="primary"
            prepend-icon="tabler-search"
            @click="tabActual = 'vacantes'"
          >
            Ver vacantes disponibles
          </VBtn>
        </div>

        <div
          v-else
          class="d-flex flex-column gap-4"
        >
          <div
            v-for="p in misPostulaciones"
            :key="p.id"
            class="application-card"
          >
            <div class="d-flex flex-wrap justify-space-between align-center gap-3 mb-3">
              <div>
                <span class="text-caption text-primary font-weight-bold text-uppercase">Postulación #{{ p.id }}</span>
                <h4 class="text-h6 font-weight-bold mb-0">
                  {{ p.puesto }}
                </h4>
                <span class="text-caption text-medium-emphasis">{{ p.unidad }} • Enviada el {{ p.fecha_postulacion }}</span>
              </div>
              <div>
                <VChip
                  :color="getEtapaColor(p.etapa)"
                  variant="flat"
                  size="small"
                  class="font-weight-bold text-uppercase"
                >
                  <VIcon
                    icon="tabler-progress"
                    size="14"
                    class="me-1"
                  />
                  {{ p.etapa }}
                </VChip>
              </div>
            </div>

            <VDivider class="my-3" />

            <!-- Línea de Progreso Visual de Reclutamiento -->
            <div class="application-progress-steps">
              <div
                class="app-step"
                :class="{ 'app-step--active': p.etapa_id >= 1 }"
              >
                <div class="app-step__circle">
                  1
                </div>
                <span class="app-step__label">Recibida</span>
              </div>
              <div
                class="app-step__line"
                :class="{ 'app-step__line--active': p.etapa_id >= 2 }"
              />
              <div
                class="app-step"
                :class="{ 'app-step--active': p.etapa_id >= 2 }"
              >
                <div class="app-step__circle">
                  2
                </div>
                <span class="app-step__label">Preselección</span>
              </div>
              <div
                class="app-step__line"
                :class="{ 'app-step__line--active': p.etapa_id >= 3 }"
              />
              <div
                class="app-step"
                :class="{ 'app-step--active': p.etapa_id >= 3 }"
              >
                <div class="app-step__circle">
                  3
                </div>
                <span class="app-step__label">Evaluaciones</span>
              </div>
              <div
                class="app-step__line"
                :class="{ 'app-step__line--active': p.etapa_id >= 4 }"
              />
              <div
                class="app-step"
                :class="{ 'app-step--active': p.etapa_id >= 4 }"
              >
                <div class="app-step__circle">
                  4
                </div>
                <span class="app-step__label">Entrevistas</span>
              </div>
              <div
                class="app-step__line"
                :class="{ 'app-step__line--active': p.etapa_id >= 7 }"
              />
              <div
                class="app-step"
                :class="{ 'app-step--active': p.etapa_id >= 7 }"
              >
                <div class="app-step__circle">
                  5
                </div>
                <span class="app-step__label">Oferta / Cierre</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- PESTAÑA: MI PERFIL Y EXPEDIENTE -->
      <div
        v-else-if="tabActual === 'perfil'"
        class="portal-container py-8"
      >
        <div class="d-flex justify-space-between align-center mb-6">
          <div>
            <h3 class="portal-section-title">
              Mi Expediente Digital de Candidato
            </h3>
            <p class="portal-section-subtitle mb-0">
              Mantén tus datos actualizados y tus documentos cargados para agilizar tus procesos de selección.
            </p>
          </div>
          <VBtn
            color="primary"
            prepend-icon="tabler-device-floppy"
            :loading="guardandoPerfil"
            @click="guardarPerfil"
          >
            Guardar Cambios
          </VBtn>
        </div>

        <VRow v-if="perfil">
          <!-- Columna Izquierda: Documentos y Foto -->
          <VCol
            cols="12"
            md="4"
          >
            <div class="portal-box mb-4 text-center">
              <VAvatar
                size="100"
                color="primary"
                class="mb-3 mx-auto elevation-2"
              >
                <VImg
                  v-if="perfil.documentos?.foto_perfil?.url"
                  :src="perfil.documentos.foto_perfil.url"
                  cover
                />
                <span
                  v-else
                  class="text-h4 text-white font-weight-bold"
                >{{ perfil.nombres?.charAt(0) }}</span>
              </VAvatar>

              <h4 class="portal-profile-name">
                {{ perfil.nombres }} {{ perfil.apellidos }}
              </h4>
              <span class="portal-profile-email">{{ perfil.correo }}</span>

              <div class="mt-3">
                <label class="portal-upload-btn portal-upload-btn--tonal cursor-pointer">
                  <VIcon
                    icon="tabler-camera"
                    size="16"
                    class="me-1"
                  />
                  Cambiar Fotografía
                  <input
                    type="file"
                    accept="image/*"
                    class="d-none"
                    @change="subirArchivo($event, 'foto_perfil')"
                  >
                </label>
              </div>
            </div>

            <!-- Caja de Documentos Clave -->
            <div class="portal-box">
              <h5 class="portal-box-title mb-3 d-flex align-center">
                <VIcon
                  icon="tabler-paperclip"
                  size="18"
                  class="me-2 text-primary"
                />
                Documentos Obligatorios
              </h5>

              <!-- Curriculum Vitae -->
              <div class="doc-upload-item mb-4">
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="portal-doc-label">Curriculum Vitae (PDF)</span>
                  <VChip
                    size="x-small"
                    :color="perfil.documentos?.curriculum ? 'success' : 'warning'"
                    variant="tonal"
                  >
                    {{ perfil.documentos?.curriculum ? 'Cargado' : 'Pendiente' }}
                  </VChip>
                </div>

                <div
                  v-if="perfil.documentos?.curriculum"
                  class="d-flex justify-space-between align-center py-2 px-3 portal-doc-file-row rounded"
                >
                  <div class="d-flex align-center text-truncate">
                    <VIcon
                      icon="tabler-file-type-pdf"
                      color="error"
                      size="22"
                      class="me-2"
                    />
                    <span class="portal-doc-filename text-truncate">{{ perfil.documentos.curriculum.file_name }}</span>
                  </div>
                  <div class="d-flex gap-1">
                    <VBtn
                      icon="tabler-download"
                      size="x-small"
                      variant="text"
                      color="primary"
                      :href="perfil.documentos.curriculum.url"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                    <VBtn
                      icon="tabler-trash"
                      size="x-small"
                      color="error"
                      variant="text"
                      @click="eliminarArchivo(perfil.documentos.curriculum.id)"
                    />
                  </div>
                </div>

                <div
                  v-else
                  class="mt-2"
                >
                  <label class="portal-upload-btn portal-upload-btn--outlined w-100 cursor-pointer">
                    <VIcon
                      icon="tabler-upload"
                      size="16"
                      class="me-1"
                    />
                    Subir Curriculum (PDF)
                    <input
                      type="file"
                      accept=".pdf"
                      class="d-none"
                      @change="subirArchivo($event, 'curriculum')"
                    >
                  </label>
                </div>
              </div>

              <!-- DPI / Identificación -->
              <div class="doc-upload-item">
                <div class="d-flex justify-space-between align-center mb-1">
                  <span class="portal-doc-label">DPI / CUI</span>
                  <VChip
                    size="x-small"
                    :color="perfil.documentos?.dpi ? 'success' : 'secondary'"
                    variant="tonal"
                  >
                    {{ perfil.documentos?.dpi ? 'Cargado' : 'Opcional' }}
                  </VChip>
                </div>

                <div
                  v-if="perfil.documentos?.dpi"
                  class="d-flex justify-space-between align-center py-2 px-3 portal-doc-file-row rounded"
                >
                  <div class="d-flex align-center text-truncate">
                    <VIcon
                      icon="tabler-id"
                      color="primary"
                      size="22"
                      class="me-2"
                    />
                    <span class="portal-doc-filename text-truncate">{{ perfil.documentos.dpi.file_name }}</span>
                  </div>
                  <div class="d-flex gap-1">
                    <VBtn
                      icon="tabler-download"
                      size="x-small"
                      variant="text"
                      color="primary"
                      :href="perfil.documentos.dpi.url"
                      target="_blank"
                      rel="noopener noreferrer"
                    />
                    <VBtn
                      icon="tabler-trash"
                      size="x-small"
                      color="error"
                      variant="text"
                      @click="eliminarArchivo(perfil.documentos.dpi.id)"
                    />
                  </div>
                </div>

                <div
                  v-else
                  class="mt-2"
                >
                  <label class="portal-upload-btn portal-upload-btn--secondary w-100 cursor-pointer">
                    <VIcon
                      icon="tabler-upload"
                      size="16"
                      class="me-1"
                    />
                    Subir DPI (PDF / Imagen)
                    <input
                      type="file"
                      accept=".pdf,image/*"
                      class="d-none"
                      @change="subirArchivo($event, 'dpi')"
                    >
                  </label>
                </div>
              </div>
            </div>
          </VCol>

          <!-- Columna Derecha: Formulario de Datos -->
          <VCol
            cols="12"
            md="8"
          >
            <div class="portal-box">
              <h5 class="portal-box-title mb-4 d-flex align-center">
                <VIcon
                  icon="tabler-user-edit"
                  size="18"
                  class="me-2 text-primary"
                />
                Información Personal y Profesional
              </h5>

              <VRow>
                <VCol
                  cols="12"
                  sm="6"
                >
                  <VTextField
                    v-model="perfil.nombres"
                    label="Nombres *"
                    density="comfortable"
                    prepend-inner-icon="tabler-user"
                  />
                </VCol>
                <VCol
                  cols="12"
                  sm="6"
                >
                  <VTextField
                    v-model="perfil.apellidos"
                    label="Apellidos *"
                    density="comfortable"
                    prepend-inner-icon="tabler-user"
                  />
                </VCol>

                <VCol
                  cols="12"
                  sm="6"
                >
                  <VTextField
                    v-model="perfil.correo"
                    label="Correo Electrónico"
                    density="comfortable"
                    prepend-inner-icon="tabler-mail"
                    disabled
                  />
                </VCol>
                <VCol
                  cols="12"
                  sm="6"
                >
                  <VTextField
                    v-model="perfil.telefono"
                    label="Teléfono / Celular *"
                    density="comfortable"
                    prepend-inner-icon="tabler-phone"
                  />
                </VCol>

                <VCol
                  cols="12"
                  sm="6"
                >
                  <VTextField
                    v-model="perfil.dpi"
                    label="Número de DPI / CUI"
                    density="comfortable"
                    prepend-inner-icon="tabler-id"
                  />
                </VCol>
                <VCol
                  cols="12"
                  sm="6"
                >
                  <VTextField
                    v-model="perfil.fecha_nacimiento"
                    type="date"
                    label="Fecha de Nacimiento"
                    density="comfortable"
                    prepend-inner-icon="tabler-calendar"
                  />
                </VCol>

                <VCol
                  cols="12"
                  sm="6"
                >
                  <VSelect
                    v-model="perfil.genero"
                    :items="['Masculino', 'Femenino', 'Otro']"
                    label="Género"
                    density="comfortable"
                    prepend-inner-icon="tabler-gender-bigender"
                    :menu-props="{ theme: 'light' }"
                  />
                </VCol>
                <VCol
                  cols="12"
                  sm="6"
                >
                  <VSelect
                    v-model="perfil.nivel_academico"
                    :items="nivelesAcademicos"
                    item-title="title"
                    item-value="value"
                    label="Nivel Académico"
                    density="comfortable"
                    prepend-inner-icon="tabler-school"
                    :menu-props="{ theme: 'light' }"
                  />
                </VCol>

                <VCol
                  cols="12"
                  sm="6"
                >
                  <VTextField
                    v-model.number="perfil.pretension_salarial"
                    type="number"
                    label="Pretensión Salarial (Q)"
                    prefix="Q"
                    density="comfortable"
                    prepend-inner-icon="tabler-coin"
                  />
                </VCol>
                <VCol
                  cols="12"
                  sm="6"
                >
                  <VSelect
                    v-model="perfil.municipio_id"
                    :items="municipiosFiltrados"
                    item-title="nombre"
                    item-value="id"
                    label="Municipio de Residencia"
                    density="comfortable"
                    prepend-inner-icon="tabler-map-pin"
                    :menu-props="{ theme: 'light' }"
                  />
                </VCol>

                <VCol cols="12">
                  <VTextField
                    v-model="perfil.direccion"
                    label="Dirección Domiciliar"
                    density="comfortable"
                    prepend-inner-icon="tabler-home"
                  />
                </VCol>
              </VRow>

              <div class="text-end mt-4">
                <VBtn
                  color="primary"
                  prepend-icon="tabler-device-floppy"
                  :loading="guardandoPerfil"
                  @click="guardarPerfil"
                >
                  Guardar Perfil
                </VBtn>
              </div>
            </div>
          </VCol>
        </VRow>
      </div>
    </main>

    <!-- Diálogo: Detalle de Convocatoria -->
    <VDialog
      v-model="dialogDetalle"
      max-width="700"
      theme="light"
      content-class="portal-green-theme"
    >
      <VCard
        v-if="vacanteSeleccionada"
        class="dialog-vacante"
      >
        <VCardTitle class="d-flex justify-space-between align-center pa-4 bg-primary text-white">
          <div class="d-flex align-center">
            <VIcon
              icon="tabler-briefcase"
              class="me-2"
            />
            <span class="text-h6 text-white">{{ vacanteSeleccionada.titulo }}</span>
          </div>
          <VBtn
            icon="tabler-x"
            variant="text"
            color="white"
            density="compact"
            @click="dialogDetalle = false"
          />
        </VCardTitle>

        <VCardText class="pa-5">
          <div class="d-flex flex-wrap gap-2 mb-4">
            <VChip
              size="small"
              color="primary"
              variant="tonal"
            >
              <VIcon
                icon="tabler-building"
                size="14"
                class="me-1"
              />
              {{ vacanteSeleccionada.unidad }}
            </VChip>
            <VChip
              size="small"
              color="info"
              variant="tonal"
            >
              <VIcon
                icon="tabler-map-pin"
                size="14"
                class="me-1"
              />
              {{ vacanteSeleccionada.departamento }}
            </VChip>
            <VChip
              size="small"
              color="success"
              variant="tonal"
            >
              <VIcon
                icon="tabler-users"
                size="14"
                class="me-1"
              />
              {{ vacanteSeleccionada.plazas_disponibles }} plazas disponibles
            </VChip>
          </div>

          <div class="mb-4">
            <h5 class="text-subtitle-1 font-weight-bold mb-1">
              Descripción del Cargo
            </h5>
            <p class="text-body-2 text-medium-emphasis">
              {{ vacanteSeleccionada.descripcion || 'No se ha detallado una descripción específica para esta vacante.' }}
            </p>
          </div>

          <div class="mb-4">
            <h5 class="text-subtitle-1 font-weight-bold mb-1">
              Requisitos y Competencias
            </h5>
            <p class="text-body-2 text-medium-emphasis">
              {{ vacanteSeleccionada.requisitos || 'No se han especificado requisitos adicionales para esta posición.' }}
            </p>
          </div>

          <div class="bg-surface rounded pa-3 border text-caption text-medium-emphasis">
            <strong>Fecha límite estimada:</strong> {{ vacanteSeleccionada.fecha_cierre_estimada || 'Hasta llenar vacantes' }}
          </div>
        </VCardText>

        <VCardActions class="pa-4 bg-light d-flex justify-end gap-2">
          <VBtn
            variant="text"
            color="secondary"
            @click="dialogDetalle = false"
          >
            Cerrar
          </VBtn>
          <VBtn
            v-if="yaPostulado(vacanteSeleccionada.id)"
            color="success"
            variant="tonal"
            prepend-icon="tabler-check"
            disabled
          >
            Ya te has postulado
          </VBtn>
          <VBtn
            v-else
            color="primary"
            prepend-icon="tabler-send"
            @click="solicitarPostulacion(vacanteSeleccionada)"
          >
            Postularme Ahora
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>

    <!-- Diálogo: Autenticación / Registro de Candidato -->
    <VDialog
      v-model="dialogAuth"
      max-width="500"
      theme="light"
    >
      <VCard class="auth-dialog-card">
        <VCardTitle class="pa-4 text-center">
          <div class="portal-logo-badge mx-auto mb-2">
            <VIcon
              icon="tabler-user-circle"
              color="white"
              size="26"
            />
          </div>
          <h4 class="text-h6 font-weight-bold">
            {{ authTab === 'login' ? 'Iniciar Sesión' : 'Crea tu Cuenta de Candidato' }}
          </h4>
          <span class="text-caption text-medium-emphasis">
            {{ authTab === 'login' ? 'Ingresa con tu correo y contraseña' : 'Completa tus datos básicos para postularte' }}
          </span>
        </VCardTitle>

        <VTabs
          v-model="authTab"
          grow
          color="primary"
          class="border-b"
        >
          <VTab value="login">
            Ya tengo cuenta
          </VTab>
          <VTab value="registro">
            Soy nuevo candidato
          </VTab>
        </VTabs>

        <VCardText class="pa-5">
          <VAlert
            v-if="authError"
            type="error"
            variant="tonal"
            density="compact"
            class="mb-4"
          >
            {{ authError }}
          </VAlert>

          <!-- Formulario Login -->
          <form
            v-if="authTab === 'login'"
            @submit.prevent="iniciarSesion"
          >
            <VTextField
              v-model="formLogin.correo"
              label="Correo Electrónico"
              type="email"
              prepend-inner-icon="tabler-mail"
              density="comfortable"
              class="mb-3"
              required
            />
            <VTextField
              v-model="formLogin.password"
              label="Contraseña"
              type="password"
              prepend-inner-icon="tabler-lock"
              density="comfortable"
              class="mb-4"
              required
            />
            <VBtn
              type="submit"
              color="primary"
              block
              size="large"
              :loading="procesandoAuth"
            >
              Iniciar Sesión y Continuar
            </VBtn>
          </form>

          <!-- Formulario Registro -->
          <form
            v-else
            @submit.prevent="registrarse"
          >
            <VRow dense>
              <VCol
                cols="12"
                sm="6"
              >
                <VTextField
                  v-model="formRegistro.nombres"
                  label="Nombres *"
                  density="comfortable"
                  class="mb-2"
                  required
                />
              </VCol>
              <VCol
                cols="12"
                sm="6"
              >
                <VTextField
                  v-model="formRegistro.apellidos"
                  label="Apellidos *"
                  density="comfortable"
                  class="mb-2"
                  required
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="formRegistro.correo"
                  label="Correo Electrónico *"
                  type="email"
                  density="comfortable"
                  class="mb-2"
                  required
                />
              </VCol>
              <VCol
                cols="12"
                sm="6"
              >
                <VTextField
                  v-model="formRegistro.telefono"
                  label="Teléfono / Celular"
                  density="comfortable"
                  class="mb-2"
                />
              </VCol>
              <VCol
                cols="12"
                sm="6"
              >
                <VTextField
                  v-model="formRegistro.dpi"
                  label="DPI / CUI"
                  density="comfortable"
                  class="mb-2"
                />
              </VCol>
              <VCol cols="12">
                <VTextField
                  v-model="formRegistro.password"
                  label="Contraseña (mínimo 6 caracteres) *"
                  type="password"
                  density="comfortable"
                  class="mb-4"
                  required
                />
              </VCol>
            </VRow>
            <VBtn
              type="submit"
              color="primary"
              block
              size="large"
              :loading="procesandoAuth"
            >
              Registrarme y Postularme
            </VBtn>
          </form>
        </VCardText>
      </VCard>
    </VDialog>

    <!-- Diálogo: Confirmar Postulación -->
    <VDialog
      v-model="dialogConfirmarPostulacion"
      max-width="500"
      theme="light"
      content-class="portal-green-theme"
    >
      <VCard class="pa-4">
        <VCardTitle class="text-h6 font-weight-bold d-flex align-center">
          <VIcon
            icon="tabler-send"
            color="primary"
            class="me-2"
          />
          Confirmar Postulación
        </VCardTitle>
        <VCardText class="pt-2">
          <p class="text-body-1 mb-2">
            Hola <strong>{{ perfil?.nombres }}</strong>, estás a punto de postularte a la siguiente posición:
          </p>

          <div class="bg-surface rounded pa-3 border my-3">
            <h4 class="text-subtitle-1 font-weight-bold text-primary">
              {{ vacanteParaPostular?.titulo }}
            </h4>
            <span class="text-caption text-medium-emphasis">{{ vacanteParaPostular?.unidad }} • {{ vacanteParaPostular?.departamento }}</span>
          </div>

          <div
            v-if="!perfil?.documentos?.curriculum"
            class="d-flex align-center bg-warning-lighten-5 rounded pa-2 border text-caption text-warning mb-2"
          >
            <VIcon
              icon="tabler-alert-circle"
              size="18"
              class="me-2 text-warning"
            />
            <span>Aún no has adjuntado tu CV. Puedes postularte ahora y subirlo luego en "Mi Expediente".</span>
          </div>

          <p class="text-caption text-medium-emphasis mb-0">
            Tu información de perfil será enviada al equipo de selección para la etapa de <strong>Solicitud recibida</strong>.
          </p>
        </VCardText>
        <VCardActions class="d-flex justify-end gap-2">
          <VBtn
            variant="text"
            color="secondary"
            @click="dialogConfirmarPostulacion = false"
          >
            Cancelar
          </VBtn>
          <VBtn
            color="primary"
            prepend-icon="tabler-check"
            :loading="postulando"
            @click="confirmarPostulacion"
          >
            Confirmar y Enviar
          </VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VThemeProvider>
</template>

<style scoped lang="scss">
@import '@styles/reclutamiento-talent.scss';

.portal-empleos-page {
  min-height: 100vh;
  width: 100%;
  background-color: #ffffff !important;
  color: #0f172a;
  display: flex;
  flex-direction: column;
}

.portal-header {
  background: #ffffff;
  border-bottom: 1px solid #dce6e2;
  position: sticky;
  top: 0;
  z-index: 100;
  box-shadow: 0 2px 12px rgba(15, 23, 42, 0.05);

  &__container {
    max-width: 1200px;
    margin: 0 auto;
    padding: 12px 20px;
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 12px;
    flex-wrap: wrap;
  }

  &__brand {
    display: flex;
    align-items: center;
    gap: 12px;
  }

  &__nav {
    display: flex;
    align-items: center;
    gap: 4px;
    flex-wrap: wrap;
  }
}

.nav-tab-btn {
  color: #1e293b !important;
  font-weight: 600 !important;
  border-radius: 10px !important;

  &:hover {
    background-color: #edf7f2 !important;
    color: #0d5f4c !important;
  }

  &--active {
    background-color: #e6f4ee !important;
    color: #0d5f4c !important;
    font-weight: 700 !important;
  }
}

.user-profile-btn {
  background-color: #e6f4ee !important;
  color: #0d5f4c !important;
  border: 1px solid rgba(17, 123, 99, 0.25) !important;
  font-weight: 700 !important;
  border-radius: 999px !important;
}

.portal-logo-badge {
  width: 42px;
  height: 42px;
  border-radius: 10px;
  background: linear-gradient(135deg, #117b63 0%, #0d5f4c 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 4px 12px rgba(17, 123, 99, 0.28);
}

.portal-title {
  font-size: 19px;
  font-weight: 800;
  color: #0f172a;
  line-height: 1.1;
  margin: 0;
}

.portal-subtitle {
  font-size: 11px;
  font-weight: 700;
  color: #475569;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.portal-section-title {
  font-size: 22px;
  font-weight: 800;
  color: #0f172a !important;
  letter-spacing: -0.02em;
  line-height: 1.25;
  margin: 0 0 4px;
}

.portal-section-count {
  font-size: 16px;
  font-weight: 700;
  color: #117b63 !important;
}

.portal-section-subtitle {
  font-size: 14px;
  font-weight: 500;
  color: #475569 !important;
}

.portal-hero {
  background: linear-gradient(135deg, #09483a 0%, #0d5f4c 48%, #117b63 100%);
  color: #ffffff;
  padding: 56px 20px 48px;
  text-align: center;
  position: relative;

  &__inner {
    max-width: 900px;
    margin: 0 auto;
  }

  &__tag {
    display: inline-block;
    background: rgba(255, 255, 255, 0.16);
    border: 1px solid rgba(255, 255, 255, 0.32);
    color: #ffffff;
    border-radius: 20px;
    padding: 5px 16px;
    font-size: 12px;
    font-weight: 700;
    letter-spacing: 1px;
    text-transform: uppercase;
    margin-bottom: 16px;
  }

  &__headline {
    font-size: clamp(28px, 4vw, 42px);
    font-weight: 800;
    line-height: 1.15;
    letter-spacing: -0.02em;
    margin-bottom: 12px;
    color: #ffffff !important;
  }

  &__lead {
    font-size: 16px;
    color: rgba(255, 255, 255, 0.93) !important;
    margin-bottom: 28px;
    max-width: 680px;
    margin-left: auto;
    margin-right: auto;
  }

  &__stats {
    display: flex;
    justify-content: center;
    gap: 16px;
    flex-wrap: wrap;
    margin-top: 24px;
  }
}

.hero-stat-pill {
  background: #ffffff;
  color: #0f172a !important;
  border-radius: 24px;
  padding: 8px 18px;
  font-size: 13px;
  font-weight: 600;
  display: flex;
  align-items: center;
  box-shadow: 0 4px 14px rgba(0, 0, 0, 0.12);

  strong {
    color: #0d5f4c;
    font-weight: 800;
  }
}

.portal-search-bar {
  background: #ffffff;
  color: #0f172a;
  text-align: left;
  border-radius: 14px;
  padding: 6px 10px;
  box-shadow: 0 14px 36px rgba(0, 0, 0, 0.2);
  max-width: 840px;
  margin: 0 auto;
  border: 1px solid rgba(255, 255, 255, 0.8);
}

@media (min-width: 960px) {
  .portal-search-col-divider {
    border-right: 1px solid #e2e8f0;
  }
}

.portal-container {
  max-width: 1200px;
  margin: 0 auto;
  padding-left: 20px;
  padding-right: 20px;
  width: 100%;
}

.job-card {
  background: #ffffff;
  border: 1px solid #dfe6ee;
  border-radius: 14px;
  padding: 20px;
  height: 100%;
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
  transition: transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease;

  &:hover {
    transform: translateY(-3px);
    box-shadow: 0 12px 28px rgba(17, 123, 99, 0.12);
    border-color: #117b63;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
  }

  &__title {
    font-size: 18px;
    font-weight: 800;
    color: #0f172a !important;
    margin: 0 0 8px;
    line-height: 1.3;
  }

  &__location {
    font-size: 13px;
    font-weight: 600;
    color: #1e293b !important;
    display: flex;
    align-items: center;

    &--dept {
      color: #475569 !important;
      font-weight: 500;
    }
  }

  &__desc {
    font-size: 13.5px;
    color: #334155 !important;
    line-height: 1.55;
    flex-grow: 1;
    margin-bottom: 16px;

    &--empty {
      color: #64748b !important;
    }
  }

  &__footer {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 8px;
    border-top: 1px solid #e2e8f0;
    padding-top: 12px;
    margin-top: auto;
  }

  &__date {
    font-size: 12px;
    font-weight: 600;
    color: #475569 !important;
    display: flex;
    align-items: center;
  }
}

.portal-box {
  background: #ffffff;
  border: 1px solid #dfe6ee;
  border-radius: 14px;
  padding: 24px;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
  color: #0f172a;
}

.portal-box-title {
  font-size: 16px;
  font-weight: 800;
  color: #0f172a !important;
}

.portal-profile-name {
  font-size: 18px;
  font-weight: 800;
  color: #0f172a !important;
  margin: 0 0 2px;
}

.portal-profile-email {
  font-size: 13px;
  font-weight: 500;
  color: #475569 !important;
  display: block;
}

.portal-doc-label {
  font-size: 13.5px;
  font-weight: 700;
  color: #1e293b !important;
}

.portal-doc-file-row {
  background-color: #f8fafc;
  border: 1px solid #cbd5e1;
}

.portal-doc-filename {
  font-size: 12.5px;
  font-weight: 600;
  color: #1e293b !important;
}

.portal-upload-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 8px 14px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 700;
  transition: all 0.18s ease;
  user-select: none;

  &--tonal {
    background-color: #e6f4ee;
    color: #0d5f4c;
    border: 1px solid rgba(17, 123, 99, 0.22);

    &:hover {
      background-color: #d5ece2;
    }
  }

  &--outlined {
    background-color: #ffffff;
    color: #117b63;
    border: 1.5px solid #117b63;

    &:hover {
      background-color: #edf7f2;
    }
  }

  &--secondary {
    background-color: #f8fafc;
    color: #334155;
    border: 1.5px solid #94a3b8;

    &:hover {
      background-color: #edf7f2;
      color: #0d5f4c;
      border-color: #117b63;
    }
  }
}

.application-card {
  background: #ffffff;
  border: 1px solid #dfe6ee;
  border-radius: 14px;
  padding: 20px;
  color: #0f172a;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.06);
}

.application-progress-steps {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
}

.app-step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;

  &__circle {
    width: 28px;
    height: 28px;
    border-radius: 50%;
    background: #e2e8f0;
    color: #475569;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    font-weight: 800;
    transition: all 0.2s ease;
  }

  &__label {
    font-size: 11px;
    font-weight: 700;
    color: #475569;
    text-transform: uppercase;
  }

  &--active {
    .app-step__circle {
      background: #117b63;
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(17, 123, 99, 0.35);
    }
    .app-step__label {
      color: #0d5f4c;
      font-weight: 800;
    }
  }

  &__line {
    flex-grow: 1;
    height: 3px;
    background: #cbd5e1;
    margin: 0 8px;
    margin-bottom: 16px;

    &--active {
      background: #117b63;
    }
  }
}

.portal-empty-card {
  background: #ffffff;
  color: #0f172a;
  border-radius: 14px;
  border: 1.5px dashed #cbd5e1;
  box-shadow: 0 6px 20px rgba(15, 23, 42, 0.05);
  padding: 40px 20px;

  h4 {
    color: #0f172a !important;
  }

  p {
    color: #475569 !important;
  }
}
</style>

<style lang="scss">
/* ========================================================
   Fondo Blanco Puro y Alto Contraste para /empleos
   (Mantiene botones primarios de Vuetify y elimina el fondo oscuro/violeta)
   ======================================================== */
html:has(.portal-empleos-page),
body:has(.portal-empleos-page),
.v-application:has(.portal-empleos-page),
.v-application__wrap:has(.portal-empleos-page),
.layout-wrapper.layout-blank:has(.portal-empleos-page) {
  background: #ffffff !important;
  background-color: #ffffff !important;
}

.portal-green-theme,
.portal-green-theme.v-theme--light,
.portal-green-theme .v-theme--light {
  --v-theme-secondary: 71, 85, 105 !important;
  --v-theme-on-secondary: 255, 255, 255 !important;
  --v-theme-surface: 255, 255, 255 !important;
  --v-theme-on-surface: 15, 23, 42 !important;
  --v-theme-background: 255, 255, 255 !important;
  --v-theme-on-background: 15, 23, 42 !important;
  --v-high-emphasis-opacity: 0.96 !important;
  --v-medium-emphasis-opacity: 0.78 !important;
  --v-disabled-opacity: 0.68 !important;
  --v-border-color: 15, 23, 42 !important;
  --v-border-opacity: 0.22 !important;
  background-color: #ffffff !important;
  color: #0f172a !important;
}

.portal-green-theme {
  .text-medium-emphasis {
    color: #475569 !important;
    opacity: 1 !important;
  }

  .v-card,
  .v-list {
    background-color: #ffffff !important;
    color: #0f172a !important;
  }

  .v-card-title,
  .v-list-item-title,
  h1, h2, h3, h4, h5, h6 {
    color: #0f172a;
  }

  .v-card-title.bg-primary,
  .v-card-title.bg-primary span,
  .portal-hero h2 {
    color: #ffffff !important;
  }

  /* Campos de formulario de alto contraste */
  .v-field__input,
  .v-field input,
  .v-select__selection-text,
  .v-text-field__prefix {
    color: #0f172a !important;
    font-weight: 500 !important;
    opacity: 1 !important;
  }

  .v-field input::placeholder,
  .v-field textarea::placeholder {
    color: #64748b !important;
    opacity: 1 !important;
  }

  .v-label,
  .v-field-label {
    color: #334155 !important;
    font-weight: 600 !important;
    opacity: 1 !important;
  }

  .v-field--focused .v-label,
  .v-field--focused .v-field-label {
    color: rgb(var(--v-theme-primary)) !important;
    font-weight: 700 !important;
  }

  .v-field--variant-outlined .v-field__outline {
    color: #94a3b8 !important;
    --v-field-border-opacity: 0.75 !important;
  }

  .v-field--variant-outlined:hover .v-field__outline {
    color: #475569 !important;
    --v-field-border-opacity: 1 !important;
  }

  .v-field--variant-outlined.v-field--focused .v-field__outline {
    color: rgb(var(--v-theme-primary)) !important;
    --v-field-border-opacity: 1 !important;
  }

  .v-field--disabled {
    opacity: 0.9 !important;
    background-color: #f1f5f9 !important;
    border-radius: 6px;

    .v-field__input,
    input {
      color: #475569 !important;
    }
  }

  .v-field__prepend-inner .v-icon,
  .v-field__append-inner .v-icon,
  .v-field__clearable .v-icon {
    color: #64748b !important;
    opacity: 0.95 !important;
  }
}
</style>
