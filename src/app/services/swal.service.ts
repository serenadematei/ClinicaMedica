import { Injectable } from '@angular/core';
import Swal from 'sweetalert2';

@Injectable({
  providedIn: 'root'
})
export class SwalService {

  MostrarError(titulo:string,mensaje:string)
  {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon:"error",
    })
  }

  MostrarExito(titulo:string,mensaje:string)
  {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon:"success",
      showConfirmButton: false,
      timer:2000
    })
  }

  MostrarAdvertencia(titulo:string,mensaje:string)
  {
    return Swal.fire({
      title: titulo,
      text: mensaje,
      icon:"warning",
    })
  }
}