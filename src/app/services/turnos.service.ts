import { Injectable, OnInit } from '@angular/core';
import { Firestore, collection, addDoc, getDocs, query, where, CollectionReference, DocumentData, doc, getDoc, QuerySnapshot, DocumentReference, collectionData, setDoc, docData, updateDoc, collectionGroup, Timestamp, DocumentSnapshot } from '@angular/fire/firestore';
import { Observable, catchError, combineLatest, forkJoin, from, map, mergeMap, of, switchMap } from 'rxjs';
import { PacienteService } from './paciente.service';
import { EspecialistaService, Horario } from './especialista.service';
import { FormControl } from '@angular/forms';
import { HistoriaClinica } from '../interfaces/historiaClinica';

export interface Turno {
  id: string; 
  especialidad: string;
  especialistaId: string;
  fechaHora: Timestamp | Date;
  fecha?: Date;
  horario?: string;
  horaInicio?: string;
  horaFin?: string;
  estado: 'pendiente' | 'cancelado' | 'realizado' | 'aceptado' | 'rechazado';
  ocupado?: boolean;
  paciente: {
    mail: string;
    nombre: string;
    apellido: string;
  }
  especialista: {
    mail: string;
    nombre: string;
    apellido: string;
  }
  comentario?: string;
  resena?: string;
  encuestaCompletada?: boolean;
  encuesta?: {
    calificacionAtencion: number;
    tiempoEspera: number;
    satisfaccionGeneral: number;
  };
  motivoCancelacion?: string;
  motivoRechazo?: string;
  calificacionCompletada?: boolean;
  comentarioCalificacion?: string;
  historiaClinicaCargada?: boolean;
  historiaClinica?: HistoriaClinica; //opc
}

export interface TurnoDisponible {
  id: string;
  dias: string[];
  horaInicio: string;
  horaFin: string;
  ocupado?: boolean; 
  
}

export interface Paciente {
  email: string;
  nombre: string;
  apellido: string;
}



@Injectable({
  providedIn: 'root'
})
export class TurnosService implements OnInit{

  private turnos: any[] = [];
  private turnosCollection: CollectionReference<DocumentData>;
  private historiasClinicasCollection: CollectionReference<DocumentData>;


  especialidades: string[] = [];
  turnos$: Observable<any[]> = of([]);
  searchControl: FormControl = new FormControl();

  constructor(private firestore: Firestore, private pacienteService: PacienteService, private especialistaService: EspecialistaService) {
    this.turnosCollection = collection(this.firestore, 'turnos');
    this.historiasClinicasCollection = collection(this.firestore, "historiasClinicas");
  }


  agregarHistoriaClinica(turnoId: string, historiaClinica: HistoriaClinica): Promise<void> {
    const turnoRef = doc(this.firestore, `turnos/${turnoId}`);
    
    // 1. Actualizar el turno para agregar la historia clínica y marcarla como cargada
    const updateTurnoPromise = updateDoc(turnoRef, { 
      historiaClinica, 
      historiaClinicaCargada: true 
    });

    // 2. Agregar la historia clínica a la colección independiente 'historiasClinicas'
    const addHistoriaClinicaPromise = addDoc(this.historiasClinicasCollection, historiaClinica);

    // Ejecutar ambas operaciones y manejar errores
    return Promise.all([updateTurnoPromise, addHistoriaClinicaPromise])
      .then(() => {
        console.log('Historia clínica agregada correctamente tanto en el turno como en la colección independiente.');
      })
      .catch(error => {
        console.error('Error al agregar historia clínica:', error);
        throw error;
      });
  }
  
    async obtenerPacientesConHistoriasClinicas(especialistaEmail: string): Promise<HistoriaClinica[]> {
      const turnosRef = collection(this.firestore, 'turnos');
      const cleanEmail = especialistaEmail.trim().toLowerCase();
      const q = query(turnosRef, where('estado', '==', 'realizado'));
      const snapshot = await getDocs(q);
      const historiasClinicas: HistoriaClinica[] = [];

      snapshot.forEach(doc => {
        const data = doc.data() as Turno;
       
        if (data.especialista.mail?.trim().toLowerCase() === cleanEmail) {
          if (data.historiaClinica) {
            console.log("Historia clínica encontrada:", data.historiaClinica);
            data.historiaClinica.datosDinamicos = data.historiaClinica.datosDinamicos || [];
            historiasClinicas.push(data.historiaClinica);
          }
        }
      });

      return historiasClinicas;
    }


      solicitarTurno(turnoData: {
        especialidad: string;
        especialistaId: string;
        fechaSeleccionada: string;
        horario: string;
        paciente: { nombre: string; mail?: string; apellido?: string };
        especialista: { nombre: string; mail: string; apellido: string };
    }): Promise<void> {
        try {
            // Convierte la fecha y el horario en un solo objeto Date
            const [horas, minutos] = turnoData.horario.split(':').map(Number);
            const fechaSeleccionada = new Date(turnoData.fechaSeleccionada);
            fechaSeleccionada.setHours(horas, minutos, 0, 0);
    
            if (isNaN(fechaSeleccionada.getTime())) {
                throw new Error('Fecha u hora inválida.');
            }
    
            // Crear el nuevo turno, incluyendo datos completos del especialista y paciente
            const nuevoTurno: Turno = {
                id: '',
                especialidad: turnoData.especialidad,
                especialistaId: turnoData.especialistaId,
                fechaHora: Timestamp.fromDate(fechaSeleccionada),
                horaInicio: turnoData.horario,
                estado: 'pendiente',
                ocupado: true,
                paciente: {
                    nombre: turnoData.paciente.nombre,
                    mail: turnoData.paciente.mail || '',
                    apellido: turnoData.paciente.apellido || ''
                },
                especialista: {
                    nombre: turnoData.especialista.nombre,
                    mail: turnoData.especialista.mail,
                    apellido: turnoData.especialista.apellido
                }
            };
    
            // Agrega el turno a Firebase y actualiza su ID
            return addDoc(this.turnosCollection, nuevoTurno)
                .then(docRef => updateDoc(docRef, { id: docRef.id }))
                .then(() => console.log('Turno reservado exitosamente'))
                .catch(error => {
                    console.error('Error al solicitar el turno:', error);
                    throw error;
                });
    
        } catch (error) {
            console.error('Error al procesar la fecha y hora del turno:', error);
            return Promise.reject(error);
        }
    }








    obtenerEspecialidades(): Observable<string[]> {
      const especialidadesCollection = collection(this.firestore, 'Especialidades');
      return collectionData(especialidadesCollection).pipe(
        map((docs) => docs.map((doc) => doc['nombre'])),
        catchError(error => {
          console.error('Error al obtener especialidades:', error);
          return of([]);
        })
      );
    }
  

    cargarEspecialidades(): void {
      this.obtenerEspecialidades().subscribe(
        (especialidades: string[]) => {
          this.especialidades = especialidades;
        },
        error => console.error('Error al cargar especialidades:', error)
      );
    }


obtenerDiasDisponiblesPorEspecialista(especialistaId: string, especialidad: string): Observable<{ fechaSeleccionada: Date; especialidad: string; horarios: { horario: string; ocupado: boolean }[] }[]> {
  const especialistaDocRef = doc(this.firestore, `DatosUsuarios/${especialistaId}`);
  
  return from(getDoc(especialistaDocRef)).pipe(
      mergeMap(docSnap => {
          if (docSnap.exists()) {
              const disponibilidad = docSnap.data()?.['disponibilidad'] || [];
              const diasConHorariosDisponibles: { fechaSeleccionada: Date; especialidad: string; horarios: { horario: string; ocupado: boolean }[] }[] = [];

              return from(disponibilidad).pipe(
                  mergeMap((entry: any) => {
                      const fecha = new Date(entry.fechaSeleccionada);
                      return this.obtenerHorariosDisponiblesConEstado(especialistaId, fecha, especialidad).pipe(
                          map(horariosDisponibles => {
                              if (horariosDisponibles.length > 0) {
                                  diasConHorariosDisponibles.push({ 
                                      fechaSeleccionada: fecha, 
                                      especialidad, 
                                      horarios: horariosDisponibles 
                                  });
                              }
                          })
                      );
                  }),
                  map(() => diasConHorariosDisponibles),
                  catchError(error => {
                      console.error('Error al obtener días con horarios disponibles:', error);
                      return of([]);
                  })
              );
          } else {
              throw new Error('Especialista no encontrado');
          }
      }),
      catchError(error => {
          console.error('Error al obtener días disponibles:', error);
          return of([]);
      })
  );
}



  private esFechaEnProximos15Dias(fecha: Date): boolean {
    const hoy = new Date();
    const fechaLimite = new Date(hoy);
    fechaLimite.setDate(hoy.getDate() + 15);
    return fecha >= hoy && fecha <= fechaLimite;
  }




      obtenerHorariosDisponiblesPorDia(especialistaId: string, fecha: Date, especialidad: string): Observable<string[]> {
        const turnosRef = collection(this.firestore, 'turnos');
        const startOfDay = new Date(fecha);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(fecha);
        endOfDay.setHours(23, 59, 59, 999);
    
        console.log(`Consultando horarios para especialista ID: ${especialistaId}, especialidad: ${especialidad}, fecha: ${startOfDay.toISOString()} - ${endOfDay.toISOString()}`);
    
        // Crear la consulta para obtener los turnos aceptados para el día y especialidad específicos
        const q = query(
            turnosRef,
            where('especialistaId', '==', especialistaId),
            where('especialidad', '==', especialidad),
            where('estado', '==', 'pendiente'),  // Solo los turnos en estado pendiente
            where('ocupado', '==', false),       // Solo los turnos no ocupados
            where('fechaHora', '>=', Timestamp.fromDate(startOfDay)),
            where('fechaHora', '<=', Timestamp.fromDate(endOfDay))
        );
    
        return from(getDocs(q)).pipe(
            map(snapshot => {
                const horariosDisponibles: string[] = [];
    
                snapshot.forEach(doc => {
                    const turnoData = doc.data() as Turno;
                    if (turnoData.horaInicio) {
                        horariosDisponibles.push(turnoData.horaInicio);
                    }
                });
    
                console.log(`Horarios disponibles para ${fecha.toLocaleDateString()} :`, horariosDisponibles);
                return horariosDisponibles;
            }),
            catchError(error => {
                console.error('Error al obtener horarios disponibles por día:', error);
                return of([]);
            })
        );
    }

   //neuvo

   obtenerHorariosDisponiblesConEstado(especialistaId: string, fecha: Date, especialidad: string): Observable<{ horario: string; ocupado: boolean }[]> {
    const especialistaDocRef = doc(this.firestore, `DatosUsuarios/${especialistaId}`);
    const startOfDay = new Date(fecha);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fecha);
    endOfDay.setHours(23, 59, 59, 999);

    
    return from(getDoc(especialistaDocRef)).pipe(
        mergeMap(especialistaDocSnap => {
            if (!especialistaDocSnap.exists()) {
                throw new Error('Especialista no encontrado');
            }
            const disponibilidad = especialistaDocSnap.data()?.['disponibilidad'] || [];
            const horariosParaFecha = disponibilidad.find((entry: any) => 
                entry.especialidad === especialidad && entry.fechaSeleccionada.startsWith(fecha.toISOString().split('T')[0])
            )?.horarios || [];

            //  turnos ocupados para este día, especialidad y especialista
            const turnosRef = collection(this.firestore, 'turnos');
            const q = query(
                turnosRef,
                where('especialistaId', '==', especialistaId),
                where('especialidad', '==', especialidad),
                where('fechaHora', '>=', Timestamp.fromDate(startOfDay)),
                where('fechaHora', '<=', Timestamp.fromDate(endOfDay)),
                where('ocupado', '==', true)
            );

            return from(getDocs(q)).pipe(
                map(snapshot => {
                    const horariosOcupados = snapshot.docs.map(doc => (doc.data() as Turno).horaInicio);
                    return horariosParaFecha.map((horario: string) => ({
                        horario,
                        ocupado: horariosOcupados.includes(horario)
                    }));
                })
            );
        }),
        catchError(error => {
            console.error('Error al obtener horarios con estado:', error);
            return of([]);
        })
    );
}








  











   ngOnInit() {
    this.searchControl.valueChanges.subscribe(searchTerm => {
      this.turnos$ = this.searchTurnosByHistoriaClinica(searchTerm);
    });
  }


  obtenerTurnosPorPaciente(pacienteMail: string): Observable<any[]> {
    const turnosCollectionRef = collection(this.firestore, `turnos/${pacienteMail.toLocaleLowerCase()}/turnos`);
    return collectionData(turnosCollectionRef, { idField: 'id' }).pipe(
      map(turnos => turnos.map(turno => ({
        ...turno,
        fechaHora: turno['fechaHora'].seconds 
          ? new Date(turno['fechaHora'].seconds * 1000 + turno['fechaHora'].nanoseconds / 1000000)
          : turno['fechaHora']
      }))),
      catchError(error => {
        console.error(`Error al obtener los turnos:`, error);
        return of([]);
      })
    );
  }

  obtenerTurnoPorId(turnoId: string): Observable<Turno> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return from(getDoc(turnoDocRef)).pipe(
      map((turnoDoc: DocumentSnapshot) => {
        const turnoData = turnoDoc.data() as Turno;
        return {
          ...turnoData,
          id: turnoDoc.id
        };
      }),
      catchError(error => {
        console.error('Error al obtener el turno por ID:', error);
        throw error; 
      })
    );
  }



  getTurnosUsuarioLogueado(): Observable<any[]> {
    return this.pacienteService.getPacienteInfo().pipe(
      switchMap(paciente => {
        console.log('Obteniendo turnos para el usuario:', paciente.mail);
        return this.obtenerTurnosPorPaciente(paciente.mail);
      }),
      catchError(error => {
        console.error('Error al obtener la información del paciente:', error);
        return of([]);
      })
    );
  }

  obtenerTodosLosTurnos(): Observable<Turno[]> {
    const turnosCollectionGroup = collectionGroup(this.firestore, 'turnos');
    return from(getDocs(turnosCollectionGroup)).pipe(
      map(querySnapshot => {
        const allTurnos: Turno[] = [];
        querySnapshot.forEach(turnoDoc => {
          const turnoData = turnoDoc.data() as Turno;
          //console.log('Turno Data:', turnoData); // Log para verificar los datos del turno
          if (turnoData['fechaHora'] instanceof Timestamp) {
            turnoData.fechaHora = turnoData['fechaHora'].toDate();
          }
          allTurnos.push({ ...turnoData, id: turnoDoc.id });
        });
        //console.log('All Turnos:', allTurnos); // Log para verificar todos los turnos obtenidos
        return allTurnos;
      }),
      catchError(error => {
        console.error(`Error al obtener los turnos:`, error);
        return of([]);
      })
    );
  }

  

  async obtenerTurnos(): Promise<any[]> {
    try {
      const turnosQuery = query(
        collection(this.firestore, 'turnos')
      );
  
      const querySnapshot: QuerySnapshot<any> = await getDocs(turnosQuery);
  
      const turnos: any[] = [];
      querySnapshot.forEach((doc) => {
  
        const turnos = {
          id: doc.id,
          ...doc.data(),
        };
        turnos.push(turnos);
      });
  
      return turnos;
    } catch (error) {
      console.error('Error al obtener usuarios:', error);
      throw error;
    }
  }

  /*async solicitarTurno(
    especialidad: string,
    especialistaId: string,
    fecha: Date,
    horaInicio: string,
    horaFin: string,
    pacienteMail: string,
    pacienteNombre: string,
    pacienteApellido: string,
    especialistaMail: string,
    especialistaNombre: string,
    especialistaApellido: string
  ): Promise<void> {
    const nuevoTurno: Turno = {
      id: '',
      paciente: {
        mail: pacienteMail.toLocaleLowerCase(),
        nombre: pacienteNombre,
        apellido: pacienteApellido,
      },
      especialista: {
        mail: especialistaMail.toLocaleLowerCase(),
        nombre: especialistaNombre,
        apellido: especialistaApellido,
      },
      especialidad,
      especialistaId,
      fechaHora: fecha,
      horaInicio,
      horaFin,
      estado: 'pendiente',
      ocupado: false,
    };
  
    const docRef = await addDoc(this.turnosCollection, nuevoTurno);
    await updateDoc(docRef, { id: docRef.id });
  }*/

 /* obtenerTurnosPorUsuario(userEmail: string, userRole: string): Observable<Turno[]> {
    const field = userRole === 'paciente' ? 'paciente.mail' : 'especialista.mail';
    console.log(`Querying turnos for field: ${field} with userEmail: ${userEmail}`);
    
    const q = query(this.turnosCollection, where(field, '==', userEmail));
    return from(getDocs(q)).pipe(
      map(snapshot => {
        console.log(`Found ${snapshot.size} turnos`);
        return snapshot.docs.map(doc => {
          const data = doc.data() as Turno;
          if (data.fechaHora instanceof Timestamp) {
            data.fechaHora = data.fechaHora.toDate();
          }
          return data;
        });
      }),
      catchError(error => {
        console.error('Error al obtener turnos:', error);
        return of([]);
      })
    );
  }*/

    obtenerTurnosPorUsuario(userEmail: string, userRole: string): Observable<Turno[]> {
      return from(getDocs(this.turnosCollection)).pipe(
        map(snapshot => {
          const turnos = snapshot.docs.map(doc => {
            const data = doc.data() as Turno;
            if (data.fechaHora instanceof Timestamp) {
              data.fechaHora = data.fechaHora.toDate();
            }
           
            return data;
          });
           
          
          // Filtrado basado en el rol
          if (userRole === 'paciente') {
            console.log("Filtrando para paciente:", userEmail);
            const turnosFiltrados = turnos.filter(turno => {
              console.log("Comparando:", turno.paciente?.mail, "con", userEmail);
              return turno.paciente?.mail?.trim().toLowerCase() === userEmail.trim().toLowerCase();
            });
        console.log("Turnos filtrados:", turnosFiltrados);
        return turnosFiltrados;
          } else if (userRole === 'especialista') {
            return turnos.filter(turno => turno.especialista?.mail?.trim().toLowerCase() === userEmail.trim().toLowerCase());
          } else {
            return [];
          }
        }),
        catchError(error => {
          console.error('Error al obtener turnos:', error);
          return of([]);
        })
      );
    }

  async actualizarEstadoTurno(turnoId: string, estado: string): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { estado: estado, ocupado: estado === 'aceptado' });
  }

  aceptarTurno(turnoId: string): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    console.log('Aceptando turno con ID:', turnoId);
    return updateDoc(turnoDocRef, { estado: 'aceptado', ocupado: true });
  }

  cancelarTurno(turnoId: string, motivo: string): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { estado: 'cancelado', motivoCancelacion: motivo });
  }

  rechazarTurno(turnoId: string, motivo: string): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { estado: 'rechazado', motivoRechazo: motivo });
  }

  finalizarTurno(turnoId: string, comentario: string): Promise<void> {

    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { estado: 'realizado', comentario  });

  }

  cargarHistoriaClinica(turnoId: string, comentario: string): Promise<void> {

    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { estado: 'realizado', comentario  });

  }

  verificarDisponibilidad(especialistaId: string, fecha: Date, horaInicio: string, horaFin: string): Observable<boolean> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, 
      where('especialistaId', '==', especialistaId), 
      where('fechaHora', '==', Timestamp.fromDate(fecha)), 
      where('horaInicio', '==', horaInicio),
      where('horaFin', '==', horaFin),
      where('estado', '==', 'aceptado'),
      where('ocupado', '==', 'true')
    );
  
    return from(getDocs(q).then(snapshot => snapshot.empty));
  }

  cancelarTurnoComoAdmin(turnoId: string, motivo: string): Promise<void> {
    const turnosCollectionGroup = collectionGroup(this.firestore, 'turnos');
    return getDocs(turnosCollectionGroup).then(querySnapshot => {
      const turnoDocRef = querySnapshot.docs.find(doc => doc.id === turnoId)?.ref;
      if (turnoDocRef) {
        return updateDoc(turnoDocRef, { estado: 'cancelado', motivoCancelacion: motivo });
      } else {
        return Promise.reject('No se encontró el turno con el ID proporcionado.');
      }
    }).catch(error => {
      console.error(`Error al cancelar el turno:`, error);
      return Promise.reject('Error al cancelar el turno.');
    });
  }

  obtenerResena(turnoId: string): Observable<string> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return from(getDoc(turnoDocRef)).pipe(
      map((turnoDoc: DocumentSnapshot<DocumentData>) => {
        const turnoData = turnoDoc.data() as Turno;
        return turnoData ? turnoData.comentario || '' : '';
      }),
      catchError(error => {
        console.error(`Error al obtener la reseña:`, error);
        return of('');
      })
    );
  }

  completarEncuesta(turnoId: string, encuesta: any): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, {
      encuesta,
      encuestaCompletada: true
    });
  }

  calificarAtencion(turnoId: string, comentarioCalificacion: string): Promise<void> {
    const turnoDocRef = doc(this.firestore, `turnos/${turnoId}`);
    return updateDoc(turnoDocRef, { comentarioCalificacion, calificacionCompletada: true });
  }

  obtenerTurnosPorEspecialista(especialistaId: string): Observable<Turno[]> {
    const turnosCollectionRef = collection(this.firestore, 'turnos');
    const q = query(turnosCollectionRef, where('especialistaId', '==', especialistaId));
    return from(getDocs(q)).pipe(
      map((querySnapshot) => {
        const turnos: Turno[] = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data() as Turno;
          turnos.push(data);
        });
        return turnos;
      })
    );
  }

  async obtenerTurnosAceptadosPorEspecialista(especialistaId: string): Promise<Turno[]> {
    const turnosRef = collection(this.firestore, 'turnos');
    const q = query(turnosRef, where('especialistaId', '==', especialistaId), where('estado', '==', 'aceptado'));
    const querySnapshot = await getDocs(q);

    const turnos: Turno[] = [];
    querySnapshot.forEach((doc) => {
      const data = doc.data();
      turnos.push({
        id: doc.id,
        especialidad: data['especialidad'],
        especialistaId: data['especialistaId'],
        fechaHora: data['fechaHora'],
        horaInicio: data['horaInicio'],
        horaFin: data['horaFin'],
        estado: data['estado'],
        ocupado: data['ocupado'],
        paciente: {
          mail: data['paciente'].mail,
          nombre: data['paciente'].nombre,
          apellido: data['paciente'].apellido
        },
        especialista: {
          mail: data['especialista'].mail,
          nombre: data['especialista'].nombre,
          apellido: data['especialista'].apellido
        }
      });
    });

    return turnos;
  }


  async obtenerTurnosDisponiblesParaEspecialista(especialistaId: string): Promise<TurnoDisponible[]> {
    const disponibilidadEspecialista = await this.especialistaService.obtenerDisponibilidadEspecialista(especialistaId);
    const turnosAceptados = await this.obtenerTurnosAceptadosPorEspecialista(especialistaId);
    const horariosAceptados = turnosAceptados.map(turno => turno.horario).filter(horario => horario !== undefined) as string[];
  
    const turnosDisponibles: TurnoDisponible[] = disponibilidadEspecialista.flatMap(horario => {
      const turnosHorario = this.especialistaService.generarTurnosDisponibles(horario);
      return turnosHorario.map(turno => {
        const ocupado = horariosAceptados.includes(turno.horaInicio + ' - ' + turno.horaFin);
        return {
          ...turno,
          ocupado
        };
      });
    });
  
    return turnosDisponibles;
  }


  obtenerPacientePorId(pacienteId: number): Observable<any> {
    const docRef = doc(this.firestore, `pacientes/${pacienteId}`);
    return from(getDoc(docRef)).pipe(
      map(doc => {
        if (doc.exists()) {
          return doc.data();
        } else {
          throw new Error(`No se encontró información para el paciente con ID ${pacienteId}`);
        }
      }),
      catchError(error => {
        console.error('Error al obtener la información del paciente:', error);
        return of(null); // Retornar un observable con valor null en caso de error
      })
    );
  }

  

  getTurnosPorPacienteYEspecialista(pacienteId: string, especialistaId: string): Observable<any[]> {
    const turnosCollection = collection(this.firestore, 'turnos');
    const turnosQuery = query(turnosCollection, where('pacienteId', '==', pacienteId), where('especialistaId', '==', especialistaId));

    return from(getDocs(turnosQuery)).pipe(
      map(snapshot => {
        return snapshot.docs.map(doc => doc.data());
      })
    );
  }

  searchTurnosByHistoriaClinica(searchTerm: string): Observable<any[]> {
    const turnosCollectionRef = collection(this.firestore, 'turnos');
    const q = query(turnosCollectionRef, where('historiaClinica.diagnostico', '>=', searchTerm), where('historiaClinica.diagnostico', '<=', searchTerm + '\uf8ff'));

    return collectionData(q, { idField: 'id' }).pipe(
      map(turnos => {
        // Filtrar más si es necesario, basándote en otros campos
        return turnos.filter(turno => turno['historiaClinica'] && turno['historiaClinica'].diagnostico.includes(searchTerm));
      })
    );
  }


  
}