// src/app/services/order.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CartService, CartItem } from './cart.service';
import { Order, Customer, ShippingAddress, OrderItem } from '../models/order.models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(
    private supabaseService: SupabaseService,
    private cartService: CartService
  ) { }

  generateOrderNumber(): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    return `ORD-${timestamp}-${random}`;
  }

  calculateShipping(subtotal: number, country: string = 'AR'): number {
    // Envío gratis para compras mayores a $100
    if (subtotal >= 100) return 0;

    // Tarifas por país (simulado)
    const shippingRates: { [key: string]: number } = {
      'AR': 15.00,
      'US': 25.00,
      'BR': 20.00,
      'UY': 18.00
    };

    return shippingRates[country] || 30.00;
  }

  calculateTax(subtotal: number, country: string = 'AR'): number {
    // IVA argentino 21%
    if (country === 'AR') {
      return subtotal * 0.21;
    }
    // Otros países 10%
    return subtotal * 0.10;
  }

  createOrderFromCart(customer: Customer, shippingAddress: ShippingAddress): Order {
    const cartItems = this.cartService.getCartItems();

    const orderItems: OrderItem[] = cartItems.map(item => ({
      productId: item.product.id,
      productName: item.product.name,
      price: item.product.price,
      quantity: item.quantity,
      imageUrl: item.product.image_url
    }));

    const subtotal = cartItems.reduce((sum, item) =>
      sum + (item.product.price * item.quantity), 0
    );

    const shipping = this.calculateShipping(subtotal, shippingAddress.country);
    const tax = this.calculateTax(subtotal, shippingAddress.country);
    const total = subtotal + shipping + tax;

    const order: Order = {
      orderNumber: this.generateOrderNumber(),
      customer,
      shippingAddress,
      items: orderItems,
      subtotal,
      shipping,
      tax,
      total,
      status: 'pending',
      createdAt: new Date()
    };

    return order;
  }

  async saveOrder(order: Order): Promise<boolean> {
    try {
      // En una implementación real, guardarías en Supabase
      // Por ahora solo simulamos el guardado
      console.log('Guardando orden:', order);

      // Simular delay de API
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Limpiar carrito después de confirmar orden
      this.cartService.clearCart();

      return true;
    } catch (error) {
      console.error('Error guardando orden:', error);
      return false;
    }
  }

  // Validaciones
  validateCustomer(customer: Customer): string[] {
    const errors: string[] = [];

    if (!customer.firstName.trim()) errors.push('Nombre es requerido');
    if (!customer.lastName.trim()) errors.push('Apellido es requerido');
    if (!customer.email.trim()) errors.push('Email es requerido');
    if (!this.isValidEmail(customer.email)) errors.push('Email inválido');
    if (!customer.phone.trim()) errors.push('Teléfono es requerido');

    return errors;
  }

  validateShippingAddress(address: ShippingAddress): string[] {
    const errors: string[] = [];

    if (!address.street.trim()) errors.push('Dirección es requerida');
    if (!address.city.trim()) errors.push('Ciudad es requerida');
    if (!address.state.trim()) errors.push('Provincia/Estado es requerido');
    if (!address.zipCode.trim()) errors.push('Código postal es requerido');
    if (!address.country.trim()) errors.push('País es requerido');

    return errors;
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
