// src/app/components/order-confirmation/order-confirmation.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Order } from '../../models/order.models';

@Component({
  selector: 'app-order-confirmation',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-confirmation.component.html',
  styleUrls: ['./order-confirmation.component.css']
})
export class OrderConfirmationComponent implements OnInit {
  order: Order | null = null;
  estimatedDelivery: Date;

  constructor(private router: Router) {
    // Calcular fecha estimada de entrega (5-7 días hábiles)
    this.estimatedDelivery = new Date();
    this.estimatedDelivery.setDate(this.estimatedDelivery.getDate() + 7);
  }

  ngOnInit() {
    // Obtener la orden desde el estado de navegación
    const navigation = this.router.getCurrentNavigation();
    if (navigation?.extras.state) {
      this.order = navigation.extras.state['order'];
    }

    // Si no hay orden, intentar obtenerla desde history.state
    if (!this.order && history.state.order) {
      this.order = history.state.order;
    }

    // Si aún no hay orden, redirigir al inicio
    if (!this.order) {
      this.router.navigate(['/productos']);
    }
  }

  continueShopping() {
    this.router.navigate(['/productos']);
  }

  viewOrderDetails() {
    // En el futuro esto llevará a una página de detalles de orden
    alert('Función de detalles de orden - próximamente');
  }

  downloadInvoice() {
    if (!this.order) return;

    // Simular descarga de factura
    const invoiceContent = this.generateInvoiceText();
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factura-${this.order.orderNumber}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private generateInvoiceText(): string {
    if (!this.order) return '';

    return `
FACTURA - ${this.order.orderNumber}
======================================

CLIENTE:
${this.order.customer.firstName} ${this.order.customer.lastName}
${this.order.customer.email}
${this.order.customer.phone}

DIRECCIÓN DE ENVÍO:
${this.order.shippingAddress.street}
${this.order.shippingAddress.city}, ${this.order.shippingAddress.state}
${this.order.shippingAddress.zipCode}
${this.order.shippingAddress.country}

PRODUCTOS:
======================================
${this.order.items.map(item =>
  `${item.productName} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
).join('\n')}

TOTALES:
======================================
Subtotal: $${this.order.subtotal.toFixed(2)}
Envío: $${this.order.shipping.toFixed(2)}
Impuestos: $${this.order.tax.toFixed(2)}
TOTAL: $${this.order.total.toFixed(2)}

Fecha: ${new Date(this.order.createdAt).toLocaleDateString()}
Estado: ${this.order.status}

¡Gracias por tu compra!
    `;
  }

  getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'pending': 'Pendiente',
      'confirmed': 'Confirmado',
      'shipped': 'Enviado',
      'delivered': 'Entregado',
      'cancelled': 'Cancelado'
    };
    return statusMap[status] || status;
  }

  getStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'pending': 'status-pending',
      'confirmed': 'status-confirmed',
      'shipped': 'status-shipped',
      'delivered': 'status-delivered',
      'cancelled': 'status-cancelled'
    };
    return statusClasses[status] || 'status-pending';
  }
}
