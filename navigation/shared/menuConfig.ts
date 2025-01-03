const menuConfig = [
  {
    title: 'Home',
    to: { name: 'index' },
    icon: { icon: 'tabler-smart-home' },
    action: 'crear usuario',
    subject: 'usuario',
  },
  {
    title: 'Second page',
    to: { name: 'second-page' },
    icon: { icon: 'tabler-file' },
    action: 'crear usuario',
    subject: 'usuario',
  },
  {
    title: 'Tercer page',
    to: { name: 'tercera-pagina' },
    icon: { icon: 'tabler-file' },
    action: 'editar usuario',
    subject: 'usuario',
  },
  {
    title: 'Modulo Usuarios',
    icon: { icon: 'tabler-users' },
    children: [
      {
        title: 'Usuarios',
        to: 'usuarios',
        action: 'listar usuario',
        subject: 'usuario',
      },
    ],
    action: 'modulo usuario',
    subject: 'usuario',
  },
]

export default menuConfig
