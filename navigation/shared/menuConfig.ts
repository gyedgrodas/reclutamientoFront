const menuConfig = [
  {
    title: 'Home',
    to: { name: 'index' },
    icon: { icon: 'tabler-smart-home' },
    action: 'crear usuarios',
    subject: 'usuarios',
  },
  {
    title: 'Second page',
    to: 'second-page',
    icon: { icon: 'tabler-file' },
    action: 'crear usuarios',
    subject: 'usuarios',
  },
  {
    title: 'Tercer page',
    to: { name: 'tercera-pagina' },
    icon: { icon: 'tabler-file' },
    action: 'editar usuarios',
    subject: 'usuarios',
  },
  {
    title: 'Modulo Usuarios',
    icon: { icon: 'tabler-users' },
    children: [
      {
        title: 'Usuarios',
        to: 'usuarios',
        action: 'listar usuarios',
        subject: 'usuarios',
      },
    ],
    action: 'modulo usuarios',
    subject: 'usuarios',
  },
]

export default menuConfig
