import { Directive, Input, HostBinding } from '@angular/core';

@Directive({
  selector: '[appActiveButton]',
  standalone: true,
})
export class ActiveButtonDirective {
  @Input() buttonType: string = ''; // Tipo de botón asociado
  @Input() currentFilter: string = ''; // Filtro actual

  @HostBinding('class.active') get isActive(): boolean {
    console.log(`buttonType: ${this.buttonType}, currentFilter: ${this.currentFilter}`);
    return this.buttonType === this.currentFilter; // Aplica la clase si los valores coinciden
  }
}
