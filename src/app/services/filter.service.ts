// src/app/services/filter.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { Product } from './supabase.service';

export interface FilterOptions {
  searchTerm: string;
  categoryId: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  sortBy: 'name' | 'price-asc' | 'price-desc';
}

@Injectable({
  providedIn: 'root'
})
export class FilterService {
  private filtersSubject = new BehaviorSubject<FilterOptions>({
    searchTerm: '',
    categoryId: null,
    minPrice: null,
    maxPrice: null,
    sortBy: 'name'
  });

  filters$ = this.filtersSubject.asObservable();

  updateFilters(newFilters: Partial<FilterOptions>) {
    const currentFilters = this.filtersSubject.value;
    const merged: FilterOptions = { ...currentFilters, ...newFilters } as FilterOptions;

    // Normalizar categoryId (puede venir como string desde el <select>)
    if ('categoryId' in newFilters) {
      const v = (newFilters as any).categoryId;
      merged.categoryId = (v === null || v === undefined || v === '')
        ? null
        : Number(v);
    }

    this.filtersSubject.next(merged);
  }

  resetFilters() {
    this.filtersSubject.next({
      searchTerm: '',
      categoryId: null,
      minPrice: null,
      maxPrice: null,
      sortBy: 'name'
    });
  }

  filterProducts(products: Product[], filters: FilterOptions): Product[] {
    let filtered = [...products];

    // Filtrar por término de búsqueda
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(term) ||
        product.description.toLowerCase().includes(term)
      );
    }

    // Filtrar por categoría
    if (filters.categoryId !== null ) {
      const catId = Number(filters.categoryId);
      filtered = filtered.filter(product =>
        Number((product as any).category_id) === catId
      );
    }

    // Filtrar por rango de precios
    if (filters.minPrice !== null) {
      filtered = filtered.filter(product => product.price >= filters.minPrice!);
    }
    if (filters.maxPrice !== null) {
      filtered = filtered.filter(product => product.price <= filters.maxPrice!);
    }

    // Ordenar
    switch (filters.sortBy) {
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'price-asc':
        filtered.sort((a, b) => a.price - b.price);
        break;
      case 'price-desc':
        filtered.sort((a, b) => b.price - a.price);
        break;
    }

    return filtered;
  }

  getCurrentFilters(): FilterOptions {
    return this.filtersSubject.value;
  }
}
