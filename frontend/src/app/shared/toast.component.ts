// ToastComponent → dibuja los avisos que guarda ToastService.
import { Component } from '@angular/core';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  template: `
    <div class="toasts" aria-live="polite">
      @for (t of toast.toasts; track t.id) {
        <div class="toast" [class.toast-error]="t.tipo === 'error'" role="status">
          <span>{{ t.mensaje }}</span>
          <button type="button" class="toast-cerrar" (click)="toast.cerrar(t.id)" aria-label="Cerrar aviso">×</button>
        </div>
      }
    </div>
  `,
})
export class ToastComponent {
  constructor(public toast: ToastService) {}
}
