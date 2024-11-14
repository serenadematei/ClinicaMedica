import { Component } from '@angular/core';
import {RouterOutlet, RouterModule} from '@angular/router';
import { Title } from '@angular/platform-browser';
import { HeaderComponent } from './header/header.component';
import { trigger, transition, style, animate, query } from '@angular/animations';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css',
  animations: [
    trigger('routeAnimations', [
      // Transición entre "bienvenido" y "login"
      transition('bienvenidoPage <=> loginPage', [
        query(':enter, :leave', [
          style({ position: 'absolute', width: '100%' })
        ], { optional: true }),
        query(':enter', [
          style({ transform: 'translateX(100%)', opacity: 0 }),
          animate('1000ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
        ], { optional: true }),
        query(':leave', [
          animate('1000ms ease-in', style({ transform: 'translateX(-100%)', opacity: 0 })),
        ], { optional: true })
      ]),

      // Transición entre "home" y "disponibilidad-horaria"
      transition('homePage <=> disponibilidadPage', [
        query(':enter, :leave', [
          style({ position: 'absolute', width: '100%' })
        ], { optional: true }),
        query(':enter', [
          style({ transform: 'translateX(-100%)', opacity: 0 }),
          animate('1000ms ease-out', style({ transform: 'translateX(0)', opacity: 1 })),
        ], { optional: true }),
        query(':leave', [
          animate('1000ms ease-in', style({ transform: 'translateX(100%)', opacity: 0 })),
        ], { optional: true })
      ])
    ])
  ],
  
})
export class AppComponent {
  constructor(private titulo:Title)
  {
    titulo.setTitle("Medical Clinic");
  }
  prepareRoute(outlet: RouterOutlet) {
    return outlet && outlet.activatedRouteData && outlet.activatedRouteData['animation'];
  }
}
