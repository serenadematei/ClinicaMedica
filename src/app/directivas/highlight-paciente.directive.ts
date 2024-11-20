import { Directive, ElementRef, Input, OnChanges, Renderer2, SimpleChanges } from '@angular/core';

@Directive({
  selector: '[appHighlightPaciente]',
  standalone: true
})
export class HighlightPacienteDirective implements OnChanges {
  @Input() appHighlightPaciente: boolean = false;

  constructor(private el: ElementRef, private renderer: Renderer2) {}


    ngOnChanges(changes: SimpleChanges): void {
      if (changes['appHighlightPaciente']) {
        if (this.appHighlightPaciente) {
        
          this.renderer.setStyle(this.el.nativeElement, 'border', '2px solid #7d073a');
          this.renderer.setStyle(this.el.nativeElement, 'background-color', '#dc327bbc');
        } else {
          
          this.renderer.removeStyle(this.el.nativeElement, 'border');
          this.renderer.removeStyle(this.el.nativeElement, 'background-color');
        }
      }
    }
}
