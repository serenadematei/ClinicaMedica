import { Component,OnInit } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterModule, RouterOutlet } from '@angular/router';
import { Observable } from 'rxjs';
import { User } from 'firebase/auth';

@Component({
  selector: 'app-bienvenido',
  standalone: true,
  imports: [ CommonModule,
    RouterLink, 
    RouterLinkActive, 
    RouterOutlet, 
    RouterModule],
  templateUrl: './bienvenido.component.html',
  styleUrl: './bienvenido.component.css'
})
export class BienvenidoComponent{ 

  currentUser$: Observable<User | null>;
  isLoggedIn = false;

  constructor(private router: Router, private auth: AuthService) { 
    this.currentUser$ = this.auth.getCurrentUser();
    this.currentUser$.subscribe(user => {
      this.isLoggedIn = !!user;
    });
  }

  public goTo(path:string):void{
    this.router.navigate([path]);
  }
 
}
