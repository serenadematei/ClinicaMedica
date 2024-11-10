import { TestBed } from '@angular/core/testing';

import { EspecialistaService } from './especialista.service';

describe('EspecialistaService', () => {
  let service: EspecialistaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EspecialistaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
