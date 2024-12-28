export default [
  {
    title: 'Home',
    to: { name: 'index' },
    icon: { icon: 'tabler-smart-home' },
  },
  {
    title: 'Second page',
    to: { name: 'second-page' },
    icon: { icon: 'tabler-file' },
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
]
