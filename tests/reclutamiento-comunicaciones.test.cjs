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
      if (name === '@/utils/reclutamientoUx') {
        return {
          UMBRAL_DIAS_ATENCION: 5,
          colorPuntoEtapa: () => '#218268',
          diasSinActualizar: () => 1,
          etiquetaDiasSinActualizar: () => 'Hace 1 día',
          inicialesPersona: () => 'CA',
          nombreCompletoPersona: () => 'Candidato Prueba',
          obtenerEtapaNombre: p => p?.etapaReclutamiento?.nombre || p?.etapa_reclutamiento?.nombre || 'Oferta laboral',
          obtenerEtapaPostulacion: p => p?.etapaReclutamiento || p?.etapa_reclutamiento || null,
          proximaAccionSugerida: () => 'Continuar proceso',
        }
      }
      if (name.endsWith('.vue'))
        return { default: { name: 'StubComponent', render: () => null } }

      return require(name)
    },
    useClienteRequest: () => api,
    useToast: () => ({ showToastSuccess() {} }),
    manejaError() {},
    Intl,
    AbortController,
  }

  vm.runInNewContext(js, context)

  const component = module.exports.default
  component.render = () => null
  const ability = createMongoAbility(rules)
  let childRef = null
  const wrapper = vue.defineComponent({
    setup() {
      return () => vue.h(component, {
        ...props,
        ref: el => {
          if (el)
            childRef = el
        },
      })
    },
  })
  const app = renderer.createApp(wrapper)
  app.use(abilitiesPlugin, ability)
  app.mount({})

  return { app, state: childRef.$.setupState, ability }
}

const flush = async () => {
  await new Promise(resolve => setImmediate(resolve))
  await vue.nextTick()
}

function hiringChecklist(overrides = {}) {
  return {
    oferta_aceptada: true,
    fecha_ingreso_propuesta: '2027-01-04',
    plazas_total: 2,
    plazas_ocupadas: 1,
    plazas_disponibles: 1,
    vacante_estado: 'En Proceso',
    contratacion: null,
    puede_confirmar: true,
    bloqueos: [],
    ...overrides,
  }
}

const hiringComponent = 'views/pages/reclutamiento/postulaciones/ContratacionPanel.vue'

test('Contratar exige fecha explícita y envía únicamente el cierre dedicado', async () => {
  const calls = []
  const actualizaciones = []
  const { app, state } = mount(hiringComponent, {
    postulacion: { id: 7, candidato_id: 3, estado: 'En proceso' },
    onActualizado: postulacion => actualizaciones.push(postulacion),
  }, {
    get: async url => url.includes('/contratacion') ? { data: hiringChecklist() } : { data: { id: 3, media: [] } },
    async post(url, payload) {
      calls.push({ url, payload })

      return { data: { id: 7, estado: 'Contratada' }, message: 'Contratación confirmada' }
    },
  })
  await flush()
  assert.equal(calls.length, 0)
  assert.equal(state.fechaIngreso, '2027-01-04')
  state.fechaIngreso = ''
  await state.confirmarContratacion()
  assert.equal(calls.length, 0)
  state.fechaIngreso = '2027-01-06'
  state.observaciones = '  Ingreso confirmado  '
  await state.confirmarContratacion()
  assert.equal(calls.length, 1)
  assert.equal(calls[0].url, '/api/postulaciones/7/contratacion')
  assert.equal(calls[0].payload.fecha_ingreso, '2027-01-06')
  assert.equal(calls[0].payload.observaciones, 'Ingreso confirmado')
  assert.equal(state.confirmar, false)
  assert.equal(actualizaciones[0].estado, 'Contratada')
  app.unmount()
})

test('Un lector o un bloqueo del servidor impide confirmar la contratación', async () => {
  for (const [rules, checklist] of [
    [[{ action: 'ver postulaciones', subject: 'Postulacion' }], hiringChecklist()],
    [[{ action: 'manage', subject: 'all' }], hiringChecklist({ puede_confirmar: false, bloqueos: ['Sin plazas disponibles'] })],
  ]) {
    const { app, state } = mount(hiringComponent, { postulacion: { id: 7, candidato_id: 3 } }, {
      get: async url => url.includes('/contratacion') ? { data: checklist } : { data: { id: 3 } },
      post: async () => assert.fail('No debe contratar con bloqueo o sin permiso'),
    }, rules)
    await flush()
    assert.equal(state.puedeConfirmar, false)
    await state.confirmarContratacion()
    app.unmount()
  }
})

test('Documentos informativos ausentes o no consultables no bloquean un cierre autorizado', async () => {
  const { app, state } = mount(hiringComponent, { postulacion: { id: 7, candidato_id: 3 } }, {
    async get(url) {
      if (url.includes('/contratacion'))
        return { data: hiringChecklist() }
      throw new Error('No fue posible obtener los documentos')
    },
  })
  await flush()
  assert.equal(state.puedeConfirmar, true)
  assert.ok(state.errorDocumentos)
  assert.equal(state.candidato, null)
  app.unmount()
})

test('Una carga fallida o inválida nunca permite confirmar contratación', async () => {
  for (const get of [
    async () => ({ data: null }),
    async () => { throw new Error('Servicio no disponible') },
  ]) {
    const { app, state } = mount(hiringComponent, { postulacion: { id: 7 } }, {
      get,
      post: async () => assert.fail('No debe confirmar sin resumen válido'),
    })
    await flush()
    assert.equal(state.puedeConfirmar, false)
    assert.ok(state.error)
    await state.confirmarContratacion()
    app.unmount()
  }
})

test('Una contratación registrada es final y conserva los datos del cierre', async () => {
  const { app, state } = mount(hiringComponent, { postulacion: { id: 7, estado: 'Contratada' } }, {
    get: async url => url.includes('/contratacion') ? { data: hiringChecklist({
      contratacion: { fecha_ingreso: '2027-01-06', confirmada_at: '2026-12-20T18:00:00Z', confirmada_por: { id: 2, nombres: 'Equipo', apellidos: 'RRHH' } },
      puede_confirmar: false,
    }) } : { data: { id: 3, media: [] } },
    post: async () => assert.fail('No debe duplicar la contratación'),
  })
  await flush()
  assert.equal(state.contratada, true)
  assert.equal(state.fechaIngreso, '2027-01-06')
  assert.equal(state.puedeConfirmar, false)
  await state.confirmarContratacion()
  app.unmount()
})

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

test('Aceptar oferta emite ofertaActualizada para reactividad inmediata sin recargar la página', async () => {
  const emitidas = []
  let ofertaActual = { id: 1, postulacion_id: 7, estado: 'Enviada', monto_bruto: '5000', moneda: 'GTQ', puesto: 'Analista' }
  const api = {
    get: async url => url.includes('/comunicaciones')
      ? { data: { data: [], last_page: 1 } }
      : { data: ofertaActual },
    async post(url, data) {
      ofertaActual = { ...ofertaActual, estado: data.estado, observaciones: data.observaciones }

      return { data: ofertaActual, message: 'Respuesta registrada manualmente.' }
    },
  }
  const { app, state } = mount('views/pages/reclutamiento/postulaciones/OfertaComunicacionesPanel.vue', {
    postulacion: { id: 7, estado: 'En proceso' },
    onOfertaActualizada: oferta => emitidas.push(oferta),
  }, api)
  await flush()
  assert.equal(emitidas.at(-1).estado, 'Enviada')
  state.respuesta = 'Aceptada'
  state.observacionesRespuesta = 'Aceptó por correo'
  await state.registrarRespuesta()
  assert.equal(state.oferta.estado, 'Aceptada')
  assert.equal(emitidas.at(-1).estado, 'Aceptada')
  app.unmount()
})

test('ContratacionPanel recarga checklist y habilita confirmación al cambiar refreshKey sin recargar navegador', async () => {
  let ofertaAceptada = false
  const props = vue.reactive({
    postulacion: { id: 7, candidato_id: 3, estado: 'En proceso', etapa_reclutamiento_id: 5 },
    refreshKey: 0,
  })
  const { app, state } = mount(hiringComponent, props, {
    get: async url => url.includes('/contratacion')
      ? {
          data: hiringChecklist({
            oferta_aceptada: ofertaAceptada,
            fecha_ingreso_propuesta: ofertaAceptada ? '2027-02-01' : null,
            puede_confirmar: ofertaAceptada,
            bloqueos: ofertaAceptada ? [] : ['La oferta laboral aún no ha sido aceptada.'],
          }),
        }
      : { data: { id: 3, media: [] } },
  })
  await flush()
  assert.equal(state.puedeConfirmar, false)
  assert.equal(state.fechaIngreso, '')

  ofertaAceptada = true
  props.refreshKey += 1
  await flush()

  assert.equal(state.checklist.oferta_aceptada, true)
  assert.equal(state.puedeConfirmar, true)
  assert.equal(state.fechaIngreso, '2027-02-01')
  app.unmount()
})

test('DetalleSeguimientoDialog sincroniza estado de oferta, cambia a Contratación y propaga el cierre', async () => {
  const actualizadas = []
  const { app, state } = mount('views/pages/reclutamiento/postulaciones/DetalleSeguimientoDialog.vue', {
    modelValue: true,
    postulacion: { id: 7, candidato_id: 3, estado: 'En proceso', etapa_reclutamiento_id: 5 },
    etapas: [
      { id: 5, nombre: 'Oferta laboral', orden: 5, estado: 'Activo' },
      { id: 6, nombre: 'Contratado', orden: 6, estado: 'Activo' },
    ],
    onActualizado: postulacion => actualizadas.push(postulacion),
  }, {
    get: async () => ({ data: [] }),
  })
  await flush()
  assert.equal(state.ofertaEstado, null)
  assert.equal(state.tabActiva, 'seguimiento')

  state.alActualizarOferta({ id: 1, postulacion_id: 7, estado: 'Aceptada' })
  assert.equal(state.ofertaEstado, 'Aceptada')
  assert.equal(state.refreshContratacion, 1)
  assert.equal(state.refreshHistorial, 1)

  state.abrirContratacion()
  assert.equal(state.tabActiva, 'contratacion')
  assert.equal(state.refreshContratacion, 2)

  state.alContratar({ id: 7, estado: 'Contratada', contratada_at: '2026-12-20T18:00:00Z' })
  assert.equal(actualizadas.length, 1)
  assert.equal(actualizadas[0].estado, 'Contratada')
  assert.equal(state.refreshHistorial, 2)
  assert.equal(state.refreshContratacion, 3)
  app.unmount()
})

test('DetalleSeguimientoDialog oculta pestañas Oferta y Contratación en etapas previas y las muestra en la etapa correspondiente', async () => {
  const props = vue.reactive({
    modelValue: true,
    postulacion: {
      id: 8,
      candidato_id: 4,
      estado: 'En proceso',
      etapa_reclutamiento_id: 1,
      etapaReclutamiento: { id: 1, nombre: 'Solicitud recibida' },
    },
    etapas: [
      { id: 1, nombre: 'Solicitud recibida', orden: 1, estado: 'Activo' },
      { id: 4, nombre: 'Entrevista con RRHH', orden: 4, estado: 'Activo' },
      { id: 5, nombre: 'Oferta laboral', orden: 5, estado: 'Activo' },
      { id: 6, nombre: 'Contratado', orden: 6, estado: 'Activo' },
    ],
  })

  const { app, state } = mount('views/pages/reclutamiento/postulaciones/DetalleSeguimientoDialog.vue', props, {
    get: async () => ({ data: [] }),
  })
  await flush()

  // En etapa Solicitud recibida: ambas pestañas deben estar ocultas
  assert.equal(state.mostrarTabOferta, false)
  assert.equal(state.mostrarTabContratacion, false)

  // En etapa Entrevista: ambas pestañas deben seguir ocultas
  props.postulacion = {
    ...props.postulacion,
    etapa_reclutamiento_id: 4,
    etapaReclutamiento: { id: 4, nombre: 'Entrevista con RRHH' },
  }
  await flush()
  assert.equal(state.mostrarTabOferta, false)
  assert.equal(state.mostrarTabContratacion, false)

  // Al avanzar a Oferta laboral: se habilitan las pestañas correspondientes
  props.postulacion = {
    ...props.postulacion,
    etapa_reclutamiento_id: 5,
    etapaReclutamiento: { id: 5, nombre: 'Oferta laboral' },
  }
  await flush()
  assert.equal(state.mostrarTabOferta, true)
  assert.equal(state.mostrarTabContratacion, true)

  app.unmount()
})
