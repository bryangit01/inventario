// =====================================================================
//  MovimientosComponent  →  El kardex (historial de stock)
// =====================================================================
//  Se usa de dos formas:
//   1) Como página completa (/movimientos): todos los productos.
//   2) Dentro de una ventana, con [productoId]: solo ese producto.
// =====================================================================
import { Component, Input, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Movimiento, Pagina } from '../../models/api.models';
import { MovimientoService } from '../../services/movimiento.service';
import { PaginadorComponent } from '../../shared/paginador.component';

@Component({
  selector: 'app-movimientos',
  standalone: true,
  imports: [DatePipe, PaginadorComponent],
  template: `
    @if (!productoId) {
      <section class="encabezado">
        <div>
          <h1>Movimientos</h1>
          <p class="subtitulo">Historial de entradas, salidas y ajustes. Cada cambio de stock queda registrado.</p>
        </div>
      </section>
    }

    <section class="herramientas">
      <div class="filtros" role="group" aria-label="Filtrar por tipo">
        @for (t of tipos; track t.valor) {
          <button type="button" class="filtro" [class.filtro-activo]="tipo === t.valor" (click)="filtrar(t.valor)">{{ t.etiqueta }}</button>
        }
      </div>
    </section>

    @if (cargando) {
      <div class="estado-vacio">Cargando movimientos...</div>
    } @else if (error) {
      <div class="estado-vacio estado-error"><p>{{ error }}</p></div>
    } @else if (resultado.datos.length === 0) {
      <div class="estado-vacio">Todavía no hay movimientos.</div>
    } @else {
      <div class="tabla-caja">
        <table class="tabla">
          <thead>
            <tr>
              <th>Fecha</th>
              @if (!productoId) { <th>Producto</th> }
              <th>Tipo</th>
              <th>Unidades</th>
              <th>Stock</th>
              <th>Usuario</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            @for (m of resultado.datos; track m.id) {
              <tr>
                <td class="nowrap">{{ m.creado_en | date: 'dd/MM/yyyy HH:mm' }}</td>
                @if (!productoId) {
                  <td>
                    <div class="producto-nombre">{{ m.producto }}</div>
                    @if (m.sku) { <div class="producto-desc">{{ m.sku }}</div> }
                  </td>
                }
                <td><span class="badge" [class]="'badge badge-' + m.tipo">{{ m.tipo }}</span></td>
                <td class="nowrap"><strong>{{ signo(m) }}{{ m.cantidad }}</strong></td>
                <td class="nowrap">{{ m.stock_anterior }} → {{ m.stock_nuevo }}</td>
                <td>{{ m.usuario ?? 'Sistema' }}</td>
                <td class="producto-desc">{{ m.motivo }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-paginador [pagina]="resultado.pagina" [limite]="resultado.limite" [total]="resultado.total" [totalPaginas]="resultado.totalPaginas" (cambiar)="cambiarPagina($event)" />
    }
  `,
})
export class MovimientosComponent implements OnInit {
  /** Si viene, solo se muestran los movimientos de ese producto. */
  @Input() productoId?: number;

  resultado: Pagina<Movimiento> = { datos: [], total: 0, pagina: 1, limite: 10, totalPaginas: 1 };
  pagina = 1;
  tipo = '';
  cargando = true;
  error = '';

  readonly tipos = [
    { valor: '', etiqueta: 'Todos' },
    { valor: 'entrada', etiqueta: 'Entradas' },
    { valor: 'salida', etiqueta: 'Salidas' },
    { valor: 'ajuste', etiqueta: 'Ajustes' },
  ];

  constructor(private api: MovimientoService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.api
      .listar({ pagina: this.pagina, limite: 10, producto_id: this.productoId, tipo: this.tipo || undefined })
      .subscribe({
        next: (r) => {
          this.resultado = r;
          this.cargando = false;
        },
        error: () => {
          this.error = 'No se pudo cargar el historial.';
          this.cargando = false;
        },
      });
  }

  filtrar(tipo: string): void {
    this.tipo = tipo;
    this.pagina = 1;
    this.cargar();
  }

  cambiarPagina(p: number): void {
    this.pagina = p;
    this.cargar();
  }

  /** + si el stock subió, − si bajó. */
  signo(m: Movimiento): string {
    return m.stock_nuevo >= m.stock_anterior ? '+' : '−';
  }
}
