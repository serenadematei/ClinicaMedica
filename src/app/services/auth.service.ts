import { Injectable } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut,  User, fetchSignInMethodsForEmail, authState, user } from '@angular/fire/auth';
import { Firestore, collection, getDoc, doc, updateDoc, query, getDocs, QuerySnapshot, where, collectionData, docData } from '@angular/fire/firestore';
import { UserCredential, onAuthStateChanged, sendEmailVerification } from '@angular/fire/auth';
import { DatabaseService } from './database.service';
import { BehaviorSubject, Observable, Subject, from, map, switchMap } from 'rxjs';
import { Paciente } from './turnos.service';


@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private userData: any = {};
  private userRoleSubject = new BehaviorSubject<string | null>(
    localStorage.getItem('userRole')
  );
  userRole$ = this.userRoleSubject.asObservable();
  private logoutSubject = new Subject<void>();
  logout$ = this.logoutSubject.asObservable();

  private userEmail: string | null = null;
  private userPassword: string | null = null;
  
  constructor(private auth: Auth, private dataService:DatabaseService, private firestore: Firestore) { 
    
  }

  async register(email: string, password: string) {

    const userCredential = await createUserWithEmailAndPassword(this.auth, email, password);

    return userCredential;
}

checkIfUserExists(email: string) {
  return fetchSignInMethodsForEmail(this.auth, email)
    .then((signInMethods) => signInMethods && signInMethods.length > 0)
    .catch((error) => {
      console.error('Error al verificar el usuario:', error);
      return false;
    });
}

login({ email, password }: any) {

  return signInWithEmailAndPassword(this.auth, email, password)
    .then(async (userCredential: UserCredential) => {

      this.userEmail = email;
      this.userPassword = password;


      const user = userCredential.user;

      const userDocRef = doc(collection(this.firestore, 'DatosUsuarios'), user.uid);

      try {
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();
          const userRole = userData['role'];

          const aprobadoPorAdmin = userData['aprobadoPorAdmin'];

          if (!aprobadoPorAdmin) {

            throw new Error('La cuenta aún no ha sido aprobada por el administrador.');
          }

          this.userRoleSubject.next(userRole);
          localStorage.setItem('userRole', userRole);
          this.dataService.guardarLogin(email, userRole);
        } else {
          console.error('Documento de usuario no encontrado en Firestore');
        }
      } catch (error) {

        throw error;
      }

      return userCredential;
    });
}


getRole(): string {
  return this.userData.userRole;
}

async logout() 
{
  await this.auth.signOut();
  this.logoutSubject.next();
  return signOut(this.auth);
}  

getCurrentUser(): Observable<User | null> {
  return authState(this.auth);
}

getUserData(uid: string): Observable<any | null> {
  const userDoc = doc(this.firestore, `DatosUsuarios/${uid}`);
  return new Observable((observer) => {
    getDoc(userDoc).then((docSnapshot) => {
      if (docSnapshot.exists()) {
        observer.next(docSnapshot.data());
      } else {
        observer.next(null);
      }
    }).catch((error) => {
      observer.error(error);
    });
  });
}

getCurrentUserId(email: string): Observable<string | null> {
  const usersCollection = collection(this.firestore, 'DatosUsuarios');
  const q = query(usersCollection, where('mail', '==', email));
  return from(getDocs(q)).pipe(
    map(querySnapshot => {
      console.log('Query Snapshot:', querySnapshot); 
      if (!querySnapshot.empty) {
        const userId = querySnapshot.docs[0].id;
        console.log('User ID:', userId); 
        return userId; 
      } else {
        console.log('No user found with email:', email); 
        return null;
      }
    })
  );
}

getCurrentUserEmail(userId: string): Observable<string | null> {
  const userDoc = doc(this.firestore, `DatosUsuarios/${userId}`);
  return from(getDoc(userDoc)).pipe(
    map(docSnapshot => {
      if (docSnapshot.exists()) {
        const userData = docSnapshot.data();
        console.log('User Data:', userData); 
        return userData ? userData['mail'] : null; 
      } else {
        console.log('No user data found for user ID:', userId); 
        return null;
      }
    })
  );
}



getUserRole(): Observable<string | null> {
  return this.getCurrentUser().pipe(
    switchMap(user => {
      if (user) {
        const userDocRef = doc(this.firestore, `DatosUsuarios/${user.uid}`);
        return from(getDoc(userDocRef)).pipe(
          map(docSnap => {
            const data = docSnap.data();
            return data ? data['role'] : null;
          })
        );
      } else {
        return from(Promise.resolve(null));
      }
    })
  );
}

async aprobarUsuario(userId: string): Promise<void> {
  const userDocRef = doc(collection(this.firestore, 'DatosUsuarios'), userId);
  
  try {
    await updateDoc(userDocRef, {
      aprobadoPorAdmin: true
    });

    //console.log('Usuario aprobado exitosamente.');
  } catch (error) {
    console.error('Error al aprobar usuario:', error);
    throw error;
  }
}

async inhabilitarUsuario(userId: string): Promise<void> {
  const userDocRef = doc(collection(this.firestore, 'DatosUsuarios'), userId);
  
  try {
    await updateDoc(userDocRef, {
      aprobadoPorAdmin: false
    });

    //console.log('Usuario aprobado exitosamente.');
  } catch (error) {
    console.error('Error al aprobar usuario:', error);
    throw error;
  }
}

async obtenerUsuariosPendientesAprobacion(): Promise<any[]> {
  try {
    const usuariosQuery = query(
      collection(this.firestore, 'DatosUsuarios'),
      where('aprobadoPorAdmin', '==', false)
    );

    const querySnapshot: QuerySnapshot<any> = await getDocs(usuariosQuery);

    const usuarios: any[] = [];
    querySnapshot.forEach((doc) => {

      const usuario = {
        id: doc.id,
        ...doc.data(),
      };
      usuarios.push(usuario);
    });

    return usuarios;
  } catch (error) {
    console.error('Error al obtener usuarios pendientes de aprobación:', error);
    throw error;
  }
}

async obtenerUsuarios(): Promise<any[]> {
  try {
    const usuariosQuery = query(
      collection(this.firestore, 'DatosUsuarios')
    );

    const querySnapshot: QuerySnapshot<any> = await getDocs(usuariosQuery);

    const usuarios: any[] = [];
    querySnapshot.forEach((doc) => {

      const usuario = {
        id: doc.id,
        ...doc.data(),
      };
      usuarios.push(usuario);
    });

    return usuarios;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
}

obtenerUsuarios1(): Observable<any[]> {
  const usuariosCollection = collection(this.firestore, 'DatosUsuarios');
  return collectionData(usuariosCollection, { idField: 'id' });
}

getUserByEmail(email: string): Observable<any> {
  const usersRef = collection(this.firestore, 'DatosUsuarios');
  const q = query(usersRef, where('mail', '==', email));
  return from(getDocs(q)).pipe(
    map(snapshot => {
      if (snapshot.empty) {
        return null;
      }
      const userDoc = snapshot.docs[0];
      return { id: userDoc.id, ...userDoc.data() };
    })
  );
}

async obtenerListaEspecialidades(): Promise<string[]> {
  try {
    const usuariosQuery = query(collection(this.firestore, 'DatosUsuarios'));
    const querySnapshot: QuerySnapshot<any> = await getDocs(usuariosQuery);

    const especialidadesSet = new Set<string>();

    querySnapshot.forEach((doc) => {
      const especialidad = doc.data().especialidad;
      const otraEspecialidad = doc.data().otraEspecialidad;

      
      if (especialidad === 'otra' && otraEspecialidad && !especialidadesSet.has(otraEspecialidad)) {
        especialidadesSet.add(otraEspecialidad);
      } else if (especialidad) {
        
        especialidadesSet.add(especialidad);
      }
    });

    const especialidades: string[] = Array.from(especialidadesSet);

    return especialidades;
  } catch (error) {
    console.error('Error al obtener lista de especialidades:', error);
    throw error;
  }
}

async obtenerEspecialistasPorEspecialidad(especialidad: string): Promise<any[]> {
  try {
    const usuariosQuery = query(
      collection(this.firestore, 'DatosUsuarios'),
      where('especialidad', '==', especialidad)
    );

    const querySnapshot: QuerySnapshot<any> = await getDocs(usuariosQuery);
    const especialistas: any[] = [];

    querySnapshot.forEach((doc) => {
      const { nombre, apellido, imagenPerfil } = doc.data();
      const especialista = { id: doc.id, nombre, apellido, imagenPerfil };
      especialistas.push(especialista);
    });

    if (especialistas.length === 0) {
      const otraEspecialidadQuery = query(
        collection(this.firestore, 'DatosUsuarios'),
        where('otraEspecialidad', '==', especialidad)
      );

      const otraEspecialidadSnapshot: QuerySnapshot<any> = await getDocs(otraEspecialidadQuery);

      otraEspecialidadSnapshot.forEach((doc) => {
        const { nombre, apellido, imagenPerfil } = doc.data();
        const especialista = { id: doc.id, nombre, apellido, imagenPerfil };
        especialistas.push(especialista);
      });
    }

    return especialistas;
  } catch (error) {
    console.error('Error al obtener especialistas por especialidad:', error);
    throw error;
  }
}



async obtenerUsuariosConFotoPerfil(email: string): Promise<any[]> {
  try {
    const usuariosQuery = query(collection(this.firestore, 'DatosUsuarios'), where('mail', '==', email));
    const querySnapshot: QuerySnapshot<any> = await getDocs(usuariosQuery);

    const usuarios: any[] = await Promise.all(
      querySnapshot.docs.map(async (doc) => {
        const data = doc.data();

        // Identifica el campo de la imagen de perfil según el rol
        const campoImagenPerfil =
          data.role === 'admin' ? 'imagenPerfil' :
          data.role === 'paciente' ? 'imagenPerfil1' :
          data.role === 'especialista' ? 'imagenPerfil' :
          'imagenPerfil';

        const usuario = {
          id: doc.id,
          ...data,
          imagenPerfilUrl: data[campoImagenPerfil],
        };
        return usuario;
      })
    );

    return usuarios;
  } catch (error) {
    console.error('Error al obtener usuarios:', error);
    throw error;
  }
}

async obtenerEspecialistasConFotoPerfil(especialidad: string): Promise<{ nombre: string; imagenPerfilUrl: string }[]> {
  try {
    const especialistasQuery = query(
      collection(this.firestore, 'DatosUsuarios'),
      where('role', '==', 'especialista')
    );

    const querySnapshot: QuerySnapshot<any> = await getDocs(especialistasQuery);

    let especialistas: { nombre: string; imagenPerfilUrl: string }[] = [];

    if (querySnapshot.empty) {
      const otraEspecialidadQuery = query(
        collection(this.firestore, 'DatosUsuarios'),
        where('otraEspecialidad', '==', especialidad)
      );

      const otraEspecialidadSnapshot: QuerySnapshot<any> = await getDocs(otraEspecialidadQuery);

      otraEspecialidadSnapshot.forEach((doc) => {
        const usuario = {
          id: doc.id,
          ...doc.data(),
          imagenPerfilUrl: doc.data().imagenPerfil,
          especialidad: doc.data().especialidad,
        };
        especialistas.push(usuario);
      });
    } else {
      // Si la primera consulta devuelve resultados, utiliza esos resultados
      querySnapshot.forEach((doc) => {
        const usuario = {
          id: doc.id,
          ...doc.data(),
          imagenPerfilUrl: doc.data().imagenPerfil,
          especialidad: doc.data().especialidad,
        };
        especialistas.push(usuario);
      });
    }

    return especialistas;
  } catch (error) {
    console.error('Error al obtener especialistas:', error);
    throw error;
  }
}


async obtenerInfoUsuarioActual(): Promise<any | null> {
  try {
      let usuarioActual: User | null = null;

      await new Promise<void>((resolve) => {
          const unsubscribe = onAuthStateChanged(this.auth, (user) => {
              usuarioActual = user;
              unsubscribe();
              resolve();
          });
      });

      if (usuarioActual) {

          const uid = (usuarioActual as User).uid;

          const userDocRef = doc(this.firestore, 'DatosUsuarios', uid);
          const usuarioDoc = await getDoc(userDocRef);

          if (usuarioDoc.exists()) {
              return {
                  id: usuarioDoc.id,
                  ...usuarioDoc.data(),
              };
          } else {
              console.error('El documento del usuario no existe.');
              return null;
          }
      } else {
          console.error('Usuario no autenticado.');
          return null;
      }
  } catch (error) {
      console.error('Error al obtener información del usuario actual:', error);
      throw error;
  }
}

async obtenerInfoUsuarioActual1(): Promise<any | null> {
  try {
      let usuarioActual: User | null = null;

      await new Promise<void>((resolve) => {
          const unsubscribe = onAuthStateChanged(this.auth, (user) => {
              usuarioActual = user;
              unsubscribe();
              resolve();
          });
      });

      if (usuarioActual) {
          const uid = (usuarioActual as User).uid;
          const userDocRef = doc(this.firestore, 'DatosUsuarios', uid);
          const usuarioDoc = await getDoc(userDocRef);

          if (usuarioDoc.exists()) {
              return {
                  id: usuarioDoc.id,
                  ...usuarioDoc.data(),
              };
          } else {
              console.error('El documento del usuario no existe.');
              return null;
          }
      } else {
          console.error('Usuario no autenticado.');
          return null;
      }
  } catch (error) {
      console.error('Error al obtener información del usuario actual:', error);
      throw error;
  }
}

 // Nueva función para registrar sin iniciar sesión
 async registerWithoutLogin(email: string, password: string) {
  return await createUserWithEmailAndPassword(this.auth, email, password);
}


 // Obtener las credenciales guardadas
  getUserCredentials(): { email: string | null, password: string | null } {
    return {
      email: this.userEmail,
      password: this.userPassword
    };
  }


   // Reautenticar usuario
  async reauthenticateUser(email: string, password: string): Promise<UserCredential> {
    try {
      return await signInWithEmailAndPassword(this.auth, email, password);
    } catch (error) {
      console.error('Error al reautenticar usuario:', error);
      throw error;
    }
  }

  obtenerPacientes(): Observable<Paciente[]> {
    const pacientesCollection = collection(this.firestore, 'DatosUsuarios');
    return collectionData(pacientesCollection, { idField: 'id' }).pipe(
      map(data => data
        .filter(item => item['role'] === 'paciente') 
        .map(item => ({
          email: item['mail'],
          nombre: item['nombre'],
          apellido: item['apellido']
        }) as Paciente))
    );
  }
  
  getCurrentUserEmail2(): Promise<string | null> {
    return new Promise((resolve, reject) => {
      onAuthStateChanged(this.auth, (user) => {
        if (user && user.email) {
          resolve(user.email);
        } else {
          resolve(null);
        }
      });
    });
  }

  getCurrentUserRole(): Observable<string | null> {
    const user = this.auth.currentUser;
    if (!user) {
      return from([null]); // Devuelve null si no hay usuario autenticado
    }

    const userDocRef = doc(this.firestore, `DatosUsuarios/${user.uid}`);
    return from(getDoc(userDocRef)).pipe(
      map(docSnap => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          return userData['role'] || null;
        }
        return null;
      })
    );
  }
  

  obtenerPacienteInfo(documentId: string): Promise<any> {
    const pacienteDocRef = doc(this.firestore, 'DatosUsuarios', documentId);
    return getDoc(pacienteDocRef).then(snapshot => {
      if (snapshot.exists()) {
        return snapshot.data();
      } else {
        throw new Error('Paciente no encontrado');
      }
    }).catch(error => {
      console.error('Error al obtener la información del paciente:', error);
      throw error;
    });
  } 

  async obtenerHistoriasClinicasPorPaciente(pacienteEmail: string): Promise<any[]> {
    console.log("paicente: "+ pacienteEmail);
    const historiasRef = collection(this.firestore, 'historiasClinicas');
    const q = query(historiasRef, where('pacienteEmail', '==', pacienteEmail));
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => doc.data());
  }

}










