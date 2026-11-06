// =====================================================================
//  ProductosComponent  →  La pantalla principal de productos
// =====================================================================
//  Novedades v2:
//   - Paginación, orden y filtros se piden al SERVIDOR (escala a miles de productos).
//   - Los botones +/- y "Mover stock" registran movimientos en el kardex.
//   - Importar desde CSV, exportar a Excel y papelera (borrado lógico).
//   - Botones y acciones según el rol del usuario.
//
//  Flujo: clic → método de este componente → servicio → API → MySQL →
//  respuesta → actualizamos la pantalla y mostramos un aviso (toast).
// =====================================================================
import { Component, OnInit } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../core/auth.service';
import { Catalogo, Pagina } from '../../models/api.models';
import { FiltrosProducto, Producto, ResultadoImportacion } from '../../models/producto.model';
import { CatalogoService } from '../../services/catalogo.service';
import { MovimientoService } from '../../services/movimiento.service';
import { ProductoService } from '../../services/producto.service';
import { ToastService } from '../../services/toast.service';
import { csvAFilas } from '../../utils/csv';
import { descargarBlob } from '../../utils/descarga';
import { ConfirmarComponent } from '../../shared/confirmar.component';
import { PaginadorComponent } from '../../shared/paginador.component';
import { MovimientosComponent } from '../movimientos/movimientos.component';
import { MovimientoModalComponent } from './movimiento-modal.component';
import { ProductoFormComponent } from './producto-form.component';

type NivelStock = 'agotado' | 'bajo' | 'ok';

@Component({
  selector: 'app-productos',
  standalone: true,
  imports: [
    FormsModule, CurrencyPipe, PaginadorComponent, ConfirmarComponent,
    ProductoFormComponent, MovimientoModalComponent, MovimientosComponent,
  ],
  templateUrl: './productos.component.html',
})
export class ProductosComponent implements OnInit {
  // ---------- Estado de la pantalla ----------
  filtros: FiltrosProducto = {
    pagina: 1, limite: 10, buscar: '', estado: 'todos',
    categoria_id: null, proveedor_id: null, orden: 'creado_en', dir: 'desc',
  };
  resultado: Pagina<Producto> = { datos: [], total: 0, pagina: 1, limite: 10, totalPaginas: 1 };
  categorias: Catalogo[] = [];
  proveedores: Catalogo[] = [];
  cargando = true;
  errorCarga = '';
  moneda = environment.moneda;

  /** Cada tecleo del buscador pasa por aquí; esperamos 300 ms antes de consultar. */
  busqueda$ = new Subject<string>();

  readonly estados = [
    { valor: 'todos', etiqueta: 'Todos' },
    { valor: 'activos', etiqueta: 'Activos' },
    { valor: 'inactivos', etiqueta: 'Inactivos' },
    { valor: 'stock_bajo', etiqueta: 'Stock bajo' },
  ];

  // ---------- Ventanas abiertas ----------
  mostrarForm = false;
  productoEditando: Producto | null = null;
  productoMover: Producto | null = null;
  productoHistorial: Producto | null = null;
  productoAEliminar: Producto | null = null;
  resultadoImport: ResultadoImportacion | null = null;

  constructor(
    private api: ProductoService,
    private catalogos: CatalogoService,
    private movimientos: MovimientoService,
    private toast: ToastService,
    public auth: AuthService
  ) {
    this.busqueda$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed())
      .subscribe((texto) => {
        this.filtros.buscar = texto;
        this.filtros.pagina = 1;
        this.cargar();
      });
  }

  ngOnInit(): void {
    this.catalogos.listar('categorias').subscribe((c) => (this.categorias = c));
    this.catalogos.listar('proveedores').subscribe((p) => (this.proveedores = p));
    this.cargar();
  }

  // ---------- Datos calculados ----------
  /** El administrador ve además la papelera. */
  get estadosVisibles() {
    return this.auth.esAdmin ? [...this.estados, { valor: 'papelera', etiqueta: 'Papelera' }] : this.estados;
  }
  get enPapelera(): boolean {
    return this.filtros.estado === 'papelera';
  }
  private get cantidadMaxima(): number {
    return Math.max(1, ...this.resultado.datos.map((p) => p.cantidad));
  }
  porcentaje(p: Producto): number {
    return Math.round((p.cantidad / this.cantidadMaxima) * 100);
  }
  nivel(p: Producto): NivelStock {
    if (p.cantidad === 0) return 'agotado';
    return p.cantidad <= p.stock_minimo ? 'bajo' : 'ok';
  }
  etiquetaNivel(p: Producto): string {
    const n = this.nivel(p);
    return n === 'agotado' ? 'Agotado' : n === 'bajo' ? 'Stock bajo' : 'Disponible';
  }

  // ---------- Cargar (READ) ----------
  cargar(): void {
    this.cargando = true;
    this.errorCarga = '';
    this.api.listar(this.filtros).subscribe({
      next: (r) => {
        this.resultado = r;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.errorCarga = 'No pudimos conectar con el servidor. Revisa que el backend esté encendido en el puerto 3000.';
      },
    });
  }

  // ---------- Filtros, orden y páginas ----------
  setEstado(valor: string): void {
    this.filtros.estado = valor;
    this.aplicarFiltros();
  }
  aplicarFiltros(): void {
    this.filtros.pagina = 1;
    this.cargar();
  }
  cambiarPagina(pagina: number): void {
    this.filtros.pagina = pagina;
    this.cargar();
  }
  ordenar(columna: string): void {
    if (this.filtros.orden === columna) this.filtros.dir = this.filtros.dir === 'asc' ? 'desc' : 'asc';
    else {
      this.filtros.orden = columna;
      this.filtros.dir = 'asc';
    }
    this.cargar();
  }
  flecha(columna: string): string {
    if (this.filtros.orden !== columna) return '';
    return this.filtros.dir === 'asc' ? '▲' : '▼';
  }
  quitarFiltros(): void {
    this.filtros = { ...this.filtros, buscar: '', estado: 'todos', categoria_id: null, proveedor_id: null, pagina: 1 };
    this.cargar();
  }
  get hayFiltros(): boolean {
    const f = this.filtros;
    return !!(f.buscar || f.categoria_id || f.proveedor_id || f.estado !== 'todos');
  }

  // ---------- Crear / editar ----------
  nuevo(): void {
    this.productoEditando = null;
    this.mostrarForm = true;
  }
  editar(p: Producto): void {
    this.productoEditando = p;
    this.mostrarForm = true;
  }
  cerrarForm(): void {
    this.mostrarForm = false;
    this.productoEditando = null;
  }

  guardar(datos: Producto): void {
    if (datos.id) {
      this.api.actualizar(datos.id, datos).subscribe({
        next: (actualizado) => {
          this.reemplazar(actualizado);
          this.cerrarForm();
          this.toast.exito('Cambios guardados.');
        },
        error: (e) => this.toast.errorHttp(e, 'No se pudo guardar el producto.'),
      });
    } else {
      this.api.crear(datos).subscribe({
        next: () => {
          this.cerrarForm();
          this.toast.exito('Producto creado.');
          this.cargar(); // recargamos: el orden y las páginas las decide el servidor
        },
        error: (e) => this.toast.errorHttp(e, 'No se pudo crear el producto.'),
      });
    }
  }

  // ---------- Acciones rápidas ----------
  alternarEstado(p: Producto): void {
    this.api.cambiarEstado(p.id!, !p.activo).subscribe({
      next: (actualizado) => {
        this.reemplazar(actualizado);
        this.toast.exito(actualizado.activo ? 'Producto activado.' : 'Producto desactivado.');
      },
      error: (e) => {
        this.toast.errorHttp(e, 'No se pudo cambiar el estado.');
        this.cargar();
      },
    });
  }

  /** Botones + y −: registran un movimiento de 1 unidad en el kardex. */
  ajusteRapido(p: Producto, delta: number): void {
    this.movimientos
      .registrar({
        producto_id: p.id!,
        tipo: delta > 0 ? 'entrada' : 'salida',
        cantidad: Math.abs(delta),
        motivo: 'Ajuste rápido',
      })
      .subscribe({
        next: (r) => this.reemplazar(r.producto),
        error: (e) => this.toast.errorHttp(e, 'No se pudo actualizar la cantidad.'),
      });
  }

  movimientoRegistrado(producto: Producto): void {
    this.reemplazar(producto);
    this.productoMover = null;
  }

  // ---------- Eliminar (a la papelera) y restaurar ----------
  confirmarEliminar(): void {
    const p = this.productoAEliminar;
    if (!p) return;
    this.api.eliminar(p.id!).subscribe({
      next: () => {
        this.productoAEliminar = null;
        this.toast.exito('Producto enviado a la papelera.');
        this.cargar();
      },
      error: (e) => {
        this.productoAEliminar = null;
        this.toast.errorHttp(e, 'No se pudo eliminar el producto.');
      },
    });
  }

  restaurar(p: Producto): void {
    this.api.restaurar(p.id!).subscribe({
      next: () => {
        this.toast.exito('Producto restaurado.');
        this.cargar();
      },
      error: (e) => this.toast.errorHttp(e, 'No se pudo restaurar el producto.'),
    });
  }

  // ---------- Exportar / importar ----------
  exportar(): void {
    this.api.exportar().subscribe({
      next: (blob) => descargarBlob(blob, 'inventario.xlsx'),
      error: () => this.toast.error('No se pudo exportar el inventario.'),
    });
  }

  importar(evento: Event): void {
    const input = evento.target as HTMLInputElement;
    const archivo = input.files?.[0];
    input.value = ''; // permite elegir el mismo archivo otra vez
    if (!archivo) return;

    archivo.text().then((texto) => {
      const filas = csvAFilas(texto);
      if (filas.length === 0) {
        this.toast.error('El archivo está vacío o no tiene el formato esperado.');
        return;
      }
      this.api.importar(filas).subscribe({
        next: (r) => {
          this.resultadoImport = r;
          this.cargar();
        },
        error: (e) => this.toast.errorHttp(e, 'No se pudo importar el archivo.'),
      });
    });
  }

  descargarPlantilla(): void {
    const csv =
      'sku,nombre,descripcion,categoria,proveedor,cantidad,stock_minimo,precio_costo,precio_venta\n' +
      'TEC-100,Teclado compacto,Layout español,Periféricos,TecnoMayorista,10,5,30,59.90\n';
    // El \ufeff al inicio hace que Excel respete las tildes.
    descargarBlob(new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' }), 'plantilla-productos.csv');
  }

  /** Cambia un producto de la lista por su versión actualizada. */
  private reemplazar(actualizado: Producto): void {
    this.resultado = {
      ...this.resultado,
      datos: this.resultado.datos.map((x) => (x.id === actualizado.id ? actualizado : x)),
    };
  }
}
