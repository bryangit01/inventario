// ToastService → avisos flotantes ("Producto guardado", errores...).
import { Injectable } from '@angular/core';

export interface Toast {
  id: number;
  mensaje: string;
  tipo: 'exito' | 'error';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts: Toast[] = [];
  private siguienteId = 1;

  exito(mensaje: string): void {
    this.mostrar(mensaje, 'exito');
  }
  error(mensaje: string): void {
    this.mostrar(mensaje, 'error');
  }
  cerrar(id: number): void {
    this.toasts = this.toasts.filter((t) => t.id !== id);
  }

  /** Extrae el mensaje que mandó el backend (o usa uno por defecto). */
  errorHttp(e: { error?: { mensaje?: string } }, porDefecto: string): void {
    this.error(e?.error?.mensaje ?? porDefecto);
  }

  private mostrar(mensaje: string, tipo: Toast['tipo']): void {
    const id = this.siguienteId++;
    this.toasts = [...this.toasts, { id, mensaje, tipo }];
    setTimeout(() => this.cerrar(id), 4000);
  }
}
