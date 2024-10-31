import { Injectable } from '@angular/core';
import { Firestore, collection, getDocs, setDoc, doc, query, where, Timestamp, orderBy } from '@angular/fire/firestore';
import { Observable, from, map } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DatabaseService {

  constructor(private firestore: Firestore) {}

  async cargarLogin() {
    const firebaseCollection = 'userLogin';
    const collectionRef = collection(this.firestore, firebaseCollection);
  
    const querySnapshot = await getDocs(collectionRef);
    
    const userData: any[] = [];
  
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      userData.push(data);
    });
  
    console.log(userData);
    
    return userData;
  }

  getLogIngresos(): Observable<any[]> {
    const firebaseCollection = 'userLogin';
    const collectionRef = collection(this.firestore, firebaseCollection);
  
    return from(getDocs(collectionRef)).pipe(
      map(querySnapshot => {
        const userData: any[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          userData.push(data);
        });
  
        userData.sort((a, b) => {
          const dateA = new Date(`${a.Fecha}T${a.Hora}`);
          const dateB = new Date(`${b.Fecha}T${b.Hora}`);
          return dateA.getTime() - dateB.getTime();
        });
  
        return userData;
      })
    );
  }
  
  guardarLogin(email: string | null, role: string | null) {
  
    const firebaseCollection = 'userLogin';
    const now = new Date();

    const dateOptions: Intl.DateTimeFormatOptions = {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    };

    const timeOptions: Intl.DateTimeFormatOptions = {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    };

    const loginDate = now.toLocaleDateString('es-ES', dateOptions);
    const loginTime = now.toLocaleTimeString('es-ES', timeOptions);

    const loginData = {
      Usuario: email,
      Role: role,
      Fecha: loginDate, 
      Hora: loginTime,  
    };
  
    const collectionRef = collection(this.firestore, firebaseCollection);
  
    setDoc(doc(collectionRef), loginData)
      .then(() => {
        // console.log('Inicio de sesión guardado en Firestore');
        // console.log(loginData);
      })
      .catch((error: any) => {
        // console.error('Error al guardar en Firestore: ', error);
      });
    }

    getTurnosPorEspecialidad(): Observable<any[]> {
      const firebaseCollection = 'turnos';
      const collectionRef = collection(this.firestore, firebaseCollection);
  
      return from(getDocs(collectionRef)).pipe(
        map(querySnapshot => {
          const turnos: any[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            turnos.push(data);
          });
          return turnos.reduce((acc, turno) => {
            const especialidad = turno.especialidad;
            if (!acc[especialidad]) {
              acc[especialidad] = 0;
            }
            acc[especialidad]++;
            return acc;
          }, {});
        })
      );
    }

    getTurnosPorDia(): Observable<any[]> {
      const firebaseCollection = 'turnos';
      const collectionRef = collection(this.firestore, firebaseCollection);
  
      return from(getDocs(collectionRef)).pipe(
        map(querySnapshot => {
          const turnos: any[] = [];
          querySnapshot.forEach((doc) => {
            const data = doc.data();
            //console.log('Original data:', data);
            if (data['fechaHora'] && data['fechaHora'].seconds) {
              data['fechaHora'] = new Date(data['fechaHora'].seconds * 1000);
            }
            //console.log('Converted data:', data);
            turnos.push(data);
          });
          return turnos.reduce((acc, turno) => {
            const fecha = turno.fechaHora.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: '2-digit' });
            if (!acc[fecha]) {
              acc[fecha] = 0;
            }
            acc[fecha]++;
            return acc;
          }, {});
        })
      );
    }
  
    
    getTurnosSolicitadosPorMedicos(fechaInicio: Date, fechaFin: Date): Observable<any[]> {
      const firebaseCollection = 'turnos';
      const collectionRef = collection(this.firestore, firebaseCollection);
      const q = query(
        collectionRef,
        where('fechaHora', '>=', fechaInicio),
        where('fechaHora', '<=', fechaFin)
      );
  
      return from(getDocs(q)).pipe(
        map(querySnapshot => {
          const turnosPorMedico: { [key: string]: { cantidad: number; nombre: string } } = {};
  
          querySnapshot.forEach(doc => {
            const data = doc.data();
            const especialistaId = data['especialistaId'];
            const especialistaNombre = `${data['especialista']['nombre']} ${data['especialista']['apellido']}`;
  
            if (!turnosPorMedico[especialistaId]) {
              turnosPorMedico[especialistaId] = { cantidad: 0, nombre: especialistaNombre };
            }
            turnosPorMedico[especialistaId].cantidad++;
          });
  
          return Object.values(turnosPorMedico);
        })
      );
    }

    getTurnosSolicitadosPorMedicosXFecha(fechaInicio: Date, fechaFin: Date): Observable<{ [key: string]: any }> {
      const firebaseCollection = 'turnos';
      const collectionRef = collection(this.firestore, firebaseCollection);
      const start = Timestamp.fromDate(fechaInicio);
      const end = Timestamp.fromDate(fechaFin);
  
      console.log('Firestore Start Timestampxx:', start);
      console.log('Firestore End Timestampxxy:', end);
  
      const q = query(
          collectionRef,
          where('fechaHora', '>=', start),
          where('fechaHora', '<=', end)
      );
  
      return from(getDocs(q)).pipe(
        map(querySnapshot => {
            const turnosPorMedico: { [key: string]: any } = {};
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                console.log('Turno data:', data); 
                const especialistaId = data['especialistaId'];
                const nombreMedico = `${data['especialista'].nombre} ${data['especialista'].apellido}`;
                
                if (!turnosPorMedico[especialistaId]) {
                    turnosPorMedico[especialistaId] = { cantidad: 0, nombre: nombreMedico };
                }
                turnosPorMedico[especialistaId].cantidad++;
            });
            return turnosPorMedico;
        })
    );
  }
  
  getTurnosFinalizadosPorMedicos(fechaInicio: Date, fechaFin: Date): Observable<any[]> {
    const firebaseCollection = 'turnos';
    const collectionRef = collection(this.firestore, firebaseCollection);
    const start = Timestamp.fromDate(fechaInicio);
    const end = Timestamp.fromDate(fechaFin);

    // Realizar la consulta solo por fechas
    const q = query(
        collectionRef,
        where('fechaHora', '>=', start),
        where('fechaHora', '<=', end)
    );

    return from(getDocs(q)).pipe(
        map(querySnapshot => {
            const turnosPorMedico: { [key: string]: { cantidad: number; nombre: string } } = {};

            querySnapshot.forEach(doc => {
                const data = doc.data();
                // Filtrar por estado en el cliente
                if (data['estado'] === 'realizado') {
                    const especialistaId = data['especialistaId'];
                    const especialistaNombre = `${data['especialista']['nombre']} ${data['especialista']['apellido']}`;

                    if (!turnosPorMedico[especialistaId]) {
                        turnosPorMedico[especialistaId] = { cantidad: 0, nombre: especialistaNombre };
                    }
                    turnosPorMedico[especialistaId].cantidad++;
                }
            });

            return Object.values(turnosPorMedico);
        })
    );
  }

  getTurnosFinalizadosPorMedicosXFecha(fechaInicio: Date, fechaFin: Date): Observable<{ [key: string]: any }> {
    const firebaseCollection = 'turnos';
    const collectionRef = collection(this.firestore, firebaseCollection);
    const start = Timestamp.fromDate(fechaInicio);
    const end = Timestamp.fromDate(fechaFin);
  
    // Realizar la consulta solo por fechas
    const q = query(
        collectionRef,
        where('fechaHora', '>=', start),
        where('fechaHora', '<=', end)
    );
  
    return from(getDocs(q)).pipe(
      map(querySnapshot => {
          const turnosPorMedico: { [key: string]: any } = {};
          querySnapshot.forEach((doc) => {
              const data = doc.data();
              // Filtrar por estado en el cliente
              if (data['estado'] === 'realizado') {
                  const especialistaId = data['especialistaId'];
                  const nombreMedico = `${data['especialista'].nombre} ${data['especialista'].apellido}`;
                  
                  if (!turnosPorMedico[especialistaId]) {
                      turnosPorMedico[especialistaId] = { cantidad: 0, nombre: nombreMedico };
                  }
                  turnosPorMedico[especialistaId].cantidad++;
              }
          });
          return turnosPorMedico;
      })
    );
  }
}
