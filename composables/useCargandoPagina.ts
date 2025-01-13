export function useCargandoPagina() {
  const paginaEspera = useState('paginaEspera', () => false);
  const cargandoPagina = useState('cargandoPagina', () => false);

  return {
    paginaEspera,
    cargandoPagina,
  };
}
