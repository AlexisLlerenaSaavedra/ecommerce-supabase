import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SupabaseService, Product } from '../../services/supabase.service';
import { CartService } from '../../services/cart.service';
import { FilterService, FilterOptions } from '../../services/filter.service';
import { ProductFiltersComponent } from '../product-filters/product-filters.component';

@Component({
  selector: 'app-product-list',
  standalone: true,
  imports: [CommonModule, ProductFiltersComponent],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.css']
})
export class ProductListComponent implements OnInit {
  allProducts: Product[] = [];
  filteredProducts: Product[] = [];
  loading = true;
  resultCount = 0;

  constructor(
    private supabaseService: SupabaseService,
    private cartService: CartService,
    private router: Router,
    private filterService: FilterService
  ) { }

  async ngOnInit() {
    await this.loadProducts();
    this.applyFilters(this.filterService.getCurrentFilters());
  }

  async loadProducts() {
    this.loading = true;
    this.allProducts = await this.supabaseService.getProducts();
    this.loading = false;
  }

  onFiltersChanged(filters: FilterOptions) {
    this.applyFilters(filters);
  }

  private applyFilters(filters: FilterOptions) {
    this.filteredProducts = this.filterService.filterProducts(this.allProducts, filters);
    this.resultCount = this.filteredProducts.length;
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product);
    console.log(`${product.name} agregado al carrito!`);
  }

  viewProduct(product: Product) {
    this.router.navigate(['/producto', product.id]);
  }
}
