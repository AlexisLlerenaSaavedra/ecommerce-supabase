// src/app/components/my-orders/my-orders.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { OrderService } from '../../services/order.service';
import { AuthService } from '../../services/auth.service';
import { Order } from '../../models/order.models';

@Component({
  selector: 'app-my-orders',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './my-orders.component.html',
  styleUrls: ['./my-orders.component.css']
})
export class MyOrdersComponent implements OnInit {
  orders: Order[] = [];
  isLoading = true;
  errorMessage = '';
  selectedOrder: Order | null = null;
  showOrderDetail = false;

  constructor(
    private orderService: OrderService,
    private authService: AuthService,
    private router: Router
  ) { }

  async ngOnInit() {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      // Si no está autenticado, redirigir al login
      this.router.navigate(['/login']);
      return;
    }

    await this.loadOrders(currentUser.id);
  }

  async loadOrders(userId: string) {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.orders = await this.orderService.getUserOrders(userId);

      if (this.orders.length === 0) {
        this.errorMessage = '';
      }
    } catch (error) {
      console.error('Error loading orders:', error);
      this.errorMessage = 'Error al cargar las órdenes. Intenta nuevamente.';
    }

    this.isLoading = false;
  }

  viewOrderDetail(order: Order) {
    this.selectedOrder = order;
    this.showOrderDetail = true;
  }

  closeOrderDetail() {
    this.showOrderDetail = false;
    this.selectedOrder = null;
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

  getEstimatedDelivery(orderDate: Date, status: string): string {
    if (status === 'delivered') return 'Entregado';
    if (status === 'cancelled') return 'Cancelado';

    const date = new Date(orderDate);
    date.setDate(date.getDate() + 7);
    return date.toLocaleDateString('es-AR');
  }

  downloadInvoice(order: Order) {
    const invoiceContent = this.generateInvoiceText(order);
    const blob = new Blob([invoiceContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `factura-${order.orderNumber}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private generateInvoiceText(order: Order): string {
    return `
FACTURA - ${order.orderNumber}
======================================

CLIENTE:
${order.customer.firstName} ${order.customer.lastName}
${order.customer.email}
${order.customer.phone}

DIRECCIÓN DE ENVÍO:
${order.shippingAddress.street}
${order.shippingAddress.city}, ${order.shippingAddress.state}
${order.shippingAddress.zipCode}
${order.shippingAddress.country}

PRODUCTOS:
======================================
${order.items.map(item =>
  `${item.productName} x${item.quantity} - $${(item.price * item.quantity).toFixed(2)}`
).join('\n')}

TOTALES:
======================================
Subtotal: $${order.subtotal.toFixed(2)}
Envío: $${order.shipping.toFixed(2)}
Impuestos: $${order.tax.toFixed(2)}
TOTAL: $${order.total.toFixed(2)}

Fecha: ${new Date(order.createdAt).toLocaleDateString('es-AR')}
Estado: ${this.getStatusText(order.status)}

¡Gracias por tu compra!
    `.trim();
  }

  continueShopping() {
    this.router.navigate(['/productos']);
  }

  goToHome() {
    this.router.navigate(['/']);
  }
}
