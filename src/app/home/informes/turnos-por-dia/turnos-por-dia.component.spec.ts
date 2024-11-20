import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TurnosPorDiaComponent } from './turnos-por-dia.component';

describe('TurnosPorDiaComponent', () => {
  let component: TurnosPorDiaComponent;
  let fixture: ComponentFixture<TurnosPorDiaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TurnosPorDiaComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(TurnosPorDiaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
