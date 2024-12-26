import Swal from 'sweetalert2';

import { cookieRef } from '@layouts/stores/config'

export default function useToast(){
  
  const getTemaActual = (): string => {
    
    console.log(cookieRef('tema_color').value)
    if(cookieRef('tema_color').value === 'dark'){
      
      return '#25293C';
      
    } else {
        
        return '#fff';
    }
    
  }
  
  const getColorTexto = (): string => {
    
    if (cookieRef('tema_color').value === 'dark') {
        
      return 'text-white';
        
    } else {
          
      return 'text-black';
      
    }
    
  }
  
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
  })
  
  const showToastSuccess = (message: string) => {
    
    toast.fire({
      icon: 'success',
      title: message,
      iconColor: 'success',
      background: getTemaActual(),
      customClass: getColorTexto(),
    })
  }
  
  const showToastError = (message: string) => {
    
    toast.fire({
      icon: 'error',
      title: message,
      iconColor: 'error',
      background: getTemaActual(),
      customClass: getColorTexto(),
    })
    
  }
  
  return {
    showToastSuccess,
    showToastError
  }
  
}
