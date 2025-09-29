// src/app/services/order.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService } from './supabase.service';
import { CartService, CartItem } from './cart.service';
import { AuthService } from './auth.service';
import { Order, Customer, ShippingAddress, OrderItem } from '../models/order.models';

@Injectable({
  providedIn: 'root'
})
export class OrderService {

  constructor(
    private supabaseService: SupabaseService,
    private cartService: CartService,
    private authService: AuthService
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
      'UY': 18.00,
      'CL': 20.00
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
      const currentUser = this.authService.getCurrentUser();

      // 1. Insertar la orden principal
      const { data: orderData, error: orderError } = await this.supabaseService.client
        .from('orders')
        .insert([{
          order_number: order.orderNumber,
          user_id: currentUser?.id || null,

          // Información del cliente
          customer_first_name: order.customer.firstName,
          customer_last_name: order.customer.lastName,
          customer_email: order.customer.email,
          customer_phone: order.customer.phone,

          // Dirección de envío
          shipping_street: order.shippingAddress.street,
          shipping_city: order.shippingAddress.city,
          shipping_state: order.shippingAddress.state,
          shipping_zip_code: order.shippingAddress.zipCode,
          shipping_country: order.shippingAddress.country,

          // Totales
          subtotal: order.subtotal,
          shipping: order.shipping,
          tax: order.tax,
          total: order.total,

          status: order.status
        }])
        .select()
        .single();

      if (orderError) {
        console.error('Error insertando orden:', orderError);
        throw orderError;
      }

      console.log('Orden creada:', orderData);

      // 2. Insertar los items de la orden
      const orderItems = order.items.map(item => ({
        order_id: orderData.id,
        product_id: item.productId,
        product_name: item.productName,
        price: item.price,
        quantity: item.quantity,
        image_url: item.imageUrl
      }));

      const { data: itemsData, error: itemsError } = await this.supabaseService.client
        .from('order_items')
        .insert(orderItems);

      if (itemsError) {
        console.error('Error insertando items de orden:', itemsError);
        throw itemsError;
      }

      console.log('Items de orden creados:', itemsData);

      // 3. Actualizar stock de productos (opcional pero recomendado)
      for (const item of order.items) {
        await this.updateProductStock(item.productId, item.quantity);
      }

      // 4. Limpiar carrito después de confirmar orden
      this.cartService.clearCart();

      // 5. Guardar ID de orden en la orden para referencia futura
      order.id = orderData.id;

      return true;
    } catch (error) {
      console.error('Error guardando orden:', error);
      return false;
    }
  }

  // Método auxiliar para actualizar el stock
  private async updateProductStock(productId: number, quantitySold: number): Promise<void> {
    try {
      // Obtener stock actual
      const { data: product, error: fetchError } = await this.supabaseService.client
        .from('products')
        .select('stock')
        .eq('id', productId)
        .single();

      if (fetchError) {
        console.error('Error obteniendo producto:', fetchError);
        return;
      }

      // Calcular nuevo stock
      const newStock = product.stock - quantitySold;

      // Actualizar stock
      const { error: updateError } = await this.supabaseService.client
        .from('products')
        .update({ stock: newStock })
        .eq('id', productId);

      if (updateError) {
        console.error('Error actualizando stock:', updateError);
      } else {
        console.log(`Stock actualizado para producto ${productId}: ${newStock}`);
      }
    } catch (error) {
      console.error('Error en updateProductStock:', error);
    }
  }

  // Método para obtener órdenes de un usuario
  async getUserOrders(userId: string): Promise<Order[]> {
    try {
      const { data: orders, error } = await this.supabaseService.client
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transformar datos de BD al formato Order
      return orders.map(order => ({
        id: order.id,
        orderNumber: order.order_number,
        customer: {
          firstName: order.customer_first_name,
          lastName: order.customer_last_name,
          email: order.customer_email,
          phone: order.customer_phone
        },
        shippingAddress: {
          street: order.shipping_street,
          city: order.shipping_city,
          state: order.shipping_state,
          zipCode: order.shipping_zip_code,
          country: order.shipping_country
        },
        items: order.order_items.map((item: any) => ({
          productId: item.product_id,
          productName: item.product_name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.image_url
        })),
        subtotal: order.subtotal,
        shipping: order.shipping,
        tax: order.tax,
        total: order.total,
        status: order.status,
        createdAt: new Date(order.created_at)
      }));
    } catch (error) {
      console.error('Error obteniendo órdenes:', error);
      return [];
    }
  }

  // Método para obtener una orden específica por número
  async getOrderByNumber(orderNumber: string): Promise<Order | null> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
        .eq('order_number', orderNumber)
        .single();

      if (error) throw error;
      if (!data) return null;

      return {
        id: data.id,
        orderNumber: data.order_number,
        customer: {
          firstName: data.customer_first_name,
          lastName: data.customer_last_name,
          email: data.customer_email,
          phone: data.customer_phone
        },
        shippingAddress: {
          street: data.shipping_street,
          city: data.shipping_city,
          state: data.shipping_state,
          zipCode: data.shipping_zip_code,
          country: data.shipping_country
        },
        items: data.order_items.map((item: any) => ({
          productId: item.product_id,
          productName: item.product_name,
          price: item.price,
          quantity: item.quantity,
          imageUrl: item.image_url
        })),
        subtotal: data.subtotal,
        shipping: data.shipping,
        tax: data.tax,
        total: data.total,
        status: data.status,
        createdAt: new Date(data.created_at)
      };
    } catch (error) {
      console.error('Error obteniendo orden:', error);
      return null;
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
