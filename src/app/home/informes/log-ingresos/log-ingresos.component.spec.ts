import { ComponentFixture, TestBed } from '@angular/core/testing';

import { LogIngresosComponent } from './log-ingresos.component';

describe('LogIngresosComponent', () => {
  let component: LogIngresosComponent;
  let fixture: ComponentFixture<LogIngresosComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LogIngresosComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(LogIngresosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
