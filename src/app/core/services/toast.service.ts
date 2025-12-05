import { Injectable, signal } from '@angular/core';
import { MessageService } from 'primeng/api';

export type ToastSeverity = 'success' | 'info' | 'warn' | 'error';

export interface ToastMessage {
  severity: ToastSeverity;
  summary: string;
  detail: string;
  life?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private messageService: MessageService | null = null;

  setMessageService(messageService: MessageService): void {
    this.messageService = messageService;
  }

  show(severity: ToastSeverity, summary: string, detail: string, life: number = 3000): void {
    if (this.messageService) {
      this.messageService.add({ severity, summary, detail, life });
    }
  }

  success(detail: string, summary: string = 'Éxito'): void {
    this.show('success', summary, detail);
  }

  error(detail: string, summary: string = 'Error'): void {
    this.show('error', summary, detail, 5000);
  }

  warn(detail: string, summary: string = 'Advertencia'): void {
    this.show('warn', summary, detail, 4000);
  }

  info(detail: string, summary: string = 'Información'): void {
    this.show('info', summary, detail);
  }

  clear(): void {
    if (this.messageService) {
      this.messageService.clear();
    }
  }
}
