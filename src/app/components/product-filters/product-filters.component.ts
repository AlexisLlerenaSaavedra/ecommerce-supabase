// src/app/components/product-filters/product-filters.component.ts
import { Component, OnInit, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService, Category } from '../../services/supabase.service';
import { FilterService, FilterOptions } from '../../services/filter.service';

@Component({
  selector: 'app-product-filters',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './product-filters.component.html',
  styleUrls: ['./product-filters.component.css']
})
export class ProductFiltersComponent implements OnInit {
  categories: Category[] = [];

  searchTerm = '';
  selectedCategory: number | null = null;
  minPrice: number | null = null;
  maxPrice: number | null = null;
  sortBy: 'name' | 'price-asc' | 'price-desc' = 'name';

  @Output() filtersChanged = new EventEmitter<FilterOptions>();

  constructor(
    private supabaseService: SupabaseService,
    private filterService: FilterService
  ) { }

  async ngOnInit() {
    this.categories = await this.supabaseService.getCategories();

    // Cargar filtros actuales
    const currentFilters = this.filterService.getCurrentFilters();
    this.searchTerm = currentFilters.searchTerm;
    this.selectedCategory = currentFilters.categoryId;
    this.minPrice = currentFilters.minPrice;
    this.maxPrice = currentFilters.maxPrice;
    this.sortBy = currentFilters.sortBy;
  }

  onSearchChange() {
    this.applyFilters();
  }

  onCategoryChange() {
    this.applyFilters();
  }

  onPriceChange() {
    this.applyFilters();
  }

  onSortChange() {
    this.applyFilters();
  }

  clearFilters() {
    this.searchTerm = '';
    this.selectedCategory = null;
    this.minPrice = null;
    this.maxPrice = null;
    this.sortBy = 'name';
    this.filterService.resetFilters();
    this.filtersChanged.emit(this.filterService.getCurrentFilters());
  }

  private applyFilters() {
    const filters: FilterOptions = {
      searchTerm: this.searchTerm,
      categoryId: this.selectedCategory,
      minPrice: this.minPrice,
      maxPrice: this.maxPrice,
      sortBy: this.sortBy
    };

    this.filterService.updateFilters(filters);
    this.filtersChanged.emit(filters);
  }
}
