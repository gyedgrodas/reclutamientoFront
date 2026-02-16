export const useArchivo = () => {
  const descargar = (
    blob: Blob,
    nombreArchivo?: string,
    contentDisposition?: string,
  ) => {
    const nombreFinal =
      nombreArchivo || extraerNombreDesdeHeader(contentDisposition);

    const blobUrl = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = nombreFinal;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(blobUrl);
  };

  const extraerNombreDesdeHeader = (
    contentDisposition?: string,
    porDefecto = "archivo",
  ) => {
    if (!contentDisposition) return porDefecto;

    const match = contentDisposition.match(/filename="?(.+?)"?$/);
    return match ? decodeURIComponent(match[1]) : porDefecto;
  };
  const abrir = (blob: Blob) => {
    const blobUrl = URL.createObjectURL(blob);
    window.open(blobUrl, "_blank");
    URL.revokeObjectURL(blobUrl);
  };

  return {
    descargar,
    abrir,
  };
};
