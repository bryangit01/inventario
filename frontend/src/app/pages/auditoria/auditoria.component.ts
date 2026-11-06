// AuditoriaComponent → quién hizo qué y cuándo (solo administradores).
import { Component, OnInit } from '@angular/core';
import { DatePipe, JsonPipe } from '@angular/common';
import { AuditoriaItem, Pagina } from '../../models/api.models';
import { AdminService } from '../../services/admin.service';
import { PaginadorComponent } from '../../shared/paginador.component';

@Component({
  selector: 'app-auditoria',
  standalone: true,
  imports: [DatePipe, JsonPipe, PaginadorComponent],
  template: `
    <section class="encabezado">
      <div>
        <h1>Auditoría</h1>
        <p class="subtitulo">Registro de las acciones de cada usuario, con los valores antes y después.</p>
      </div>
    </section>

    <section class="herramientas">
      <div class="filtros" role="group" aria-label="Filtrar por tipo de dato">
        @for (e of entidades; track e.valor) {
          <button type="button" class="filtro" [class.filtro-activo]="entidad === e.valor" (click)="filtrar(e.valor)">{{ e.etiqueta }}</button>
        }
      </div>
    </section>

    @if (cargando) {
      <div class="estado-vacio">Cargando registro...</div>
    } @else if (resultado.datos.length === 0) {
      <div class="estado-vacio">No hay acciones registradas.</div>
    } @else {
      <div class="tabla-caja">
        <table class="tabla">
          <thead>
            <tr><th>Fecha</th><th>Usuario</th><th>Dato</th><th>Acción</th><th>Detalle</th></tr>
          </thead>
          <tbody>
            @for (a of resultado.datos; track a.id) {
              <tr>
                <td class="nowrap">{{ a.creado_en | date: 'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ a.usuario ?? 'Sistema' }}</td>
                <td>{{ a.entidad }}{{ a.entidad_id ? ' #' + a.entidad_id : '' }}</td>
                <td><span class="badge badge-ajuste">{{ a.accion.replaceAll('_', ' ') }}</span></td>
                <td>
                  @if (a.antes || a.despues) {
                    <details class="detalle">
                      <summary>Ver cambios</summary>
                      @if (a.antes) { <div class="mini">Antes</div><pre>{{ a.antes | json }}</pre> }
                      @if (a.despues) { <div class="mini">Después</div><pre>{{ a.despues | json }}</pre> }
                    </details>
                  }
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
      <app-paginador [pagina]="resultado.pagina" [limite]="resultado.limite" [total]="resultado.total" [totalPaginas]="resultado.totalPaginas" (cambiar)="cambiarPagina($event)" />
    }
  `,
})
export class AuditoriaComponent implements OnInit {
  resultado: Pagina<AuditoriaItem> = { datos: [], total: 0, pagina: 1, limite: 15, totalPaginas: 1 };
  pagina = 1;
  entidad = '';
  cargando = true;

  readonly entidades = [
    { valor: '', etiqueta: 'Todo' },
    { valor: 'producto', etiqueta: 'Productos' },
    { valor: 'categoria', etiqueta: 'Categorías' },
    { valor: 'proveedor', etiqueta: 'Proveedores' },
    { valor: 'usuario', etiqueta: 'Usuarios' },
  ];

  constructor(private admin: AdminService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.admin.auditoria(this.pagina, 15, this.entidad || undefined).subscribe({
      next: (r) => {
        this.resultado = r;
        this.cargando = false;
      },
      error: () => (this.cargando = false),
    });
  }

  filtrar(entidad: string): void {
    this.entidad = entidad;
    this.pagina = 1;
    this.cargar();
  }

  cambiarPagina(p: number): void {
    this.pagina = p;
    this.cargar();
  }
}
