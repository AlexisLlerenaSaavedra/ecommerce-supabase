// src/app/services/admin.service.ts
import { Injectable } from '@angular/core';
import { SupabaseService, Product, Category } from './supabase.service';
import { AuthService } from './auth.service';

export interface ProductForm {
  name: string;
  description: string;
  price: number;
  image_url: string;
  category_id: number;
  stock: number;
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
  async createCategory(name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('categories')
        .insert([{ name }])
        .select();

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async updateCategory(id: number, name: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { data, error } = await this.supabaseService.client
        .from('categories')
        .update({ name })
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
}
