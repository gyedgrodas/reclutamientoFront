import Swal from 'sweetalert2';

import {cookieRef} from '@layouts/stores/config'

export default function useToast() {

  const toast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    showConfirmButton: false,
    timer: 5000,
    timerProgressBar: true,
    didOpen(popup: HTMLElement) {
      popup.onmouseenter = Swal.stopTimer;
      popup.onmouseleave = Swal.resumeTimer;
    }
  });

  const showToastSuccess = (message: string) => {

    toast.fire({
      icon: 'success',
      title: message,
      iconColor: 'success',
      background: cookieRef('tema_color').value === 'dark' ? '#25293C' : '#fff',
      customClass: cookieRef('tema_color').value === 'dark' ? 'text-white' : 'text-black',
    })
  };

  const showToastError = (message: string) => {

    toast.fire({
      icon: 'error',
      title: message,
      iconColor: 'error',
      background: cookieRef('tema_color').value === 'dark' ? '#25293C' : '#fff',
      customClass: cookieRef('tema_color').value === 'dark' ? 'text-white' : 'text-black',
    })

  };

  const showToastWarning = (message: string) => {
    toast.fire({
      icon: 'warning',
      title: message,
      iconColor: 'warning',
      background: cookieRef('tema_color').value === 'dark' ? '#25293C' : '#fff',
      customClass: cookieRef('tema_color').value === 'dark' ? 'text-white' : 'text-black',
    })
  };

  const showToastInfo = (message: string) => {
    toast.fire({
      icon: 'info',
      title: message,
      iconColor: 'info',
      background: cookieRef('tema_color').value === 'dark' ? '#25293C' : '#fff',
      customClass: cookieRef('tema_color').value === 'dark' ? 'text-white' : 'text-black',
    })
  };

  const preguntaEliminar = async (titulo: string, message?: string) => {
    return await Swal.fire({
      title: titulo ?? '¿Estás seguro?',
      text: message ?? 'No podrás revertir esto!',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Si, eliminar',
      cancelButtonText: 'Cancelar',
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      background: cookieRef('tema_color').value === 'dark' ? '#25293C' : '#fff',
      customClass: cookieRef('tema_color').value === 'dark' ? 'text-white' : 'text-black',
    }).then((result) => {
      return result.isConfirmed;
    });
    return false;
  };

  const realizarPregunta = async ({
                                    titulo = "¿Estás seguro?",
                                    message = "No podrás revertir esto!",
                                    texto_btn_confirmar = "Sí, eliminar",
                                    texto_btn_cancelar = "Cancelar",
                                    color_confirmar = "#d33",
                                    color_cancelar = "#3085d6",
                                    icono = "warning",
                                  }: {
    titulo?: string;
    message?: string;
    texto_btn_confirmar?: string;
    texto_btn_cancelar?: string;
    color_confirmar?: string;
    color_cancelar?: string;
    icono?: "warning" | "error" | "success" | "info";
  }) => {
    const temaColor = useCookie("tema_color");
    const isDarkMode = temaColor.value === "dark";

    let result = await Swal.fire({
      title: titulo,
      text: message,
      icon: icono,
      showCancelButton: true,
      confirmButtonText: texto_btn_confirmar,
      cancelButtonText: texto_btn_cancelar,
      confirmButtonColor: color_confirmar,
      cancelButtonColor: color_cancelar,
      background: isDarkMode ? "#25293C" : "#fff",
      customClass: isDarkMode ? "text-white" : "text-black",
    });

    return result.isConfirmed;
  };


  return {
    showToastSuccess,
    showToastError,
    showToastWarning,
    showToastInfo,
    preguntaEliminar,
    realizarPregunta
  }

}
