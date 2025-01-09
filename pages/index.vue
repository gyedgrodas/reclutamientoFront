<template>
  <div>


    <VCard title="Want to integrate JWT? 🔒">


      <v-card-text>

        <!--        <p v-text="opcionesMenu"></p>-->
        <!--        <p v-text="navItems"></p>-->

        <v-form ref="refVForm" @submit.prevent="onSubmit">

          <v-row>
            <v-col cols="12">
              <v-text-field
                v-model="datos.hola"
                autofocus
                label="Usuario Dominio"
                type="email"
                placeholder="gyxxxxxx"
              />
            </v-col>

            <v-col cols="12">
              <v-text-field
                v-model="datos.mundo"
                label="Password"
                placeholder="············"
                type="password"
              />
            </v-col>

            <v-col cols="12">
              <v-btn
                type="submit"
                color="primary"
              >
                Submit
              </v-btn>
            </v-col>
          </v-row>
        </v-form>


      </v-card-text>


    </VCard>
  </div>
</template>


<script setup>

import navItems from '@/navigation/vertical'
import {ref} from "vue";

const opcionesMenu = useState('menu')
// const navItems = ref(opcionesMenu.value)

const refVForm = ref();

const datos = ref({
  'hola': '',
  'mundo': ''
})

const onSubmit = async () => {
  const {valid: isValid} = await refVForm.value?.validate()
  if (isValid) {
    console.log('onSubmit')
  }
}


</script>
