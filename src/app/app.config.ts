import { ApplicationConfig, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideFirestore,getFirestore } from '@angular/fire/firestore';
import { initializeApp, provideFirebaseApp } from '@angular/fire/app';
import {provideAuth,getAuth} from '@angular/fire/auth';
import { provideHttpClient } from '@angular/common/http';
import { routes } from './app.routes';
import { HttpClientModule } from '@angular/common/http';



export const appConfig: ApplicationConfig = {
  providers: [provideRouter(routes),provideHttpClient(),
  ([
     provideFirebaseApp(()=>initializeApp(firebaseConfig)),
     provideFirestore(()=>getFirestore()),
     provideAuth(() => getAuth()),
     importProvidersFrom(HttpClientModule)
  ])]
     
};

const firebaseConfig = {
  apiKey: "AIzaSyDgzR-Pl3JZ-iPoyfvQc0jsAuobv60Fz-Q",
  authDomain: "clinica-7cc68.firebaseapp.com",
  projectId: "clinica-7cc68",
  storageBucket: "clinica-7cc68.appspot.com",
  messagingSenderId: "94408436678",
  appId: "1:94408436678:web:8bb5e95bd11fc20afee0c7"
};
