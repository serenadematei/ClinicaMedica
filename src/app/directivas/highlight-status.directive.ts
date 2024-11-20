import { Directive, ElementRef, Input, OnChanges, Renderer2 } from '@angular/core';

@Directive({
  selector: '[appHighlightStatus]', // Selector de la directiva
  standalone: true, // Especifica que es una directiva standalone
})
export class HighlightStatusDirective implements OnChanges {
  @Input() appHighlightStatus!: string; // Estado del turno recibido como input

  constructor(private el: ElementRef, private renderer: Renderer2) {}

  ngOnChanges(): void {
    this.applyHighlight(); // Llama a la lógica de estilos cada vez que cambia el input
  }

  private applyHighlight(): void {
    // Eliminar clases previas para evitar conflictos
    this.renderer.removeClass(this.el.nativeElement, 'status-realizado');
    this.renderer.removeClass(this.el.nativeElement, 'status-pendiente');
    this.renderer.removeClass(this.el.nativeElement, 'status-cancelado');

    // Añadir la clase según el estado
    switch (this.appHighlightStatus) {
      case 'realizado':
        this.renderer.addClass(this.el.nativeElement, 'status-realizado');
        break;
      case 'pendiente':
        this.renderer.addClass(this.el.nativeElement, 'status-pendiente');
        break;
      case 'cancelado':
        this.renderer.addClass(this.el.nativeElement, 'status-cancelado');
        break;
      default:
        break;
    }
  }
}