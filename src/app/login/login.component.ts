import { Component, OnInit } from '@angular/core';
import { FormControl, FormGroup, FormBuilder, Validators, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import Swal from 'sweetalert2';
import { User, UserCredential } from 'firebase/auth';
import { ImagenesService } from '../services/imagenes.service';
import { CommonModule } from '@angular/common';
import { AuthService } from '../services/auth.service';
import { trigger, transition, style, animate } from '@angular/animations';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
  animations: [
    trigger('fadeAnimation', [
      transition(':enter', [
        style({ opacity: 0 }),
        animate('300ms ease-out', style({ opacity: 1 })),
      ]),
      transition(':leave', [
        animate('300ms ease-in', style({ opacity: 0 })),
      ]),
    ]),
  ],
})
export class LoginComponent implements OnInit {

  formLogin: FormGroup;
  errorMensaje: string = '';
  currentUser: User | null = null;

  defaultEmailAdmin = 'serenadematei2019@gmail.com';
  defaultPasswordAdmin = '123456';

  defaultEmailEspecialista1 = 'Especialista1@cj.MintEmail.com';  //sirve, aprobado por admin
  defaultPasswordEspecialista1 = '123456';

  defaultEmailEspecialista2 = 'especialista2@cj.MintEmail.com'; //hacer
  defaultPasswordEspecialista2 = '123456';

  defaultEmailPaciente1 = 'Paciente1@cj.MintEmail.com'; //SIRVE.
  defaultPasswordPaciente1 = '123456';

  defaultEmailPaciente2 = 'paciente2@cj.MintEmail.com'; //SIRVE
  defaultPasswordPaciente2 = '123456';


  fotoPerfilUrls: { [key: string]: string } = {};
  imagenPerfilUrl: string = '';
  usuarioActual: any = {};

  email: string = '';
  password: string = '';
  //showLoading: boolean = true;
  formReset: boolean = false;

  constructor(private router: Router, private fb: FormBuilder, private authService: AuthService, private imagenesService: ImagenesService) {
    this.formLogin = this.fb.group(
      {
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]]
      });
  }
  ngOnInit(): void {
    this.formLogin = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
    });

    Promise.all([
      this.loginLoadAdmin(),
      this.loginLoadEspecialista1(),
      this.loginLoadEspecialista2(),
      this.loginLoadPaciente1(),
      this.loginLoadPaciente2(),
      this.loginLoadPaciente3()
    ]).catch(error => {
      console.error('Error al cargar los usuarios:', error);
    });
  }


  resetLoginForm(): void {
    this.formLogin.reset();
  }

  onSubmit() {
    this.authService.login(this.formLogin.value)
      .then((userCredential: UserCredential) => {
        const user = userCredential.user;
        if (user.emailVerified) {
          //console.log('Inicio de sesión exitoso');
          Swal.fire({
            icon: 'success',
            title: 'Inicio de sesión exitoso',
            text: '¡Bienvenido!',
            showConfirmButton: false,
            timer: 1500,
            timerProgressBar: true

          }).then(() => {
            this.router.navigate(['/home']);
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al iniciar sesión',
            text: 'Debes verificar tu correo electrónico antes de iniciar sesión. Hemos enviado un correo de verificación a tu dirección de correo.',
          });
        }
      })
      .catch((error: any) => {
        let errorMessage = 'Por favor, verifica tu correo electrónico y contraseña.';
        if (error.code === 'auth/user-not-found') {
          errorMessage = 'El correo electrónico no existe.';
        } else if (error.code === 'auth/wrong-password') {
          errorMessage = 'La contraseña es incorrecta.';
        } else if (error.message === 'La cuenta aún no ha sido aprobada por el administrador.') {
          Swal.fire({
            icon: 'error',
            title: 'Error al iniciar sesión',
            text: 'La cuenta aún no ha sido aprobada por el administrador.',
          });
        } else {
          Swal.fire({
            icon: 'error',
            title: 'Error al iniciar sesión',
            text: errorMessage,
          });
        }
      });
  }

  
 async cargarUsuario(email: string, password: string): Promise<void> {
    try {
      const usuarios = await this.authService.obtenerUsuariosConFotoPerfil(email);
      
      if (usuarios.length > 0) {
        const usuario = usuarios[0];
        usuario.imagenPerfilUrl = usuario.imagenPerfilUrl;
        this.fotoPerfilUrls[email] = usuario.imagenPerfilUrl;

       // console.log(`URL de imagen asignada para ${email}:`, this.fotoPerfilUrls[email]);
        if (!this.formReset) {
          this.resetLoginForm();
          this.formReset = true; // Marcar que el formulario se ha restablecido
        }
      } else {
       // console.error('Usuario no encontrado');
      }
    } catch (error) {
      console.error('Error al cargar el usuario:', error);
    }
  }


  loginLoadAdmin(): void {
    const email = this.defaultEmailAdmin;
    const password = this.defaultPasswordAdmin;
    //this.cargarUsuario(email, password);
    this.formLogin.setValue({ email, password });
  }

  loginLoadEspecialista1(): void {
    const email = 'hernan@cj.MintEmail.com';
    const password = '123456'   //this.defaultPasswordEspecialista1;
    this.cargarUsuario(email, password);
    this.formLogin.setValue({ email, password });
  }

  loginLoadEspecialista2(): void {
    const email = 'test@cj.MintEmail.com';
    const password = '123456';
    this.cargarUsuario(email, password);
    this.formLogin.setValue({ email, password });
  }

  loginLoadPaciente1(): void {
    const email = this.defaultEmailPaciente1;
    const password = this.defaultPasswordPaciente1;
    this.cargarUsuario(email, password);
    this.formLogin.setValue({ email, password });
  }

  loginLoadPaciente2(): void {
    const email = 'paloma@cj.MintEmail.com';
    const password = '123456';
    this.cargarUsuario(email, password);
    this.formLogin.setValue({ email, password });
  }
  loginLoadPaciente3(): void {
    const email = 'melanie@cj.MintEmail.com';
    const password = '123456';
    this.cargarUsuario(email, password);
    this.formLogin.setValue({ email, password });
  }


  loginLoadBlank(): void {
    this.email = '';
    this.password = '';
  }


  public goTo(path: string): void {
    this.router.navigate([path]);
  }


  onClickWel(event: any): void {
    this.router.navigate(['']);

  }

}
