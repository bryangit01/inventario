// =====================================================================
//  UsuariosComponent  →  Gestión de usuarios y roles (solo administradores)
// =====================================================================
import { Component, OnInit } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule, NgForm } from '@angular/forms';
import { AuthService } from '../../core/auth.service';
import { Rol, Usuario } from '../../models/api.models';
import { AdminService } from '../../services/admin.service';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-usuarios',
  standalone: true,
  imports: [FormsModule, DatePipe],
  template: `
    <section class="encabezado">
      <div>
        <h1>Usuarios</h1>
        <p class="subtitulo">Administrador: todo. Almacenista: crea y edita. Lector: solo consulta.</p>
      </div>
      <button type="button" class="btn btn-primario" (click)="abrirCrear()">Nuevo usuario</button>
    </section>

    @if (cargando) {
      <div class="estado-vacio">Cargando usuarios...</div>
    } @else {
      <div class="tabla-caja">
        <table class="tabla">
          <thead>
            <tr><th>Usuario</th><th>Rol</th><th>Estado</th><th>Creado</th><th class="col-acciones">Acciones</th></tr>
          </thead>
          <tbody>
            @for (u of usuarios; track u.id) {
              <tr [class.fila-inactiva]="!u.activo">
                <td>
                  <div class="producto-nombre">{{ u.nombre }} @if (esYo(u)) { <span class="mini">(tú)</span> }</div>
                  <div class="producto-desc">{{ u.email }}</div>
                </td>
                <td>
                  <select class="selector" [ngModel]="u.rol" (ngModelChange)="cambiarRol(u, $event)" [disabled]="esYo(u)" [attr.aria-label]="'Rol de ' + u.nombre">
                    @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
                  </select>
                </td>
                <td>
                  <label class="interruptor-fila">
                    <input type="checkbox" class="interruptor" [checked]="u.activo" [disabled]="esYo(u)" (change)="alternarActivo(u)" [attr.aria-label]="'Activar o desactivar a ' + u.nombre" />
                    <span>{{ u.activo ? 'Activo' : 'Inactivo' }}</span>
                  </label>
                </td>
                <td class="nowrap">{{ u.creado_en | date: 'dd/MM/yyyy' }}</td>
                <td class="col-acciones">
                  <button type="button" class="btn btn-suave btn-chico" (click)="abrirClave(u)">Cambiar contraseña</button>
                </td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    }

    @if (mostrarCrear) {
      <div class="fondo-modal" (click)="mostrarCrear = false">
        <form class="modal" #f="ngForm" (ngSubmit)="crear(f)" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <h2>Nuevo usuario</h2>
          <label class="campo"><span>Nombre</span><input type="text" name="nombre" [(ngModel)]="nuevo.nombre" required minlength="2" /></label>
          <label class="campo"><span>Correo</span><input type="email" name="email" [(ngModel)]="nuevo.email" required email /></label>
          <label class="campo"><span>Contraseña (mínimo 8 caracteres)</span><input type="password" name="password" [(ngModel)]="nuevo.password" required minlength="8" autocomplete="new-password" /></label>
          <label class="campo">
            <span>Rol</span>
            <select class="selector selector-ancho" name="rol" [(ngModel)]="nuevo.rol">
              @for (r of roles; track r) { <option [value]="r">{{ r }}</option> }
            </select>
          </label>
          <div class="modal-acciones">
            <button type="button" class="btn btn-suave" (click)="mostrarCrear = false">Cancelar</button>
            <button type="submit" class="btn btn-primario">Crear usuario</button>
          </div>
        </form>
      </div>
    }

    @if (usuarioClave) {
      <div class="fondo-modal" (click)="usuarioClave = null">
        <form class="modal modal-chico" #g="ngForm" (ngSubmit)="guardarClave(g)" (click)="$event.stopPropagation()" role="dialog" aria-modal="true">
          <h2>Nueva contraseña</h2>
          <p class="subtitulo">Para {{ usuarioClave.nombre }}</p>
          <label class="campo"><span>Contraseña (mínimo 8 caracteres)</span><input type="password" name="clave" [(ngModel)]="nuevaClave" required minlength="8" autocomplete="new-password" /></label>
          <div class="modal-acciones">
            <button type="button" class="btn btn-suave" (click)="usuarioClave = null">Cancelar</button>
            <button type="submit" class="btn btn-primario">Guardar</button>
          </div>
        </form>
      </div>
    }
  `,
})
export class UsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  cargando = true;
  readonly roles: Rol[] = ['admin', 'almacenista', 'lector'];

  mostrarCrear = false;
  nuevo: { nombre: string; email: string; password: string; rol: Rol } = { nombre: '', email: '', password: '', rol: 'lector' };

  usuarioClave: Usuario | null = null;
  nuevaClave = '';

  constructor(
    private admin: AdminService,
    private auth: AuthService,
    private toast: ToastService
  ) {}

  ngOnInit(): void {
    this.cargar();
  }

  esYo(u: Usuario): boolean {
    return u.id === this.auth.usuario?.id;
  }

  cargar(): void {
    this.admin.usuarios().subscribe({
      next: (u) => {
        this.usuarios = u;
        this.cargando = false;
      },
      error: () => (this.cargando = false),
    });
  }

  abrirCrear(): void {
    this.nuevo = { nombre: '', email: '', password: '', rol: 'lector' };
    this.mostrarCrear = true;
  }

  crear(f: NgForm): void {
    if (f.invalid) {
      f.control.markAllAsTouched();
      this.toast.error('Revisa los datos: todos son obligatorios y la contraseña necesita 8 caracteres.');
      return;
    }
    this.admin.crearUsuario(this.nuevo).subscribe({
      next: (u) => {
        this.usuarios = [...this.usuarios, u];
        this.mostrarCrear = false;
        this.toast.exito('Usuario creado.');
      },
      error: (e) => this.toast.errorHttp(e, 'No se pudo crear el usuario.'),
    });
  }

  cambiarRol(u: Usuario, rol: Rol): void {
    this.actualizar(u, { rol }, 'Rol actualizado.');
  }

  alternarActivo(u: Usuario): void {
    this.actualizar(u, { activo: !u.activo }, u.activo ? 'Usuario desactivado.' : 'Usuario activado.');
  }

  abrirClave(u: Usuario): void {
    this.usuarioClave = u;
    this.nuevaClave = '';
  }

  guardarClave(f: NgForm): void {
    if (f.invalid || !this.usuarioClave) {
      this.toast.error('La contraseña necesita al menos 8 caracteres.');
      return;
    }
    this.actualizar(this.usuarioClave, { password: this.nuevaClave }, 'Contraseña cambiada.');
    this.usuarioClave = null;
  }

  private actualizar(u: Usuario, cambios: Partial<{ rol: Rol; activo: boolean; password: string }>, mensaje: string): void {
    this.admin.actualizarUsuario(u.id, cambios).subscribe({
      next: (actualizado) => {
        this.usuarios = this.usuarios.map((x) => (x.id === actualizado.id ? actualizado : x));
        this.toast.exito(mensaje);
      },
      error: (e) => {
        this.toast.errorHttp(e, 'No se pudo actualizar el usuario.');
        this.cargar(); // devuelve el control a su valor real
      },
    });
  }
}
