import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnosSolicitadosPorMedicoComponent } from './turnos-solicitados-por-medico.component';

describe('TurnosSolicitadosPorMedicoComponent', () => {
  let component: TurnosSolicitadosPorMedicoComponent;
  let fixture: ComponentFixture<TurnosSolicitadosPorMedicoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnosSolicitadosPorMedicoComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TurnosSolicitadosPorMedicoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
