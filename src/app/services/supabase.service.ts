import { Injectable } from '@angular/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Category {
  id: number;
  name: string;
}

export interface Product {
  id: number;
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
export class SupabaseService {
  private supabase: SupabaseClient;

  constructor() {
    this.supabase = createClient(environment.supabaseUrl, environment.supabaseKey);
  }

  get client() {
    return this.supabase;
  }

  async getProducts(): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return [];
    }
    return data || [];
  }

  async getCategories(): Promise<Category[]> {
    const { data, error } = await this.supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      console.error('Error:', error);
      return [];
    }
    return data || [];
  }

  async getProductsByCategory(categoryId: number): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('category_id', categoryId);

    if (error) {
      console.error('Error:', error);
      return [];
    }
    return data || [];
  }

  async searchProducts(searchTerm: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error:', error);
      return [];
    }
    return data || [];
  }

  async getProductsByPriceRange(minPrice: number, maxPrice: number): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .gte('price', minPrice)
      .lte('price', maxPrice)
      .order('price');

    if (error) {
      console.error('Error:', error);
      return [];
    }
    return data || [];
  }
}
