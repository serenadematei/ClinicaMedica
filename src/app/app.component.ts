import { Component } from '@angular/core';
import {RouterOutlet, RouterModule} from '@angular/router';
import { Title } from '@angular/platform-browser';
import { HeaderComponent } from './header/header.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterModule, HeaderComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  constructor(private titulo:Title)
  {
    titulo.setTitle("Medical Clinic");
  }
}
