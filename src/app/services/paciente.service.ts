import { Injectable } from '@angular/core';
import { Firestore, collection, doc, setDoc, getDoc, collectionData, query, where, Timestamp, getDocs } from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Observable, catchError, combineLatest, forkJoin, from, map, of, switchMap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class PacienteService {

  constructor(private auth: AuthService, private firestore: Firestore) {}

  async obtenerInformacionPaciente(uid: string): Promise<{ mail: string, nombre: string, apellido: string }> {
    try {
      const userDocRef = doc(this.firestore, 'DatosUsuarios', uid);
      const userDoc = await getDoc(userDocRef);

      if (!userDoc.exists()) {
        throw new Error(`No se encontró información para el paciente con UID ${uid}`);
      }

      const userData = userDoc.data();
      return { mail: userData['mail'], nombre: userData['nombre'], apellido: userData['apellido'] };
    } catch (error) {
      console.error('Error al obtener la información del paciente:', error);
      throw new Error('Error al obtener la información del paciente desde Firestore.');
    }
  }

  async obtenerInformacionPaciente1(uid: string): Promise<{ mail: string, nombre: string, apellido: string, role: string, imagenPerfil1: string, imagenPerfil2: string }> {
    try {
      const userDocRef = doc(this.firestore, 'DatosUsuarios', uid);
      const userDoc = await getDoc(userDocRef);
  
      if (!userDoc.exists()) {
        throw new Error(`No se encontró información para el paciente con UID ${uid}`);
      }
  
      const userData = userDoc.data();
      console.log('Datos del usuario obtenidos:', userData); // Log para verificar datos
  
      return { 
        mail: userData['mail'], 
        nombre: userData['nombre'], 
        apellido: userData['apellido'],
        role: userData['role'],
        imagenPerfil1: userData['imagenPerfil1'],
        imagenPerfil2: userData['imagenPerfil2']
      };
    } catch (error) {
      console.error('Error al obtener la información del paciente:', error);
      throw new Error('Error al obtener la información del paciente desde Firestore.');
    }
  }

  getPacienteInfo(): Observable<{ mail: string; nombre: string, apellido: string }> {
    return this.auth.getCurrentUser().pipe(
      switchMap(user => {
        if (!user) {
          throw new Error('No se encontró el UID del usuario autenticado');
        }
        return from(this.obtenerInformacionPaciente(user.uid));
      })
    );
  }

  getPacienteInfo1(pacienteId: string): Observable<{ mail: string; nombre: string; apellido: string }> {
    return from(this.obtenerInformacionPaciente(pacienteId));
  }

  getUsuarios(): Observable<any[]> {
    const collectionRef = collection(this.firestore, 'DatosUsuarios');
    return collectionData(collectionRef, { idField: 'id' }).pipe(
      map((data) => data as any[])
    );
  }

  getPacientesAtendidosPorEspecialista(especialistaId: string): Observable<any[]> {
    if (!especialistaId) {
      console.error('El ID del especialista no está definido.');
      throw new Error('El ID del especialista no está definido.');
    }
  
    const collectionRef = collection(this.firestore, 'turnos');
    const q = query(collectionRef, where('especialistaId', '==', especialistaId), where('estado', '==', 'realizado'));
  
    return collectionData(q, { idField: 'id' }).pipe(
      map(turnos => {
        const pacientesMap = new Map();
        turnos.forEach((turno: any) => {
          const paciente = {
            ...turno.paciente,
            fechaHora: (turno.fechaHora as Timestamp).toDate() // Convierte a Date
          };
          pacientesMap.set(turno.paciente.mail, paciente);
        });
        const pacientes = Array.from(pacientesMap.values());
        console.log('Pacientes obtenidos:', pacientes); // Debug: Verifica los datos de pacientes obtenidos
        return pacientes;
      })
    );
  }

  getPacientesAtendidosPorEspecialista1(especialistaId: string): Observable<any[]> {
    const collectionRef = collection(this.firestore, 'turnos');
    const q = query(collectionRef, where('especialistaId', '==', especialistaId), where('estado', '==', 'realizado'));
    return collectionData(q, { idField: 'id' }).pipe(
      map(turnos => {
        const pacientesMap = new Map();
        turnos.forEach((turno: any) => {
          const paciente = {
            ...turno.paciente,
            uid: turno.paciente.uid, // Asegurarse de que el UID del paciente esté presente
            fechaHora: (turno.fechaHora as Timestamp).toDate() // Convierte a Date
          };
          pacientesMap.set(turno.paciente.mail, paciente);
        });
        const pacientes = Array.from(pacientesMap.values());
        console.log('Pacientes obtenidos:', pacientes); // Debug: Verifica los datos de pacientes obtenidos
        return pacientes;
      })
    );
  }

  getUsers(): Observable<any[]> {
    const usersCollection = collection(this.firestore, 'DatosUsuarios');
    const usersQuery = query(usersCollection, where('role', '==', 'paciente'));
    return collectionData(usersQuery, { idField: 'id' }) as Observable<any[]>;
  }

  getUsersAttendedBySpecialist(uid: string): Observable<any[]> {
    const turnosCollection = collection(this.firestore, 'turnos');
    const turnosQuery = query(turnosCollection, where('especialistaId', '==', uid), where('estado', '==', 'realizado'));
    return collectionData(turnosQuery, { idField: 'id' }).pipe(
      switchMap(turnos => {
        console.log('Turnos obtenidos:', turnos);  // Log para verificar los turnos obtenidos
        const pacientesMap = new Map();
        const pacientePromises = turnos.map(turno => {
          if (turno['paciente'] && turno['paciente']['mail']) {
            return this.getPacienteByEmail(turno['paciente']['mail']).then(pacienteData => {
              if (pacienteData) {
                pacienteData.id = turno['paciente']['id'] || turno.id;
                pacientesMap.set(turno['paciente']['mail'], pacienteData);
              }
            });
          }
          return Promise.resolve();
        });
        return from(Promise.all(pacientePromises)).pipe(
          map(() => {
            const pacientes = Array.from(pacientesMap.values()).map(paciente => {
              if (paciente.fechaHora instanceof Object && paciente.fechaHora.toDate) {
                paciente.fechaHora = paciente.fechaHora.toDate();
              }
              return paciente;
            });
            console.log('Pacientes obtenidos:', pacientes);  // Log para verificar los pacientes obtenidos
            return pacientes;
          })
        );
      })
    ) as Observable<any[]>;
  }

  getPacienteByEmail(email: string): Promise<any> {
    const usuariosCollection = collection(this.firestore, 'DatosUsuarios');
    const usuariosQuery = query(usuariosCollection, where('mail', '==', email));
    return getDocs(usuariosQuery).then(querySnapshot => {
      if (!querySnapshot.empty) {
        const data = querySnapshot.docs[0].data();
        console.log(`Datos del paciente (${email}):`, data);  // Log para verificar los datos del paciente
        return data;
      }
      return null;
    });
  }

  getUserTurnos(userEmail: string): Observable<any[]> {
    if (!userEmail) {
      throw new Error('userEmail is undefined');
    }
    const turnosCollection = collection(this.firestore, 'turnos');
    const turnosQuery = query(turnosCollection, where('paciente.mail', '==', userEmail));
    return collectionData(turnosQuery, { idField: 'id' }) as Observable<any[]>;
  }

  // getUserResenas(turnoId: string): Observable<any> {
  //   const resenaDoc = doc(this.firestore, `pacientes/${turnoId}/historiaClinica`);
  //   return getDoc(resenaDoc).then(snapshot => {
  //     return snapshot.data() as any;
  //   });
  // }
}