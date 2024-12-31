export default [
  {
    title: 'Home',
    to: { name: 'index' },
    icon: { icon: 'tabler-smart-home' },
    action: 'crear usuarios',
    subject: 'usuarios',
  },
  {
    title: 'Second page',
    to: { name: 'second-page' },
    icon: { icon: 'tabler-file' },
    action: 'crear usuarios',
    subject: 'usuarios',
  },
  {
    title: 'Modulo Usuarios',
    icon: { icon: 'tabler-users' },
    children: [
      { title: 'Usuarios',
      to: {name:'usuarios'},
      },
    ],
  },
  {
    title: 'Tercer page',
    to: { name: 'tercera-pagina' },
    icon: { icon: 'tabler-file' },
    action: 'editar usuarios',
    subject: 'usuarios',
  },

]
