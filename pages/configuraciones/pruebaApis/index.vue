<script setup lang="ts">
import { ref } from 'vue'
import type { VForm } from 'vuetify/lib/components/VForm'

const isFormValid = ref(false)
const refForm = ref<VForm>()

const { showToastError, showToastWarning, showToastSuccess } = useToast()
const { paginaEspera } = useCargandoPagina()
const { get, post, put, deleted } = useClienteRequest()

const baseUrl = ref<string>(process.env.NUXT_PUBLIC_API_BASE_URL || 'http://sysbaseback.test/')
const metodoSeleccionado = ref<{ nombre: string; valor: string }>({ nombre: 'GET', valor: 'get' })

const ejemploUrl = ref<string>('api/users')

const parametros = ref([{ nombre: '', valor: '' }])

const result = ref<any>(null)

const metodos = [
  { nombre: 'GET', valor: 'get' },
  { nombre: 'POST', valor: 'post' },
  { nombre: 'PUT', valor: 'put' },
  { nombre: 'PATCH', valor: 'patch' },
  { nombre: 'DELETE', valor: 'delete' },

]

const body = ref('{' + '\n\n' + '}')

const parametrosFormateados = computed(() => {
  const params: { [key: string]: string } = {}

  parametros.value.forEach(param => {
    if (param.nombre && param.valor)
      params[param.nombre] = param.valor
  })

  console.log(params)

  return params
})

const agregarParametro = () => {
  const ultimo = parametros.value[parametros.value.length - 1]
  if (ultimo.nombre || ultimo.valor)
    parametros.value.push({ nombre: '', valor: '' })
}

const eliminarParametro = (index: number) => {
  parametros.value.splice(index, 1)
}

const limpiarParametro = () => {
  parametros.value = [{ nombre: '', valor: '' }]
}

watch(metodoSeleccionado.value, () => {
  result.value = null
})

const runApi = async () => {
  paginaEspera.value = true
  if (!ejemploUrl.value) {
    paginaEspera.value = false

    return showToastError('Ingrese una URL')
  }
  const url = `${baseUrl.value}${ejemploUrl.value}`
  let response: any
  try {
    switch (metodoSeleccionado.value.valor) {
      case 'get':
        response = await get(url, { params: parametrosFormateados.value })
        break
      case 'post':
        response = await post(url, JSON.stringify(JSON.parse(body.value)))
        break
      case 'put':
        response = await put(url, JSON.stringify(JSON.parse(body.value)))
        break
      case 'patch':
        response = await put(url, JSON.stringify(JSON.parse(body.value)))
        break
      case 'delete':
        response = await deleted(url)
        break
      default:
        showToastWarning('Método no soportado')

        return
    }
    showToastSuccess('Petición exitosa')
    result.value = JSON.stringify(response.data, null, 2)
  }
  catch (e) {
    if (e.response)
      result.value = JSON.stringify(e.response.data, null, 2)
    else
      showToastError(e.message)
  }
  paginaEspera.value = false
}
</script>

<template>
  <VForm
    ref="refForm"
    v-model="isFormValid"
    @submit.prevent="runApi"
  >
    <h1>Prueba de APIs</h1>
    <VCard>
      <VCardText>
        <VRow class="mt-3">
          <VCol cols="2">
            <label>Método de envío</label>
            <AppSelect
              v-model="metodoSeleccionado.valor"
              placeholder="Seleccione un método"
              :items="metodos"
              item-value="valor"
              item-title="nombre"
            />
          </VCol>
          <VCol cols="10">
            <AppTextField
              v-model="ejemploUrl"
              label="API / URL:"
              placeholder="url"
              :prefix="baseUrl"
            >
              <template #append>
                <VBtn
                  type="submit"
                  color="primary"
                >
                  <VIcon
                    icon="tabler-player-play"
                    start
                  />
                  Probar
                </VBtn>
              </template>
            </AppTextField>
          </vcol>
        </VRow>
      </vcardtext>
      <VCardText v-if="metodoSeleccionado.valor === 'get' || metodoSeleccionado.valor === 'delete'">
        <h3>Parámetros</h3>
        <VTable class="text-no-wrap">
          <thead>
            <tr>
              <th style="width: 30%">
                Nombre
              </th>
              <th style="width: 30%">
                Valor
              </th>
              <th style="width: 10%">
                Acción
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="(param, index) in parametros"
              :key="index"
            >
              <td>
                <AppTextField
                  v-model="param.nombre"
                  class="form-control"
                  placeholder="ej: id"
                  @input="agregarParametro"
                />
              </td>
              <td>
                <AppTextField
                  v-model="param.valor"
                  class="form-control"
                  placeholder="ej: 1"
                />
              </td>
              <td>
                <VBtn
                  v-show="index > 0"
                  color="error"
                  @click="eliminarParametro(index)"
                >
                  <VIcon icon="tabler-trash" />
                </VBtn>
                <VBtn
                  v-show="index === 0"
                  color="primary"
                  @click="limpiarParametro"
                >
                  <VIcon icon="tabler-backspace" />
                </VBtn>
              </td>
            </tr>
          </tbody>
        </VTable>
      </VCardText>
      <VCardText v-else>
        <h3>Body</h3>
        <AppTextarea
          v-model="body"
          auto-grow
          placeholder="Ingrese los parámetros"
          :rules="[requiredValidator]"
        />
      </VCardText>
    </VCard>
    <br>
    <h1>Resultado</h1>
    <VCard>
      <VCardText>
        <pre>{{ result }}</pre>
      </VCardText>
    </VCard>
  </vform>
</template>

<style scoped lang="scss">

</style>
