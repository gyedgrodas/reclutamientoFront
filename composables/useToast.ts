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


  return {
    showToastSuccess,
    showToastError,
    showToastWarning,
    showToastInfo,
    preguntaEliminar
  }

}
