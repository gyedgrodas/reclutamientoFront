const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const vue = require('vue')
const { parse, compileScript } = require('@vue/compiler-sfc')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')

function mountPortal(apiMock = {}, initialCookie = null, storageMap = new Map()) {
  const filename = path.join(root, 'pages', 'empleos', 'index.vue')
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename })
  const compiled = compileScript(descriptor, { id: 'portal-test' })
  const js = ts.transpileModule(compiled.content, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const module = { exports: {} }

  let cookieVal = initialCookie
  const cookieRef = {
    get value() { return cookieVal },
    set value(v) { cookieVal = v },
  }

  const localStorageMock = {
    getItem: key => (storageMap.has(key) ? storageMap.get(key) : null),
    setItem: (key, val) => storageMap.set(key, String(val)),
    removeItem: key => storageMap.delete(key),
  }

  const toastCalls = { success: [], error: [] }

  const context = {
    ...vue,
    module,
    exports: module.exports,
    require: name => {
      if (name === 'vue')
        return vue
      return {}
    },
    definePageMeta: () => {},
    useCookie: () => cookieRef,
    localStorage: localStorageMock,
    useClienteRequest: () => ({
      get: apiMock.get || (async () => ({ data: [] })),
      post: apiMock.post || (async () => ({ data: {} })),
      put: apiMock.put || (async () => ({ data: {} })),
      deleted: apiMock.deleted || apiMock.del || (async () => ({ data: {} })),
    }),
    useToast: () => ({
      showToastSuccess: msg => toastCalls.success.push(msg),
      showToastError: msg => toastCalls.error.push(msg),
    }),
    console,
  }

  vm.runInNewContext(js, context)
  const setup = module.exports.default.setup
  const instance = setup({}, { expose: () => {} })

  return { instance, toastCalls, cookieRef }
}

test('Portal público filtra vacantes por texto y departamento', async () => {
  const vacantesData = [
    {
      id: 1,
      titulo: 'Analista QA Senior',
      unidad: 'Tecnología',
      departamento: 'Guatemala',
      numero_plazas: 2,
      plazas_disponibles: 2,
      motivo: 'Nueva',
      descripcion: 'Pruebas automatizadas en Cypress',
      requisitos: 'Experiencia previa',
      fecha_apertura: '2026-11-20',
      fecha_cierre_estimada: '2026-12-01',
      estado: 'Publicada',
    },
    {
      id: 2,
      titulo: 'Cajero Institucional',
      unidad: 'Agencia Central',
      departamento: 'Quetzaltenango',
      numero_plazas: 1,
      plazas_disponibles: 1,
      motivo: 'Reemplazo',
      descripcion: 'Atención al público y manejo de valores',
      requisitos: 'Perito contador',
      fecha_apertura: '2026-11-21',
      fecha_cierre_estimada: '2026-12-05',
      estado: 'Publicada',
    },
  ]

  const { instance } = mountPortal({
    get: async url => {
      if (url.includes('/api/portal/vacantes')) return { data: vacantesData }
      if (url.includes('/api/portal/catalogos')) return { data: { departamentos: [], municipios: [] } }
      return { data: [] }
    },
  })

  await instance.cargarVacantes()
  assert.equal(instance.vacantes.value.length, 2)
  assert.equal(instance.totalPlazas.value, 3)

  // Filtrar por texto
  instance.busquedaTexto.value = 'QA'
  assert.equal(instance.vacantesFiltradas.value.length, 1)
  assert.equal(instance.vacantesFiltradas.value[0].titulo, 'Analista QA Senior')

  // Filtrar por departamento
  instance.busquedaTexto.value = ''
  instance.filtroDepartamento.value = 'Quetzaltenango'
  assert.equal(instance.vacantesFiltradas.value.length, 1)
  assert.equal(instance.vacantesFiltradas.value[0].titulo, 'Cajero Institucional')
})

test('Candidato no autenticado abre diálogo de inicio de sesión/registro al postularse', async () => {
  const vacante = {
    id: 10,
    titulo: 'Desarrollador Fullstack',
    unidad: 'Sistemas',
    departamento: 'Guatemala',
    numero_plazas: 1,
    plazas_disponibles: 1,
  }

  const { instance } = mountPortal()
  instance.solicitarPostulacion(vacante)

  assert.equal(instance.dialogAuth.value, true)
  assert.equal(instance.authTab.value, 'registro')
  assert.equal(instance.vacanteParaPostular.value.id, 10)
})

test('Candidato autenticado confirma postulación y actualiza lista de postulaciones', async () => {
  const vacante = {
    id: 25,
    titulo: 'Auditor Financiero',
    unidad: 'Auditoría Interna',
    departamento: 'Guatemala',
    numero_plazas: 1,
    plazas_disponibles: 1,
  }

  const misPostulacionesMock = []
  const { instance, toastCalls } = mountPortal({
    get: async url => {
      if (url.includes('/api/portal/mis-postulaciones')) return { data: misPostulacionesMock }
      if (url.includes('/api/portal/vacantes')) return { data: [vacante] }
      return { data: {} }
    },
    post: async (url, payload) => {
      if (url.includes('/api/portal/postular')) {
        misPostulacionesMock.push({
          id: 99,
          vacante_id: payload.vacante_id,
          puesto: 'Auditor Financiero',
          unidad: 'Auditoría Interna',
          etapa: 'Solicitud recibida',
          etapa_id: 1,
          fecha_postulacion: '2026-11-22',
          estado: 'En Proceso',
        })
        return { data: { id: 99 } }
      }
      return { data: {} }
    },
  }, 'token-activo-123')

  instance.perfil.value = {
    id: 5,
    nombres: 'Estuardo',
    apellidos: 'López',
    correo: 'estuardo@ejemplo.com',
  }

  instance.solicitarPostulacion(vacante)
  assert.equal(instance.dialogConfirmarPostulacion.value, true)

  await instance.confirmarPostulacion()
  assert.equal(instance.dialogConfirmarPostulacion.value, false)
  assert.equal(instance.yaPostulado(25), true)
  assert.equal(instance.tabActual.value, 'mis-postulaciones')
  assert.ok(toastCalls.success.some(m => m.includes('enviada con éxito')))
})

test('Registro e inicio de sesión desde el portal guarda token y carga perfil', async () => {
  const { instance, cookieRef, toastCalls } = mountPortal({
    post: async (url, payload) => {
      if (url.includes('/api/portal/auth/login')) {
        return {
          data: {
            token: 'nuevo-token-sanctum-456',
            user: { id: 1 },
            candidato: {
              id: 8,
              nombres: 'Sofía',
              apellidos: 'Herrera',
              correo: payload.correo,
            },
          },
        }
      }
      return { data: {} }
    },
    get: async () => ({ data: [] }),
  })

  instance.formLogin.value.correo = 'sofia@ejemplo.com'
  instance.formLogin.value.password = 'password123'

  await instance.iniciarSesion()
  assert.equal(cookieRef.value, 'nuevo-token-sanctum-456')
  assert.equal(instance.perfil.value.nombres, 'Sofía')
  assert.equal(instance.esCandidatoAutenticado.value, true)
  assert.ok(toastCalls.success.some(m => m.includes('Bienvenido de vuelta')))
})

test('La sesión y pestaña activa persisten en caché al recargar la página', async () => {
  const sharedStorage = new Map()

  // 1. Primera carga: inicia sesión y cambia a la pestaña de perfil
  const sesion1 = mountPortal({
    post: async url => {
      if (url.includes('/api/portal/auth/login')) {
        return {
          data: {
            token: 'token-persistente-999',
            user: { id: 12 },
            candidato: {
              id: 12,
              nombres: 'Edgar José',
              apellidos: 'Rodas Carías',
              correo: 'erodascarias@gmail.com',
            },
          },
        }
      }
      return { data: {} }
    },
    get: async url => {
      if (url.includes('/api/portal/perfil')) {
        return {
          data: {
            id: 12,
            nombres: 'Edgar José',
            apellidos: 'Rodas Carías',
            correo: 'erodascarias@gmail.com',
          },
        }
      }
      return { data: [] }
    },
  }, null, sharedStorage)

  sesion1.instance.formLogin.value.correo = 'erodascarias@gmail.com'
  sesion1.instance.formLogin.value.password = 'secret123'
  await sesion1.instance.iniciarSesion()

  sesion1.instance.tabActual.value = 'perfil'
  await vue.nextTick()

  // 2. Simular recarga de navegador (F5): incluso si la cookie inicial viene vacía, hidrata desde localStorage
  const sesionRecargada = mountPortal({}, null, sharedStorage)
  assert.equal(sesionRecargada.cookieRef.value, 'token-persistente-999')
  assert.equal(sesionRecargada.instance.esCandidatoAutenticado.value, true)
  assert.equal(sesionRecargada.instance.perfil.value.nombres, 'Edgar José')
  assert.equal(sesionRecargada.instance.tabActual.value, 'perfil')

  // 3. Al cerrar sesión se limpia completamente el caché
  sesionRecargada.instance.cerrarSesion()
  assert.equal(sesionRecargada.instance.esCandidatoAutenticado.value, false)
  assert.equal(sharedStorage.size, 0)
})
