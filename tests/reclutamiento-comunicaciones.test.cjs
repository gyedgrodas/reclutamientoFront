const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')
const vm = require('node:vm')
const vue = require('vue')
const { parse, compileScript } = require('@vue/compiler-sfc')
const ts = require('typescript')
const { createMongoAbility } = require('@casl/ability')
const { abilitiesPlugin, useAbility } = require('@casl/vue')

const root = path.resolve(__dirname, '..')
const renderer = vue.createRenderer({
  createElement: () => ({}),
  createText: () => ({}),
  createComment: () => ({}),
  insert() {},
  remove() {},
  setText() {},
  setElementText() {},
  parentNode: () => null,
  nextSibling: () => null,
  patchProp() {},
})

function utilities() {
  const source = fs.readFileSync(path.join(root, 'utils', 'entrevistasGuatemala.ts'), 'utf8')
  const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const module = { exports: {} }

  vm.runInNewContext(js, { module, exports: module.exports, require, Intl, Date })

  return module.exports
}

function mount(relativePath, props, api, rules = [{ action: 'manage', subject: 'all' }]) {
  const filename = path.join(root, relativePath)
  const { descriptor } = parse(fs.readFileSync(filename, 'utf8'), { filename })
  const compiled = compileScript(descriptor, { id: 'communications-test' })
  const js = ts.transpileModule(compiled.content, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText
  const module = { exports: {} }
  const context = {
    ...vue,
    module,
    exports: module.exports,
    require: name => {
      if (name === '@casl/vue')
        return { useAbility }
      if (name === '@/utils/entrevistasGuatemala')
        return utilities()

      return require(name)
    },
    useClienteRequest: () => api,
    useToast: () => ({ showToastSuccess() {} }),
    Intl,
    AbortController,
  }

  vm.runInNewContext(js, context)

  const component = module.exports.default
  component.render = () => null
  const ability = createMongoAbility(rules)
  const app = renderer.createApp(component, props)
  app.use(abilitiesPlugin, ability)
  const instance = app.mount({})

  return { app, state: instance.$.setupState, ability }
}

const flush = async () => {
  await new Promise(resolve => setImmediate(resolve))
  await vue.nextTick()
}

test('La oferta carga sin enviar y conserva el contrato al guardar el borrador', async () => {
  const calls = []
  let saved = null
  const api = {
    async get(url) {
      if (url.includes('/comunicaciones'))
        return { data: { data: [], last_page: 1 } }

      return { data: saved }
    },
    async put(url, data) {
      calls.push({ url, data: { ...data } })
      saved = { ...data, id: 1, postulacion_id: 7, estado: 'Borrador' }

      return { data: saved, message: 'Guardada' }
    },
    async post() {
      assert.fail('Cargar o guardar un borrador no debe invocar envíos explícitos')
    },
  }
  const { app, state } = mount('views/pages/reclutamiento/postulaciones/OfertaComunicacionesPanel.vue', {
    postulacion: { id: 7, estado: 'En proceso', vacante: { puesto: { nombre: 'Analista' } } },
  }, api)
  await flush()
  assert.equal(state.form.puesto, 'Analista')
  Object.assign(state.form, {
    monto_bruto: '5000.00',
    fecha_inicio: '2027-01-04',
    fecha_vencimiento: '2026-12-28',
    condiciones: 'Jornada de lunes a viernes.',
  })
  await state.guardar()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, '/api/postulaciones/7/oferta')
  assert.equal(calls[0].data.monto_bruto, '5000.00')
  assert.equal(calls[0].data.moneda, 'GTQ')
  assert.equal(state.oferta.estado, 'Borrador')
  app.unmount()
})

test('Un lector no puede guardar una oferta ni registrar respuestas', async () => {
  const api = {
    get: async url => url.includes('/comunicaciones')
      ? { data: { data: [], last_page: 1 } }
      : { data: { id: 1, estado: 'Enviada', monto_bruto: '5000', moneda: 'GTQ' } },
    put: async () => assert.fail('Un lector no puede editar'),
    post: async () => assert.fail('Un lector no puede registrar respuestas'),
  }
  const { app, state } = mount('views/pages/reclutamiento/postulaciones/OfertaComunicacionesPanel.vue', {
    postulacion: { id: 7 },
  }, api, [{ action: 'ver postulaciones', subject: 'Postulacion' }])
  await flush()
  await state.guardar()
  await state.registrarRespuesta()
  app.unmount()
})

test('La respuesta se registra explícitamente sin marcar contratación', async () => {
  const calls = []
  const api = {
    get: async url => url.includes('/comunicaciones')
      ? { data: { data: [], last_page: 1 } }
      : { data: { id: 1, estado: 'Enviada', monto_bruto: '5000', moneda: 'GTQ' } },
    async post(url, data) {
      calls.push({ url, data })

      return { message: 'Respuesta registrada' }
    },
  }
  const { app, state } = mount('views/pages/reclutamiento/postulaciones/OfertaComunicacionesPanel.vue', {
    postulacion: { id: 7 },
  }, api)
  await flush()
  state.respuesta = 'Aceptada'
  state.observacionesRespuesta = ' Confirmación por correo '
  await state.registrarRespuesta()
  assert.equal(calls[0].url, '/api/postulaciones/7/oferta/respuesta')
  assert.equal(calls[0].data.estado, 'Aceptada')
  assert.equal(calls[0].data.observaciones, 'Confirmación por correo')
  assert.equal(calls.length, 1)
  app.unmount()
})

test('El plazo psicométrico se muestra en Guatemala sin perder la zona horaria', () => {
  const { app, state } = mount('views/pages/reclutamiento/postulaciones/EvaluacionCorreoFields.vue', {
    url: 'https://example.org/prueba',
    limite: '2026-12-01T15:30:00Z',
  }, {})
  assert.equal(state.fechaLocal, '2026-12-01T09:30')
  app.unmount()
})

test('Una respuesta de carga inválida no habilita guardar condiciones desconocidas', async () => {
  const api = {
    get: async () => ({ data: {} }),
    put: async () => assert.fail('Una carga inválida no habilita edición'),
  }
  const { app, state } = mount('views/pages/reclutamiento/postulaciones/OfertaComunicacionesPanel.vue', {
    postulacion: { id: 7 },
  }, api)
  await flush()
  assert.equal(state.cargaCompleta, false)
  assert.match(state.error, /formato esperado/)
  await state.guardar()
  app.unmount()
})

test('Resolver un envío incierto exige evidencia y no llama al reintento directo', async () => {
  const calls = []
  const api = {
    get: async url => url.includes('/comunicaciones')
      ? { data: { data: [], last_page: 1 } }
      : { data: null },
    async post(url, data) {
      calls.push({ url, data })

      return { message: 'Verificación registrada' }
    },
  }
  const { app, state } = mount('views/pages/reclutamiento/postulaciones/OfertaComunicacionesPanel.vue', {
    postulacion: { id: 7 },
  }, api)
  await flush()
  state.correoResolver = { id: 9, estado: 'Incierta' }
  await state.resolverIncierto()
  assert.equal(calls.length, 0)
  state.notaResolucion = ' Verificado en Enviados '
  state.resultadoResolucion = 'enviada'
  await state.resolverIncierto()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, '/api/comunicaciones/9/resolver')
  assert.equal(calls[0].data.resultado, 'enviada')
  assert.equal(calls[0].data.nota, 'Verificado en Enviados')
  app.unmount()
})
