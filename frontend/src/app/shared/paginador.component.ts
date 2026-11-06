// PaginadorComponent → botones Anterior / Siguiente reutilizables en todas las tablas.
import { Component, EventEmitter, Input, Output } from '@angular/core';

@Component({
  selector: 'app-paginador',
  standalone: true,
  template: `
    <div class="paginador">
      <span class="paginador-info">{{ desde }}–{{ hasta }} de {{ total }}</span>
      <div class="paginador-botones">
        <button type="button" class="btn btn-suave btn-chico" [disabled]="pagina <= 1" (click)="cambiar.emit(pagina - 1)">Anterior</button>
        <span>Página {{ pagina }} de {{ totalPaginas }}</span>
        <button type="button" class="btn btn-suave btn-chico" [disabled]="pagina >= totalPaginas" (click)="cambiar.emit(pagina + 1)">Siguiente</button>
      </div>
    </div>
  `,
})
export class PaginadorComponent {
  @Input() pagina = 1;
  @Input() limite = 10;
  @Input() total = 0;
  @Input() totalPaginas = 1;
  @Output() cambiar = new EventEmitter<number>();

  get desde(): number {
    return this.total === 0 ? 0 : (this.pagina - 1) * this.limite + 1;
  }
  get hasta(): number {
    return Math.min(this.pagina * this.limite, this.total);
  }
}
