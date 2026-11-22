<script setup lang="ts">
interface ResultadoParImpar {
  numero: number;
  resultado: "PAR" | "IMPAR";
}

interface ResultadoPrimos {
  primos: number[];
  mensaje: string;
}

interface ResultadoFibonacci {
  sucesion: number[];
  suma_pares: number;
}

definePageMeta({
  navActiveLink: "dev-algoritmos",
  middleware: "permissions",
  action: "listar desarrollo",
  subject: "desarrollo",
});

const { post } = useClienteRequest();

// Ejercicio 1: Par o impar
const numero = ref<number | null>(null);
const resultadoParImpar = ref<ResultadoParImpar | null>(null);
const cargandoParImpar = ref(false);
const errorParImpar = ref("");

// Ejercicio 2: Números primos
const inicio = ref<number | null>(null);
const fin = ref<number | null>(null);
const resultadoPrimos = ref<ResultadoPrimos | null>(null);
const cargandoPrimos = ref(false);
const errorPrimos = ref("");

// Ejercicio 3: Fibonacci
const cantidad = ref<number | null>(null);
const resultadoFibonacci = ref<ResultadoFibonacci | null>(null);
const cargandoFibonacci = ref(false);
const errorFibonacci = ref("");

// Validación general de números enteros
const esEnteroValido = (
  valor: unknown,
  minimo: number,
  maximo: number,
): boolean => {
  if (valor === null || valor === undefined || valor === "") return false;

  const numero = Number(valor);

  return Number.isInteger(numero) && numero >= minimo && numero <= maximo;
};

// Ejercicio 1
const calcularParImpar = async () => {
  if (cargandoParImpar.value) return;

  errorParImpar.value = "";
  resultadoParImpar.value = null;

  if (!esEnteroValido(numero.value, -100000, 100000)) {
    errorParImpar.value = "Ingrese un número entero entre -100000 y 100000.";
    return;
  }

  cargandoParImpar.value = true;

  try {
    resultadoParImpar.value = await post<ResultadoParImpar>(
      "/api/desarrollo/algoritmos/par-impar",
      { n: Number(numero.value) },
    );
  } catch (error) {
    manejaError(error);
  } finally {
    cargandoParImpar.value = false;
  }
};

// Ejercicio 2
const calcularPrimos = async () => {
  if (cargandoPrimos.value) return;

  errorPrimos.value = "";
  resultadoPrimos.value = null;

  if (
    !esEnteroValido(inicio.value, 1, 100000) ||
    !esEnteroValido(fin.value, 1, 100000) ||
    Number(inicio.value) > Number(fin.value)
  ) {
    errorPrimos.value = "Ingrese un rango válido: 1 ≤ a ≤ b ≤ 100000.";
    return;
  }

  cargandoPrimos.value = true;

  try {
    resultadoPrimos.value = await post<ResultadoPrimos>(
      "/api/desarrollo/algoritmos/primos",
      {
        a: Number(inicio.value),
        b: Number(fin.value),
      },
    );
  } catch (error) {
    manejaError(error);
  } finally {
    cargandoPrimos.value = false;
  }
};

// Ejercicio 3
const calcularFibonacci = async () => {
  if (cargandoFibonacci.value) return;

  errorFibonacci.value = "";
  resultadoFibonacci.value = null;

  if (!esEnteroValido(cantidad.value, 2, 40)) {
    errorFibonacci.value = "Ingrese una cantidad entera entre 2 y 40.";
    return;
  }

  cargandoFibonacci.value = true;

  try {
    resultadoFibonacci.value = await post<ResultadoFibonacci>(
      "/api/desarrollo/algoritmos/fibonacci",
      { n: Number(cantidad.value) },
    );
  } catch (error) {
    manejaError(error);
  } finally {
    cargandoFibonacci.value = false;
  }
};

const limpiarParImpar = () => {
  numero.value = null;
  resultadoParImpar.value = null;
  errorParImpar.value = "";
};

const limpiarPrimos = () => {
  inicio.value = null;
  fin.value = null;
  resultadoPrimos.value = null;
  errorPrimos.value = "";
};

const limpiarFibonacci = () => {
  cantidad.value = null;
  resultadoFibonacci.value = null;
  errorFibonacci.value = "";
};
</script>

<template>
  <div class="algoritmos-page">
    <!-- Encabezado -->
    <div class="d-flex flex-wrap align-center justify-space-between gap-4 mb-6">
      <div>
        <div class="d-flex align-center gap-2 mb-2">
          <VIcon icon="tabler-code" size="18" color="primary" />
          <span class="text-overline text-primary font-weight-bold">
            LABORATORIO DE DESARROLLO
          </span>
        </div>

        <h1 class="text-h4 font-weight-bold mb-2">Algoritmos numéricos</h1>

        <p class="text-body-1 text-medium-emphasis mb-0">
          Resolución de ejercicios matemáticos mediante algoritmos y
          procesamiento numérico.
        </p>
      </div>

      <VAvatar color="primary" variant="tonal" rounded="lg" size="64">
        <VIcon icon="tabler-calculator" size="34" />
      </VAvatar>
    </div>

    <VRow>
      <!-- EJERCICIO 1 -->
      <VCol cols="12" lg="6">
        <VCard class="algoritmo-card h-100" elevation="0" border>
          <VCardItem class="pb-3">
            <template #prepend>
              <VAvatar color="primary" variant="tonal" rounded="lg" size="48">
                <VIcon icon="tabler-hash" size="26" />
              </VAvatar>
            </template>

            <VCardTitle class="font-weight-bold">
              Número par o impar
            </VCardTitle>

            <VCardSubtitle> Ejercicio 01 </VCardSubtitle>
          </VCardItem>

          <VDivider />

          <VCardText class="pt-5">
            <p class="text-body-2 text-medium-emphasis mb-5">
              Determine si un número entero es par o impar utilizando el
              operador módulo.
            </p>

            <div class="mb-4">
              <div class="text-caption text-medium-emphasis mb-1">
                RANGO PERMITIDO
              </div>

              <VChip color="primary" variant="tonal" size="small">
                -100000 ≤ n ≤ 100000
              </VChip>
            </div>

            <VForm @submit.prevent="calcularParImpar">
              <AppTextField
                v-model.number="numero"
                label="Número entero"
                placeholder="Ejemplo: 4"
                type="number"
                :min="-100000"
                :max="100000"
                step="1"
                class="mb-4"
              />

              <VAlert
                v-if="errorParImpar"
                type="error"
                variant="tonal"
                density="compact"
                class="mb-4"
              >
                {{ errorParImpar }}
              </VAlert>

              <div class="d-flex gap-3">
                <VBtn
                  type="submit"
                  color="primary"
                  prepend-icon="tabler-calculator"
                  :loading="cargandoParImpar"
                >
                  Calcular
                </VBtn>

                <VBtn
                  color="secondary"
                  variant="tonal"
                  prepend-icon="tabler-refresh"
                  :disabled="cargandoParImpar"
                  @click="limpiarParImpar"
                >
                  Limpiar
                </VBtn>
              </div>
            </VForm>

            <VExpandTransition>
              <div v-if="resultadoParImpar" class="resultado-panel mt-6">
                <div class="d-flex align-center justify-space-between mb-3">
                  <span class="text-subtitle-2 font-weight-bold">
                    Resultado del análisis
                  </span>

                  <VIcon icon="tabler-circle-check" color="success" size="20" />
                </div>

                <div class="d-flex align-center justify-space-between">
                  <div>
                    <div class="text-caption text-medium-emphasis">
                      Número evaluado
                    </div>

                    <div class="text-h5 font-weight-bold">
                      {{ resultadoParImpar.numero }}
                    </div>
                  </div>

                  <VChip
                    :color="
                      resultadoParImpar.resultado === 'PAR'
                        ? 'success'
                        : 'warning'
                    "
                    size="large"
                    variant="tonal"
                  >
                    <VIcon icon="tabler-check" start />

                    {{ resultadoParImpar.resultado }}
                  </VChip>
                </div>
              </div>
            </VExpandTransition>
          </VCardText>
        </VCard>
      </VCol>

      <!-- EJERCICIO 2 -->
      <VCol cols="12" lg="6">
        <VCard class="algoritmo-card h-100" elevation="0" border>
          <VCardItem class="pb-3">
            <template #prepend>
              <VAvatar color="info" variant="tonal" rounded="lg" size="48">
                <VIcon icon="tabler-list-numbers" size="26" />
              </VAvatar>
            </template>

            <VCardTitle class="font-weight-bold"> Números primos </VCardTitle>

            <VCardSubtitle> Ejercicio 02 </VCardSubtitle>
          </VCardItem>

          <VDivider />

          <VCardText class="pt-5">
            <p class="text-body-2 text-medium-emphasis mb-5">
              Encuentre todos los números primos que existen dentro de un rango
              inclusivo.
            </p>

            <div class="mb-4">
              <div class="text-caption text-medium-emphasis mb-1">
                RANGO PERMITIDO
              </div>

              <VChip color="info" variant="tonal" size="small">
                1 ≤ a ≤ b ≤ 100000
              </VChip>
            </div>

            <VForm @submit.prevent="calcularPrimos">
              <VRow>
                <VCol cols="6">
                  <AppTextField
                    v-model.number="inicio"
                    label="Número inicial (a)"
                    placeholder="Ejemplo: 1"
                    type="number"
                    min="1"
                    max="100000"
                    step="1"
                  />
                </VCol>

                <VCol cols="6">
                  <AppTextField
                    v-model.number="fin"
                    label="Número final (b)"
                    placeholder="Ejemplo: 10"
                    type="number"
                    min="1"
                    max="100000"
                    step="1"
                  />
                </VCol>
              </VRow>

              <VAlert
                v-if="errorPrimos"
                type="error"
                variant="tonal"
                density="compact"
                class="mt-4 mb-4"
              >
                {{ errorPrimos }}
              </VAlert>

              <div class="d-flex gap-3 mt-4">
                <VBtn
                  type="submit"
                  color="primary"
                  prepend-icon="tabler-search"
                  :loading="cargandoPrimos"
                >
                  Buscar primos
                </VBtn>

                <VBtn
                  color="secondary"
                  variant="tonal"
                  prepend-icon="tabler-refresh"
                  :disabled="cargandoPrimos"
                  @click="limpiarPrimos"
                >
                  Limpiar
                </VBtn>
              </div>
            </VForm>

            <VExpandTransition>
              <div v-if="resultadoPrimos" class="resultado-panel mt-6">
                <div class="d-flex align-center justify-space-between mb-3">
                  <span class="text-subtitle-2 font-weight-bold">
                    Números primos encontrados
                  </span>

                  <VChip color="info" size="small" variant="tonal">
                    {{ resultadoPrimos.primos.length }} encontrados
                  </VChip>
                </div>

                <div
                  v-if="resultadoPrimos.primos.length"
                  class="primos-container"
                >
                  <VChip
                    v-for="primo in resultadoPrimos.primos"
                    :key="primo"
                    color="info"
                    variant="tonal"
                    size="small"
                  >
                    {{ primo }}
                  </VChip>
                </div>

                <VAlert
                  v-else
                  color="warning"
                  variant="tonal"
                  density="compact"
                >
                  No se encontraron números primos.
                </VAlert>
              </div>
            </VExpandTransition>
          </VCardText>
        </VCard>
      </VCol>

      <!-- EJERCICIO 3 -->
      <VCol cols="12">
        <VCard class="algoritmo-card" elevation="0" border>
          <VCardItem class="pb-3">
            <template #prepend>
              <VAvatar color="success" variant="tonal" rounded="lg" size="48">
                <VIcon icon="tabler-chart-line" size="26" />
              </VAvatar>
            </template>

            <VCardTitle class="font-weight-bold">
              Sucesión de Fibonacci
            </VCardTitle>

            <VCardSubtitle> Ejercicio 03 </VCardSubtitle>
          </VCardItem>

          <VDivider />

          <VCardText class="pt-5">
            <p class="text-body-2 text-medium-emphasis mb-5">
              Genere los primeros términos de Fibonacci y calcule la suma de los
              valores pares.
            </p>

            <VRow>
              <VCol cols="12" md="5" lg="4">
                <div class="text-caption text-medium-emphasis mb-2">
                  CANTIDAD PERMITIDA
                </div>

                <VChip
                  color="success"
                  variant="tonal"
                  size="small"
                  class="mb-5"
                >
                  2 ≤ n ≤ 40
                </VChip>

                <VForm @submit.prevent="calcularFibonacci">
                  <AppTextField
                    v-model.number="cantidad"
                    label="Cantidad de términos"
                    placeholder="Ejemplo: 7"
                    type="number"
                    min="2"
                    max="40"
                    step="1"
                    class="mb-4"
                  />

                  <VAlert
                    v-if="errorFibonacci"
                    type="error"
                    variant="tonal"
                    density="compact"
                    class="mb-4"
                  >
                    {{ errorFibonacci }}
                  </VAlert>

                  <div class="d-flex flex-wrap gap-3">
                    <VBtn
                      type="submit"
                      color="primary"
                      prepend-icon="tabler-player-play"
                      :loading="cargandoFibonacci"
                    >
                      Generar sucesión
                    </VBtn>

                    <VBtn
                      color="secondary"
                      variant="tonal"
                      prepend-icon="tabler-refresh"
                      :disabled="cargandoFibonacci"
                      @click="limpiarFibonacci"
                    >
                      Limpiar
                    </VBtn>
                  </div>
                </VForm>
              </VCol>

              <VCol cols="12" md="7" lg="8">
                <VExpandTransition>
                  <div v-if="resultadoFibonacci" class="resultado-panel">
                    <div class="d-flex align-center justify-space-between mb-4">
                      <span class="text-subtitle-2 font-weight-bold">
                        Sucesión generada
                      </span>

                      <VChip color="success" variant="tonal" size="small">
                        {{ resultadoFibonacci.sucesion.length }} términos
                      </VChip>
                    </div>

                    <div class="fibonacci-container mb-5">
                      <VChip
                        v-for="(termino, index) in resultadoFibonacci.sucesion"
                        :key="index"
                        :color="termino % 2 === 0 ? 'success' : 'secondary'"
                        variant="tonal"
                      >
                        {{ termino }}
                      </VChip>
                    </div>

                    <VDivider class="mb-4" />

                    <div class="d-flex align-center justify-space-between">
                      <div>
                        <div class="text-caption text-medium-emphasis">
                          Suma de términos pares
                        </div>

                        <div class="text-h4 font-weight-bold text-success">
                          {{ resultadoFibonacci.suma_pares }}
                        </div>
                      </div>

                      <VAvatar
                        color="success"
                        variant="tonal"
                        rounded="lg"
                        size="48"
                      >
                        <VIcon icon="tabler-sum" size="26" />
                      </VAvatar>
                    </div>

                    <div class="d-flex align-center gap-2 mt-4">
                      <VIcon
                        icon="tabler-circle-filled"
                        size="10"
                        color="success"
                      />

                      <span class="text-caption text-medium-emphasis">
                        Los términos resaltados en verde son números pares.
                      </span>
                    </div>
                  </div>
                </VExpandTransition>

                <div v-if="!resultadoFibonacci" class="fibonacci-empty">
                  <VIcon
                    icon="tabler-chart-dots"
                    size="44"
                    color="disabled"
                    class="mb-3"
                  />

                  <div class="text-body-2 font-weight-medium mb-1">
                    Sin resultados todavía
                  </div>

                  <div class="text-caption text-medium-emphasis">
                    Ingrese la cantidad de términos y genere la sucesión.
                  </div>
                </div>
              </VCol>
            </VRow>
          </VCardText>
        </VCard>
      </VCol>
    </VRow>
  </div>
</template>

<style scoped>
.algoritmos-page {
  padding-block-end: 24px;
}

.algoritmo-card {
  border-radius: 12px;
  transition: box-shadow 0.2s ease;
}

.algoritmo-card:hover {
  box-shadow: 0 4px 18px rgb(var(--v-theme-on-surface) / 6%);
}

.resultado-panel {
  padding: 20px;
  border: 1px solid rgb(var(--v-theme-on-surface) / 10%);
  border-radius: 10px;
  background: rgb(var(--v-theme-on-surface) / 3%);
}

.primos-container,
.fibonacci-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  max-block-size: 240px;
  overflow-y: auto;
}

.fibonacci-empty {
  display: flex;
  min-block-size: 220px;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  border: 1px dashed rgb(var(--v-theme-on-surface) / 16%);
  border-radius: 10px;
  text-align: center;
}

@media (max-width: 600px) {
  .resultado-panel {
    padding: 14px;
  }
}
</style>
