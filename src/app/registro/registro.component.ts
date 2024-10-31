import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import Swal from 'sweetalert2';
import { Firestore, collection, doc, setDoc } from '@angular/fire/firestore';
import { FormControl, FormGroup, Validators, FormBuilder, AbstractControl, ValidationErrors, ValidatorFn, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
//import { Auth } from '@angular/fire/auth';
import { map } from 'rxjs';
import { User, sendEmailVerification } from 'firebase/auth';
import { ImagenesService } from '../services/imagenes.service';


@Component({
  selector: 'app-registro',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './registro.component.html',
  styleUrl: './registro.component.css'
})
export class RegistroComponent {

  formReg: FormGroup;


  selectedRole: string = '';
  showOtraEspecialidad = false;
  imagenPerfil: File | null = null;
  imagenPerfil1: File | null = null;
  imagenPerfil2: File | null = null;
  showLoadingUser: boolean = false;
 


  constructor(private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router,
    private firestore: Firestore,

    private ImagenesService: ImagenesService) {
    this.formReg = new FormGroup({
      selectedRole: new FormControl('', [Validators.required]),
      nombre: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/), Validators.minLength(2), Validators.maxLength(20)]),
      apellido: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/), Validators.minLength(3)]),
      edad: new FormControl('', [Validators.required, Validators.pattern("^[0-9]+"), Validators.min(1), Validators.max(99)]),
      dni: new FormControl('', [Validators.required, Validators.pattern("^[0-9]+"), Validators.minLength(6), Validators.maxLength(8)]),
      obraSocial: new FormControl('', [Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]),
      email: new FormControl('', [Validators.email, Validators.required]),
      password: new FormControl('', [Validators.required, Validators.minLength(6)]),
      confirmPassword: new FormControl('', [Validators.required]),
      especialidad: new FormControl([], [Validators.required]),
      otraEspecialidad: new FormControl('', [Validators.required, Validators.minLength(4), Validators.maxLength(25), Validators.pattern(/^[a-zA-Z\s]+$/)]),
      imagenPerfil: new FormControl('', [Validators.required,]),
      imagenPerfil1: new FormControl('', [Validators.required]),
      imagenPerfil2: new FormControl('', [Validators.required,]),
    });

    const selectedRoleControl = this.formReg.get('selectedRole');

    if (selectedRoleControl) {
      selectedRoleControl.valueChanges.pipe(
        map((selectedRole) => {
          this.updateValidators(selectedRole);
        })
      ).subscribe();
    }
  }



  ngOnInit(): void {

    const selectedRoleControl = this.formReg.get('selectedRole');
    if (selectedRoleControl) {
      selectedRoleControl.valueChanges.pipe(
        map((selectedRole) => {
          this.updateValidators(selectedRole); //cambia la manera de validar los datos segun el rol elegido.
        })
      ).subscribe();
    }
  }




  onEspecialidadChange(event: Event): void {
    const selectElement = event.target as HTMLSelectElement;
    const selectedOptions = Array.from(selectElement.selectedOptions).map(option => option.value);
    this.showOtraEspecialidad = selectedOptions.includes('otra');
    if (this.showOtraEspecialidad) {
      this.formReg.get('otraEspecialidad')?.setValidators([Validators.required]);
    } else {
      this.formReg.get('otraEspecialidad')?.clearValidators();
    }
    this.formReg.get('otraEspecialidad')?.updateValueAndValidity();
  }


  selectRole(role: string) {
    this.selectedRole = role;
    this.formReg.get('selectedRole')?.setValue(role);
  }



  onFileSelected(event: any) {
    this.imagenPerfil = event.target.files[0];
  }

  onFileSelected1(event: any) {
    this.imagenPerfil1 = event.target.files[0];
  }

  onFileSelected2(event: any) {
    this.imagenPerfil2 = event.target.files[0];
  }


  updateValidators(selectedRole: string | null): void {
    if (selectedRole === null) return;

    // Limpiar todas las validaciones primero
    this.formReg.get('obraSocial')?.clearValidators();
    this.formReg.get('especialidad')?.clearValidators();
    this.formReg.get('otraEspecialidad')?.clearValidators();
    this.formReg.get('imagenPerfil')?.clearValidators();
    this.formReg.get('imagenPerfil1')?.clearValidators();
    this.formReg.get('imagenPerfil2')?.clearValidators();

    if (selectedRole === 'paciente') {
      // Validaciones para el paciente
      this.formReg.get('obraSocial')?.setValidators([Validators.required, Validators.pattern(/^[a-zA-Z\s]+$/)]);
      this.formReg.get('imagenPerfil1')?.setValidators([Validators.required]);
      this.formReg.get('imagenPerfil2')?.setValidators([Validators.required]);
    } else if (selectedRole === 'especialista') {
      // Validaciones para el especialista
      this.formReg.get('especialidad')?.setValidators([Validators.required]);

      if (this.showOtraEspecialidad) {
        this.formReg.get('otraEspecialidad')?.setValidators([Validators.required, Validators.minLength(4), Validators.maxLength(25), Validators.pattern(/^[a-zA-Z\s]+$/)]);
      } else {
        this.formReg.get('otraEspecialidad')?.clearValidators();
      }

      this.formReg.get('imagenPerfil')?.setValidators([Validators.required]);
    }

    // Actualizar el estado de los controles
    this.formReg.get('obraSocial')?.updateValueAndValidity();
    this.formReg.get('especialidad')?.updateValueAndValidity();
    this.formReg.get('otraEspecialidad')?.updateValueAndValidity();
    this.formReg.get('imagenPerfil')?.updateValueAndValidity();
    this.formReg.get('imagenPerfil1')?.updateValueAndValidity();
    this.formReg.get('imagenPerfil2')?.updateValueAndValidity();
  }


  
  getValue(value: string): AbstractControl {
    return this.formReg.get(value) as FormGroup;
  }

  async sendEmailVerification(user: User) {
    await sendEmailVerification(user);
  }

  getImageUrl(image: any): string {
    if (image instanceof Blob) {
      return URL.createObjectURL(image);
    } else {
      return 'assets/noimage.png';
    }
  }

  imageValidator(control: AbstractControl): Promise<string | null> {
    const file = control.value as File;

    return new Promise((resolve, reject) => {
      if (file && file.name) {
        const allowedExtensions = ['jpg', 'jpeg', 'png', 'gif'];
        const extension = file.name.split('.').pop()?.toLowerCase();

        if (extension && allowedExtensions.indexOf(extension) === -1) {
          reject({ 'invalidImage': true });
        }

        const reader = new FileReader();
        reader.onloadend = () => {
          const dataURL = reader.result as string;
          resolve(dataURL);
          console.log(dataURL);
        };

        reader.onerror = () => {
          reject({ 'invalidImage': true });
        };

        reader.readAsDataURL(file);

        console.log(file);
      } else {
        resolve(null);
      }
    });
  }

  marcarTodosTocados() { 
    Object.keys(this.formReg.controls).forEach(key => {
      const control = this.formReg.get(key);
      if (control) {
        control.markAsTouched();
      }
    });
  }

  async onSubmit() {

    this.marcarTodosTocados();

    if (this.formReg.invalid) {
      Swal.fire({
        icon: 'error',
        title: 'Campos incompletos',
        text: 'Por favor, completa todos los campos del formulario.',
      });
      return;
    }

    const passwordControl = this.formReg.get('password');
    const confirmPasswordControl = this.formReg.get('confirmPassword');
    const selectedRole = this.formReg.get('selectedRole')?.value;
    const { email, password, confirmPassword } = this.formReg.value;

    if (password !== confirmPassword) {
      Swal.fire({
        icon: 'error',
        title: 'Error en la contraseña',
        text: 'Las contraseñas no coinciden. Por favor, verifica.',
      }).then(() => {
        if (passwordControl && confirmPasswordControl) {
          passwordControl.reset();
          confirmPasswordControl.reset();
        }
      });
      return;
    }


    if (!selectedRole) {
      Swal.fire({
        icon: 'error',
        title: 'Perfil no seleccionado',
        text: 'Por favor, selecciona un perfil antes de registrarte.',
      });
      return;
    }

    try {
      this.showLoadingUser = true; 
      const userExists = await this.authService.checkIfUserExists(email);

      if (userExists) {
        this.showLoadingUser = false; 
        Swal.fire({
          icon: 'error',
          title: 'Usuario existente',
          text: 'El correo electrónico ya está registrado. Inicia sesión en lugar de registrarte.',
        }).then(() => {
          if (passwordControl && confirmPasswordControl) {
            passwordControl.reset();
            confirmPasswordControl.reset();
            this.router.navigate(['/login']);
            return;
          }
        });
      } else {


        console.log("paso 1 creo el usuario en firebase");
        const userCredential = await this.authService.register(email, password);
        const user = userCredential.user;
        console.log("paso 2 agrego el usuario a la coleccion DatosUsuarios");
        const userDocRef = doc(collection(this.firestore, 'DatosUsuarios'), user.uid);

        let additionalUserData: any = {
          mail: email,
          role: selectedRole,
          nombre: this.formReg.get('nombre')?.value,
          apellido: this.formReg.get('apellido')?.value,
          edad: this.formReg.get('edad')?.value,
          dni: this.formReg.get('dni')?.value
        };

        if (selectedRole === 'paciente') {

          console.log("entre a selected role = paciente");

          if (this.imagenPerfil1 && this.imagenPerfil2) {
            console.log("paciente posee 2 imagenes de perfil");
            const image1 = await this.ImagenesService.uploadFile(this.imagenPerfil1);
            const image2 = await this.ImagenesService.uploadFile(this.imagenPerfil2);

            console.log(image1 + "subo imagen 1 a storage");

            console.log(image2 + "subo imagen 2 a storage");

            additionalUserData = {
              ...additionalUserData,
              obrasocial: this.formReg.get('obraSocial')?.value,
              aprobadoPorAdmin: true,
              imagenPerfil1: image1,
              imagenPerfil2: image2,
            };
            console.log("paso 3, cargado");
            await setDoc(userDocRef, additionalUserData, { merge: true });
          }

        } else if (selectedRole === 'especialista') {

          console.log("entre a selected role = especialista");
          if (this, this.imagenPerfil) {
            console.log("entre al if de this.imagenperfil");
            const image = await this.ImagenesService.uploadFile(this.imagenPerfil);

            additionalUserData = {
              ...additionalUserData,
              especialidad: this.formReg.get('especialidad')?.value,
              otraEspecialidad: this.formReg.get('otraEspecialidad')?.value,
              aprobadoPorAdmin: true, //CAMBIAR
              imagenPerfil: image,
            };

            console.log("paso 3, cargado especialista");
            await setDoc(userDocRef, additionalUserData, { merge: true });
          }
        }
        
        

        if (!user.emailVerified) {

          this.showLoadingUser = false; 
          await this.sendEmailVerification(user);

          Swal.fire({
            icon: 'warning',
            title: 'Faltan validar tus datos antes de iniciar sesión.',
            text: 'Debes verificar tu correo electrónico antes de iniciar sesión. Hemos enviado un correo de verificación a tu dirección de correo.',
          }).then(() => {

            if (passwordControl && confirmPasswordControl) {
              passwordControl.reset();
              confirmPasswordControl.reset();
              this.router.navigate(['/login']);
            }
          });
        } else {
          this.showLoadingUser = false; 
          Swal.fire({
            icon: 'success',
            title: 'Registro exitoso',
            text: '¡Bienvenido!',
            confirmButtonText: 'OK'
          }).then(() => {
            this.router.navigate(['/login']);
          });
        }
      }
    } catch (error: any) {
      this.showLoadingUser = false; 
      if (error.message === 'Debes verificar tu correo electrónico antes de iniciar sesión.') {

        Swal.fire({
          icon: 'warning',
          title: 'Faltan validar tus datos',
          text: error.message,
        });
        this.router.navigate(['/login']);
      } else if (error.code === 'auth/invalid-email') {
        Swal.fire({
          icon: 'error',
          title: 'Error en el correo electrónico',
          text: 'El formato del correo electrónico es incorrecto. Por favor, verifica.',
        });
      } else if (error.code === 'auth/weak-password') {
        Swal.fire({
          icon: 'error',
          title: 'Contraseña débil',
          text: 'La contraseña es demasiado débil. Debe contener al menos 6 caracteres.',
        }).then(() => {
          if (passwordControl && confirmPasswordControl) {
            passwordControl.reset();
            confirmPasswordControl.reset();
          }
        });
      } else if (error.code === 'auth/email-already-in-use') {
        Swal.fire({
          icon: 'error',
          title: 'Correo electrónico en uso',
          text: 'El correo electrónico ya está registrado. Inicia sesión en lugar de registrarte.',
        });
      } else {
        console.error('Error en el registro:', error);
        Swal.fire({
          icon: 'error',
          title: 'Error en el registro',
          text: 'Hubo un error al registrar tu cuenta. Por favor, verifica tus datos.',
        }).then(() => {
          if (passwordControl && confirmPasswordControl) {
            passwordControl.reset();
            confirmPasswordControl.reset();
          }
        });
      }
      return Promise.resolve();
    }
  }


    onClickWel(event: any): void {
      this.router.navigate(['']);
  
    }

}


