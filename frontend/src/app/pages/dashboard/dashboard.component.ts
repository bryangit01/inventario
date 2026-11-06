// =====================================================================
//  DashboardComponent  →  Panel de control
// =====================================================================
//  Las gráficas son HTML + CSS puro (barras con altura en %), sin librerías.
//  Si luego quieres gráficas más avanzadas, mira ng2-charts o ngx-echarts.
// =====================================================================
import { Component, OnInit } from '@angular/core';
import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';
import { Dashboard } from '../../models/api.models';
import { AdminService } from '../../services/admin.service';

interface BarraDia {
  etiqueta: string;
  entradas: number;
  salidas: number;
  altoEntradas: number;
  altoSalidas: number;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CurrencyPipe, DecimalPipe, RouterLink],
  template: `
    <section class="encabezado">
      <div>
        <h1>Panel</h1>
        <p class="subtitulo">Así está tu inventario hoy.</p>
      </div>
    </section>

    @if (error) {
      <div class="estado-vacio estado-error">
        <p>{{ error }}</p>
        <button type="button" class="btn btn-suave" (click)="cargar()">Reintentar</button>
      </div>
    } @else if (!datos) {
      <div class="estado-vacio">Cargando panel...</div>
    } @else {
      <section class="resumen resumen-auto" aria-label="Resumen">
        <div class="dato"><strong>{{ datos.totales.productos | number }}</strong><span>productos</span></div>
        <div class="dato"><strong>{{ datos.totales.unidades | number }}</strong><span>unidades en stock</span></div>
        <div class="dato"><strong>{{ datos.totales.valor_costo | currency: moneda : 'symbol-narrow' : '1.0-0' }}</strong><span>valor a costo</span></div>
        <div class="dato"><strong>{{ datos.totales.valor_venta | currency: moneda : 'symbol-narrow' : '1.0-0' }}</strong><span>valor a precio de venta</span></div>
        <div class="dato" [class.dato-alerta]="datos.totales.stock_bajo > 0"><strong>{{ datos.totales.stock_bajo }}</strong><span>con stock bajo</span></div>
        <div class="dato" [class.dato-peligro]="datos.totales.agotados > 0"><strong>{{ datos.totales.agotados }}</strong><span>agotados</span></div>
      </section>

      <section class="paneles">
        <div class="panel">
          <h2>Movimientos de los últimos 14 días</h2>
          <div class="leyenda">
            <span><i class="punto punto-entrada"></i> Entradas</span>
            <span><i class="punto punto-salida"></i> Salidas</span>
          </div>
          <div class="grafica" role="img" aria-label="Entradas y salidas de los últimos 14 días">
            @for (d of dias; track d.etiqueta) {
              <div class="grafica-col" [title]="d.etiqueta + ': +' + d.entradas + ' / −' + d.salidas">
                <div class="grafica-barras">
                  <div class="barra-e" [style.height.%]="d.altoEntradas"></div>
                  <div class="barra-s" [style.height.%]="d.altoSalidas"></div>
                </div>
                <span class="grafica-dia">{{ d.etiqueta }}</span>
              </div>
            }
          </div>
        </div>

        <div class="panel">
          <h2>Unidades por categoría</h2>
          @if (datos.porCategoria.length === 0) {
            <p class="subtitulo">Aún no hay productos.</p>
          }
          @for (c of datos.porCategoria; track c.nombre) {
            <div class="fila-barra">
              <div class="fila-barra-texto">
                <span>{{ c.nombre }}</span>
                <strong>{{ c.unidades | number }}</strong>
              </div>
              <div class="barra-stock"><div class="barra-relleno nivel-ok" [style.width.%]="pctCategoria(c.unidades)"></div></div>
            </div>
          }
        </div>

        <div class="panel panel-ancho">
          <h2>Necesitan reposición</h2>
          @if (datos.alertas.length === 0) {
            <p class="subtitulo">Todo el stock está por encima del mínimo.</p>
          } @else {
            <ul class="lista-alertas">
              @for (a of datos.alertas; track a.id) {
                <li>
                  <div>
                    <div class="producto-nombre">{{ a.nombre }}</div>
                    @if (a.sku) { <div class="producto-desc">{{ a.sku }}</div> }
                  </div>
                  <div class="alerta-cifras">
                    <strong [class]="a.cantidad === 0 ? 'texto-agotado' : 'texto-bajo'">{{ a.cantidad }} en stock</strong>
                    <span>mínimo {{ a.stock_minimo }}</span>
                  </div>
                </li>
              }
            </ul>
            <a routerLink="/productos" class="enlace">Ver productos</a>
          }
        </div>
      </section>
    }
  `,
})
export class DashboardComponent implements OnInit {
  datos: Dashboard | null = null;
  error = '';
  dias: BarraDia[] = [];
  moneda = environment.moneda;
  private maxCategoria = 1;

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.error = '';
    this.admin.dashboard().subscribe({
      next: (d) => {
        this.datos = d;
        this.maxCategoria = Math.max(1, ...d.porCategoria.map((c) => c.unidades));
        this.dias = this.armarDias(d);
      },
      error: () => (this.error = 'No se pudo cargar el panel. Revisa que el backend esté encendido.'),
    });
  }

  pctCategoria(unidades: number): number {
    return Math.round((unidades / this.maxCategoria) * 100);
  }

  /** Genera los últimos 14 días (aunque no tengan movimientos) con la altura de cada barra. */
  private armarDias(d: Dashboard): BarraDia[] {
    const porDia = new Map(d.movimientosPorDia.map((m) => [m.dia, m]));
    const maximo = Math.max(1, ...d.movimientosPorDia.map((m) => Math.max(m.entradas, m.salidas)));
    const lista: BarraDia[] = [];
    for (let i = 13; i >= 0; i--) {
      const fecha = new Date();
      fecha.setDate(fecha.getDate() - i);
      const clave = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
      const m = porDia.get(clave);
      lista.push({
        etiqueta: `${fecha.getDate()}/${fecha.getMonth() + 1}`,
        entradas: m?.entradas ?? 0,
        salidas: m?.salidas ?? 0,
        altoEntradas: ((m?.entradas ?? 0) / maximo) * 100,
        altoSalidas: ((m?.salidas ?? 0) / maximo) * 100,
      });
    }
    return lista;
  }
}
