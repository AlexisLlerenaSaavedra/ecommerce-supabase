// src/app/components/product-detail/product-detail.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { SupabaseService, Product } from '../../services/supabase.service';
import { CartService } from '../../services/cart.service';

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail.component.html',
  styleUrls: ['./product-detail.component.css']
})
export class ProductDetailComponent implements OnInit {
  product: Product | null = null;
  loading = true;
  quantity = 1;
  addingToCart = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private supabaseService: SupabaseService,
    private cartService: CartService
  ) { }

  ngOnInit() {
    this.route.params.subscribe(params => {
      const id = +params['id'];
      this.loadProduct(id);
    });
  }

  async loadProduct(id: number) {
    this.loading = true;
    try {
      // Por ahora buscamos en todos los productos
      const products = await this.supabaseService.getProducts();
      this.product = products.find(p => p.id === id) || null;

      if (!this.product) {
        this.router.navigate(['/productos']);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      this.router.navigate(['/productos']);
    }
    this.loading = false;
  }

  async addToCart() {
    if (!this.product) return;

    this.addingToCart = true;

    // Simular un pequeño delay para mejor UX
    await new Promise(resolve => setTimeout(resolve, 300));

    for (let i = 0; i < this.quantity; i++) {
      this.cartService.addToCart(this.product);
    }

    this.addingToCart = false;

    // Opcional: mostrar confirmación
    alert(`${this.quantity} ${this.product.name}(s) agregado(s) al carrito!`);
  }

  increaseQuantity() {
    if (this.product && this.quantity < this.product.stock) {
      this.quantity++;
    }
  }

  decreaseQuantity() {
    if (this.quantity > 1) {
      this.quantity--;
    }
  }

  goBack() {
    this.router.navigate(['/productos']);
  }
}
