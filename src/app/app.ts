import { Component, inject, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ToastModule } from 'primeng/toast';
import { MessageService } from 'primeng/api';
import { ToastService } from './core/services';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ToastModule],
  template: `
    <p-toast position="top-right" />
    <router-outlet />
  `,
  styles: ``
})
export class App implements OnInit {
  private readonly messageService = inject(MessageService);
  private readonly toastService = inject(ToastService);

  ngOnInit(): void {
    this.toastService.setMessageService(this.messageService);
  }
}
