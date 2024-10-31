import { Injectable } from '@angular/core';
import { Auth, User } from '@angular/fire/auth';
import { StorageReference, getDownloadURL, getStorage, ref, uploadBytesResumable } from 'firebase/storage';


@Injectable({
    providedIn: 'root'
  })
  export class ImagenesService {
  
    private imagenesUsuarios: { [key: string]: string } = {
      admin: 'assets/admin.png',
      especialista1: 'assets/especialista1.png',
      especialista2: 'assets/especialista2.png',
      paciente1: 'assets/paciente1.png',
      paciente2: 'assets/paciente2.png',
      paciente3: 'assets/paciente3.png',
    };
  
    constructor(private auth: Auth) { }
  
    getImagenUsuario(usuario: string): string {
      return this.imagenesUsuarios[usuario] || 'assets/logo.png';
    }
  
    //la función sube un archivo a Firebase Storage y devuelve la URL de descarga del archivo subido.
    async uploadFile(file: File): Promise<string> {
      const storage = getStorage();
      const userId = (await this.auth.currentUser)?.uid;
      const filePath = `imagenPerfil/${userId}/${file.name}`;
      const storageRef = ref(storage, filePath);
      const uploadTask = uploadBytesResumable(storageRef, file);
  
      return new Promise((resolve, reject) => {
        uploadTask.on('state_changed',
          null,
          (error) => reject(error),
          async () => {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            resolve(downloadURL);
          }
        );
      });
    }
    
  }