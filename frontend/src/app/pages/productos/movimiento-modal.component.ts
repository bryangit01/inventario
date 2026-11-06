// =====================================================================
//  MovimientoModalComponent  →  Registrar entrada, salida o ajuste de stock
// =====================================================================
//  Muestra cómo quedará el stock ANTES de guardar. Si la salida es mayor
//  que el stock disponible, bloquea el botón (el servidor también lo valida).
// =====================================================================
import { Component, EventEmitter, Input, Output } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TipoMovimiento } from '../../models/api.models';
import { Producto } from '../../models/producto.model';
import { MovimientoService } from '../../services/movimiento.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-movimiento-modal',
  standalone: true,
  imports: [FormsModule],
  template: `
    <div class="fondo-modal" (click)="cancelar.emit()">
      <form class="modal" (ngSubmit)="enviar()" (click)="$event.stopPropagation()" role="dialog" aria-modal="true" aria-labelledby="titulo-mov">
        <h2 id="titulo-mov">Mover stock</h2>
        <p class="subtitulo">{{ producto.nombre }} · stock actual: <strong>{{ producto.cantidad }}</strong></p>

        <div class="filtros filtros-modal" role="group" aria-label="Tipo de movimiento">
          @for (t of tipos; track t.valor) {
            <button type="button" class="filtro" [class.filtro-activo]="tipo === t.valor" (click)="elegirTipo(t.valor)">{{ t.etiqueta }}</button>
          }
        </div>
        <p class="ayuda">{{ ayuda }}</p>

        <label class="campo">
          <span>{{ tipo === 'ajuste' ? 'Nuevo conteo total' : 'Cantidad' }}</span>
          <input type="number" name="cantidad" [(ngModel)]="cantidad" min="0" step="1" />
        </label>

        <label class="campo">
          <span>Motivo (opcional)</span>
          <input type="text" name="motivo" [(ngModel)]="motivo" maxlength="255" placeholder="Ej: Compra factura 1234" />
        </label>

        <div class="previa" [class.previa-error]="invalido">
          @if (error) {
            {{ error }}
          } @else if (invalido) {
            Revisa la cantidad: debe ser un número entero válido y no dejar el stock en negativo.
          } @else {
            Stock después del movimiento: <strong>{{ resultante }}</strong>
          }
        </div>

        <div class="modal-acciones">
          <button type="button" class="btn btn-suave" (click)="cancelar.emit()">Cancelar</button>
          <button type="submit" class="btn btn-primario" [disabled]="invalido || enviando">Registrar movimiento</button>
        </div>
      </form>
    </div>
  `,
})
export class MovimientoModalComponent {
  @Input({ required: true }) producto!: Producto;
  @Output() registrado = new EventEmitter<Producto>();
  @Output() cancelar = new EventEmitter<void>();

  tipo: TipoMovimiento = 'entrada';
  cantidad: number | null = 1;
  motivo = '';
  enviando = false;
  error = '';

  readonly tipos: { valor: TipoMovimiento; etiqueta: string; ayuda: string }[] = [
    { valor: 'entrada', etiqueta: 'Entrada', ayuda: 'Suma unidades: compras, devoluciones de clientes.' },
    { valor: 'salida', etiqueta: 'Salida', ayuda: 'Resta unidades: ventas, mermas, consumo interno.' },
    { valor: 'ajuste', etiqueta: 'Ajuste', ayuda: 'Fija el stock al número que contaste físicamente.' },
  ];

  constructor(
    private api: MovimientoService,
    private toast: ToastService
  ) {}

  get ayuda(): string {
    return this.tipos.find((t) => t.valor === this.tipo)?.ayuda ?? '';
  }

  get resultante(): number {
    const n = Number(this.cantidad ?? 0);
    if (this.tipo === 'entrada') return this.producto.cantidad + n;
    if (this.tipo === 'salida') return this.producto.cantidad - n;
    return n;
  }

  get invalido(): boolean {
    const n = Number(this.cantidad);
    if (this.cantidad === null || !Number.isInteger(n) || n < 0) return true;
    if (this.tipo !== 'ajuste' && n < 1) return true;
    return this.resultante < 0;
  }

  elegirTipo(t: TipoMovimiento): void {
    this.tipo = t;
    this.cantidad = t === 'ajuste' ? this.producto.cantidad : 1;
    this.error = '';
  }

  enviar(): void {
    if (this.invalido) return;
    this.enviando = true;
    this.error = '';
    this.api
      .registrar({ producto_id: this.producto.id!, tipo: this.tipo, cantidad: Number(this.cantidad), motivo: this.motivo })
      .subscribe({
        next: (r) => {
          this.toast.exito('Movimiento registrado.');
          this.registrado.emit(r.producto);
        },
        error: (e) => {
          this.enviando = false;
          this.error = e.error?.mensaje ?? 'No se pudo registrar el movimiento.';
        },
      });
  }
}
