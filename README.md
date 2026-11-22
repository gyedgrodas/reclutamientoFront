# vue

This template should help get you started developing with Vue 3 in Vite.

## Recommended IDE Setup

[VS Code](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=johnsoncodehk.volar) (and disable Vetur).

## Type Support for `.vue` Imports in TS

Since TypeScript cannot handle type information for `.vue` imports, they are shimmed to be a generic Vue component type by default. In most cases this is fine if you don't really care about component prop types outside of templates.

However, if you wish to get actual prop types in `.vue` imports (for example to get props validation when using manual `h(...)` calls), you can run `Volar: Switch TS Plugin on/off` from VS Code command palette.

## Customize configuration

See [Vite Configuration Reference](https://vitejs.dev/config/).

## Project Setup

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Type-Check, Compile and Minify for Production

```sh
npm run build
```

### Oferta laboral y correos del proceso

En el detalle de seguimiento de una postulación, la pestaña **Oferta y correos**
permite preparar las condiciones de la oferta, registrar la respuesta recibida
por correo y consultar los envíos del proceso. Aceptar una oferta no cambia
automáticamente la postulación a contratada.

La evaluación psicométrica requiere el enlace de la prueba y el plazo en
horario de Guatemala. Las entrevistas virtuales con RRHH esperan un enlace
de Meet válido antes de preparar el correo. La cuenta compartida necesita
autorizar `gmail.send` además de Calendar; el backend procesa los correos
mediante su tarea programada, no desde el navegador.

### Cierre de contratación

En **Seguimiento → Contratación**, revise la oferta aceptada y las plazas disponibles,
confirme la fecha de ingreso y pulse **Confirmar contratación**. La confirmación
finaliza la selección, registra usuario/fecha y prepara el correo de contratación.
No se puede contratar desde los selectores genéricos de etapa o estado.

La vacante se marca **Cubierta** solamente cuando se ocupan todas sus plazas.
Las demás postulaciones no se descartan automáticamente. Los documentos del
expediente se muestran informativamente, sin imponer requisitos obligatorios
no definidos. Los registros contratados anteriores sin datos de confirmación
se identifican como históricos; no se inventa una fecha de ingreso.

Pruebas de los componentes de oferta, contratación y comunicaciones (sin correos reales):

```powershell
node --test tests\reclutamiento-comunicaciones.test.cjs
```
