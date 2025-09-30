// src/app/services/admin.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService, Product } from './supabase.service';
import { AuthService } from './auth.service';
import { Order } from '../models/order.models';

export interface ProductForm {
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  stock: number;
}

export interface CategoryForm {
  name: string;
}

@Injectable({
  providedIn: 'root'
})
export class AdminService {
  // Lista de emails de administradores
  private adminEmails = [
    'admin@miecommerce.com',
    'alexisllerenasaa@gmail.com' // Cambia esto por tu email
  ];

  constructor(
    private supabaseService: SupabaseService,
    private authService: AuthService
  ) { }

  isAdmin(): boolean {
    const currentUser = this.authService.getCurrentUser();
    if (!currentUser) return false;

    return this.adminEmails.includes(currentUser.email);
  }

  // CRUD de Productos
  async createProduct(productData: ProductForm): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('products')
        .insert([productData])
        .select();

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateProduct(id: number, productData: Partial<ProductForm>): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('products')
        .update(productData)
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteProduct(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // CRUD de Categorías
  async createCategory(CategoryData: CategoryForm): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('categories')
        .insert([CategoryData])
        .select();

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateCategory(id: number, CategoryData: CategoryForm): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('categories')
        .update(CategoryData)
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteCategory(id: number): Promise<{ success: boolean; error?: string }> {
    try {
      // Verificar si hay productos usando esta categoría
      const { data: products } = await this.supabaseService.client
        .from('products')
        .select('id')
        .eq('category_id', id);

      if (products && products.length > 0) {
        return { success: false, error: 'No se puede eliminar una categoría que tiene productos asignados' };
      }

      const { data, error } = await this.supabaseService.client
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  // Estadísticas del dashboard
  async getDashboardStats() {
    try {
      // Contar productos
      const { data: products } = await this.supabaseService.client
        .from('products')
        .select('id, stock, price');

      // Contar categorías
      const { data: categories } = await this.supabaseService.client
        .from('categories')
        .select('id');

      // Productos con bajo stock
      const lowStockProducts = products?.filter(p => p.stock < 5) || [];

      // Valor total del inventario
      const totalInventoryValue = products?.reduce((sum, p) => sum + (p.price * p.stock), 0) || 0;

      return {
        totalProducts: products?.length || 0,
        totalCategories: categories?.length || 0,
        lowStockCount: lowStockProducts.length,
        totalInventoryValue: totalInventoryValue
      };
    } catch (error) {
      console.error('Error getting dashboard stats:', error);
      return {
        totalProducts: 0,
        totalCategories: 0,
        lowStockCount: 0,
        totalInventoryValue: 0
      };
    }
  }

  // Obtener productos con bajo stock
  async getLowStockProducts(): Promise<Product[]> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('products')
        .select('*')
        .lt('stock', 5)
        .order('stock', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error getting low stock products:', error);
      return [];
    }
  }

  // Obtener todas las órdenes (para admin)
  async getAllOrders(): Promise<Order[]> {
    try {
      const { data: orders, error } = await this.supabaseService.client
        .from('orders')
        .select(`
          *,
          order_items (*)
        `)
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
      console.error('Error obteniendo todas las órdenes:', error);
      return [];
    }
}

// Actualizar estado de una orden
async updateOrderStatus(orderId: string, newStatus: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await this.supabaseService.client
      .from('orders')
      .update({
        status: newStatus,
        updated_at: new Date().toISOString()
      })
      .eq('id', orderId);

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('Error actualizando estado de orden:', error);
    return { success: false, error: error.message };
  }
}
}
