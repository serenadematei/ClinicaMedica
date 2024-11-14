import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SeccionPacientesComponent } from './seccion-pacientes.component';

describe('SeccionPacientesComponent', () => {
  let component: SeccionPacientesComponent;
  let fixture: ComponentFixture<SeccionPacientesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SeccionPacientesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SeccionPacientesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
