// src/app/admin/admin-orders/admin-orders.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { Order } from '../../models/order.models';

@Component({
  selector: 'app-admin-orders',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-orders.component.html',
  styleUrls: ['./admin-orders.component.css']
})
export class AdminOrdersComponent implements OnInit {
  orders: Order[] = [];
  filteredOrders: Order[] = [];
  isLoading = true;
  errorMessage = '';
  successMessage = '';

  // Filtros
  selectedStatus: string = 'all';
  searchTerm = '';
  dateFrom = '';
  dateTo = '';

  // Modal de detalles
  selectedOrder: Order | null = null;
  showOrderDetail = false;

  // Modal de cambio de estado
  showStatusModal = false;
  orderToUpdate: Order | null = null;
  newStatus: string = '';

  statusOptions = [
    { value: 'pending', label: 'Pendiente', color: '#92400e' },
    { value: 'confirmed', label: 'Confirmado', color: '#1e40af' },
    { value: 'shipped', label: 'Enviado', color: '#3730a3' },
    { value: 'delivered', label: 'Entregado', color: '#166534' },
    { value: 'cancelled', label: 'Cancelado', color: '#991b1b' }
  ];

  constructor(
    private adminService: AdminService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadOrders();
  }

  async loadOrders() {
    this.isLoading = true;
    this.errorMessage = '';

    try {
      this.orders = await this.adminService.getAllOrders();
      this.applyFilters();
    } catch (error) {
      console.error('Error loading orders:', error);
      this.errorMessage = 'Error al cargar las órdenes';
    }

    this.isLoading = false;
  }

  applyFilters() {
    let filtered = [...this.orders];

    // Filtrar por estado
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(order => order.status === this.selectedStatus);
    }

    // Filtrar por búsqueda (número de orden, email, nombre)
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(order =>
        order.orderNumber.toLowerCase().includes(term) ||
        order.customer.email.toLowerCase().includes(term) ||
        `${order.customer.firstName} ${order.customer.lastName}`.toLowerCase().includes(term)
      );
    }

    // Filtrar por rango de fechas
    if (this.dateFrom) {
      const fromDate = new Date(this.dateFrom);
      filtered = filtered.filter(order => new Date(order.createdAt) >= fromDate);
    }

    if (this.dateTo) {
      const toDate = new Date(this.dateTo);
      toDate.setHours(23, 59, 59, 999);
      filtered = filtered.filter(order => new Date(order.createdAt) <= toDate);
    }

    this.filteredOrders = filtered;
  }

  onFilterChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.selectedStatus = 'all';
    this.searchTerm = '';
    this.dateFrom = '';
    this.dateTo = '';
    this.applyFilters();
  }

  viewOrderDetail(order: Order) {
    this.selectedOrder = order;
    this.showOrderDetail = true;
  }

  closeOrderDetail() {
    this.showOrderDetail = false;
    this.selectedOrder = null;
  }

  openStatusModal(order: Order) {
    this.orderToUpdate = order;
    this.newStatus = order.status;
    this.showStatusModal = true;
  }

  closeStatusModal() {
    this.showStatusModal = false;
    this.orderToUpdate = null;
    this.newStatus = '';
  }

  async updateOrderStatus() {
    if (!this.orderToUpdate) return;

    try {
      const result = await this.adminService.updateOrderStatus(
        this.orderToUpdate.id!,
        this.newStatus as any
      );

      if (result.success) {
        this.successMessage = 'Estado actualizado correctamente';
        await this.loadOrders();
        this.closeStatusModal();
        setTimeout(() => this.successMessage = '', 3000);
      } else {
        this.errorMessage = result.error || 'Error al actualizar estado';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    } catch (error) {
      console.error('Error updating order status:', error);
      this.errorMessage = 'Error al actualizar el estado';
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }

  getStatusText(status: string): string {
    const option = this.statusOptions.find(s => s.value === status);
    return option ? option.label : status;
  }

  getStatusClass(status: string): string {
    return `status-${status}`;
  }

  getTotalRevenue(): number {
    return this.filteredOrders.reduce((sum, order) => sum + order.total, 0);
  }

  getOrdersByStatus(status: string): number {
    return this.orders.filter(order => order.status === status).length;
  }

  goBackToDashboard() {
    this.router.navigate(['/admin']);
  }

  downloadOrderReport() {
    const reportContent = this.generateReportText();
    const blob = new Blob([reportContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-ordenes-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    window.URL.revokeObjectURL(url);
  }

  private generateReportText(): string {
    return `
REPORTE DE ÓRDENES
======================================
Fecha de generación: ${new Date().toLocaleDateString('es-AR')}
Total de órdenes: ${this.filteredOrders.length}
Ingresos totales: $${this.getTotalRevenue().toFixed(2)}

POR ESTADO:
--------------------------------------
Pendientes: ${this.getOrdersByStatus('pending')}
Confirmadas: ${this.getOrdersByStatus('confirmed')}
Enviadas: ${this.getOrdersByStatus('shipped')}
Entregadas: ${this.getOrdersByStatus('delivered')}
Canceladas: ${this.getOrdersByStatus('cancelled')}

DETALLE DE ÓRDENES:
======================================
${this.filteredOrders.map(order => `
Orden: ${order.orderNumber}
Cliente: ${order.customer.firstName} ${order.customer.lastName}
Email: ${order.customer.email}
Total: $${order.total.toFixed(2)}
Estado: ${this.getStatusText(order.status)}
Fecha: ${new Date(order.createdAt).toLocaleDateString('es-AR')}
---
`).join('\n')}
    `.trim();
  }
}
