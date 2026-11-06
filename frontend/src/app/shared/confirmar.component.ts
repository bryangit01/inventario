// ConfirmarComponent → ventana "¿Seguro?" reutilizable para acciones destructivas.
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-confirmar',
  standalone: true,
  template: `
    <div class="fondo-modal" (click)="cancelar.emit()">
      <div class="modal modal-chico" role="alertdialog" aria-modal="true" (click)="$event.stopPropagation()">
        <h2>{{ titulo }}</h2>
        <p class="subtitulo">{{ mensaje }}</p>
        <div class="modal-acciones">
          <button type="button" class="btn btn-suave" (click)="cancelar.emit()">Cancelar</button>
          <button type="button" class="btn btn-peligro-solido" (click)="confirmar.emit()">{{ boton }}</button>
        </div>
      </div>
    </div>
  `,
})
export class ConfirmarComponent {
  @Input() titulo = '¿Estás seguro?';
  @Input() mensaje = '';
  @Input() boton = 'Confirmar';
  @Output() confirmar = new EventEmitter<void>();
  @Output() cancelar = new EventEmitter<void>();
}
