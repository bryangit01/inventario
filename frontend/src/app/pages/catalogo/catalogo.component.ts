// =====================================================================
//  CatalogoComponent  →  UNA pantalla para categorías y proveedores
// =====================================================================
//  Lee de la ruta qué catálogo mostrar (data: { recurso: ... } en
//  app.routes.ts) y se dibuja según la configuración CONFIGS.
//  Para agregar otro catálogo (marcas, bodegas...): agrega una entrada
//  aquí, una ruta y el recurso en el backend.
// =====================================================================
import { Component, OnInit } from '@angular/core';
import { FormsModule, NgForm } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/auth.service';
import { Catalogo } from '../../models/api.models';
import { CatalogoService, RecursoCatalogo } from '../../services/catalogo.service';
import { ToastService } from '../../services/toast.service';
import { ConfirmarComponent } from '../../shared/confirmar.component';

interface CampoCatalogo {
  clave: string;
  etiqueta: string;
  tipo: 'text' | 'email';
  requerido?: boolean;
}
interface ConfigCatalogo {
  titulo: string;
  subtitulo: string;
  singular: string;
  campos: CampoCatalogo[];
}

const CONFIGS: Record<RecursoCatalogo, ConfigCatalogo> = {
  categorias: {
    titulo: 'Categorías',
    subtitulo: 'Agrupa tus productos para encontrarlos y analizarlos más fácil.',
    singular: 'categoría',
    campos: [
      { clave: 'nombre', etiqueta: 'Nombre', tipo: 'text', requerido: true },
      { clave: 'descripcion', etiqueta: 'Descripción', tipo: 'text' },
    ],
  },
  proveedores: {
    titulo: 'Proveedores',
    subtitulo: 'Empresas a las que les compras tus productos.',
    singular: 'proveedor',
    campos: [
      { clave: 'nombre', etiqueta: 'Nombre', tipo: 'text', requerido: true },
      { clave: 'contacto', etiqueta: 'Contacto', tipo: 'text' },
      { clave: 'email', etiqueta: 'Correo', tipo: 'email' },
      { clave: 'telefono', etiqueta: 'Teléfono', tipo: 'text' },
    ],
  },
};

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [FormsModule, ConfirmarComponent],
  template: `
    <section class="encabezado">
      <div>
        <h1>{{ config.titulo }}</h1>
        <p class="subtitulo">{{ config.subtitulo }}</p>
      </div>
      @if (auth.puedeEscribir) {
        <button type="button" class="btn btn-primario" (click)="nuevo()">Nueva {{ config.singular }}</button>
      }
    </section>

    @if (cargando) {
      <div class="estado-vacio">Cargando...</div>
    } @else if (items.length === 0) {
      <div class="estado-vacio">
        <p>Todavía no hay registros.</p>
        @if (auth.puedeEscribir) { <button type="button" class="btn btn-primario" (click)="nuevo()">Crear el primero</button> }
      </div>
    } @else {
      <div class="tabla-caja">
        <table class="tabla">
          <thead>
            <tr>
              @for (c of config.campos; track c.clave) { <th>{{ c.etiqueta }}</th> }
              @if (auth.puedeEscribir) { <th class="col-acciones">Acciones</th> }
            </tr>
          </thead>
          <tbody>
            @for (item of items; track item.id) {
              <tr>
                @for (c of config.campos; track c.clave) {
                  <td [class.producto-nombre]="c.clave === 'nombre'">{{ item[c.clave] }}</td>
                }
                @if (auth.puedeEscribir) {
                  <td class="col-acciones">
                    <button type="button" class="btn btn-suave btn-chico" (click)="editar(item)">Editar</button>
                    @if (auth.esAdmin) {
                      <button type="button" class="btn btn-peligro btn-chico" (click)="aEliminar = item">Eliminar</button>
                    }
                  </td>
                }
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (mostrarForm) {
      <div class="fondo-modal" (click)="mostrarForm = false">
        <form class="modal" #f="ngForm" (ngSubmit)="guardar(f)" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <h2>{{ editando ? 'Editar' : 'Nueva' }} {{ config.singular }}</h2>
          @for (c of config.campos; track c.clave) {
            <label class="campo">
              <span>{{ c.etiqueta }}</span>
              <input [type]="c.tipo" [name]="c.clave" [(ngModel)]="datos[c.clave]" [required]="!!c.requerido" />
            </label>
          }
          <div class="modal-acciones">
            <button type="button" class="btn btn-suave" (click)="mostrarForm = false">Cancelar</button>
            <button type="submit" class="btn btn-primario">Guardar</button>
          </div>
        </form>
      </div>
    }

    @if (aEliminar) {
      <app-confirmar
        [titulo]="'¿Eliminar &quot;' + aEliminar.nombre + '&quot;?'"
        mensaje="Los productos que la usan quedarán sin asignar. No se puede deshacer."
        boton="Eliminar"
        (confirmar)="eliminar()"
        (cancelar)="aEliminar = null"
      />
    }
  `,
})
export class CatalogoComponent implements OnInit {
  recurso: RecursoCatalogo = 'categorias';
  config: ConfigCatalogo = CONFIGS.categorias;
  items: Catalogo[] = [];
  cargando = true;

  mostrarForm = false;
  editando: Catalogo | null = null;
  datos: Catalogo = { nombre: '' };
  aEliminar: Catalogo | null = null;

  constructor(
    private route: ActivatedRoute,
    private api: CatalogoService,
    private toast: ToastService,
    public auth: AuthService
  ) {}

  ngOnInit(): void {
    this.recurso = this.route.snapshot.data['recurso'];
    this.config = CONFIGS[this.recurso];
    this.cargar();
  }

  cargar(): void {
    this.api.listar(this.recurso).subscribe({
      next: (items) => {
        this.items = items;
        this.cargando = false;
      },
      error: () => {
        this.cargando = false;
        this.toast.error('No se pudo cargar la lista.');
      },
    });
  }

  nuevo(): void {
    this.editando = null;
    this.datos = { nombre: '' };
    this.mostrarForm = true;
  }

  editar(item: Catalogo): void {
    this.editando = item;
    this.datos = { ...item };
    this.mostrarForm = true;
  }

  guardar(f: NgForm): void {
    if (f.invalid) {
      f.control.markAllAsTouched();
      this.toast.error('Completa los campos obligatorios.');
      return;
    }
    const peticion = this.editando?.id
      ? this.api.actualizar(this.recurso, this.editando.id, this.datos)
      : this.api.crear(this.recurso, this.datos);
    peticion.subscribe({
      next: () => {
        this.mostrarForm = false;
        this.toast.exito('Guardado.');
        this.cargar();
      },
      error: (e) => this.toast.errorHttp(e, 'No se pudo guardar.'),
    });
  }

  eliminar(): void {
    const item = this.aEliminar;
    if (!item?.id) return;
    this.api.eliminar(this.recurso, item.id).subscribe({
      next: () => {
        this.aEliminar = null;
        this.toast.exito('Eliminado.');
        this.cargar();
      },
      error: (e) => {
        this.aEliminar = null;
        this.toast.errorHttp(e, 'No se pudo eliminar.');
      },
    });
  }
}
