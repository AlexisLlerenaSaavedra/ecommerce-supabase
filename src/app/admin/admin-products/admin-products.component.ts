// src/app/admin/admin-products/admin-products.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, ProductForm } from '../../services/admin.service';
import { SupabaseService, Product, Category } from '../../services/supabase.service';

@Component({
  selector: 'app-admin-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-products.component.html',
  styleUrls: ['./admin-products.component.css']
})
export class AdminProductsComponent implements OnInit {
  products: Product[] = [];
  categories: Category[] = [];
  isLoading = true;

  // Modal states
  showModal = false;
  isEditing = false;
  editingProductId: number | null = null;

  // Form data
  productForm: ProductForm = {
    name: '',
    description: '',
    price: 0,
    image_url: '',
    category_id: 1,
    stock: 0
  };

  // Form validation
  formErrors: string[] = [];
  isSubmitting = false;

  // Messages
  successMessage = '';
  errorMessage = '';

  constructor(
    private adminService: AdminService,
    private supabaseService: SupabaseService,
    private router: Router
  ) { }

  async ngOnInit() {
    await this.loadData();
  }

  async loadData() {
    this.isLoading = true;

    try {
      [this.products, this.categories] = await Promise.all([
        this.supabaseService.getProducts(),
        this.supabaseService.getCategories()
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
      this.errorMessage = 'Error al cargar los datos';
    }

    this.isLoading = false;
  }

  openCreateModal() {
    this.resetForm();
    this.isEditing = false;
    this.showModal = true;
  }

  openEditModal(product: Product) {
    this.productForm = {
      name: product.name,
      description: product.description,
      price: product.price,
      image_url: product.image_url,
      category_id: product.category_id,
      stock: product.stock
    };
    this.isEditing = true;
    this.editingProductId = product.id;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  resetForm() {
    this.productForm = {
      name: '',
      description: '',
      price: 0,
      image_url: '',
      category_id: this.categories.length > 0 ? this.categories[0].id : 1,
      stock: 0
    };
    this.formErrors = [];
    this.editingProductId = null;
  }

  validateForm(): boolean {
    this.formErrors = [];

    if (!this.productForm.name.trim()) {
      this.formErrors.push('El nombre es requerido');
    }
    if (!this.productForm.description.trim()) {
      this.formErrors.push('La descripción es requerida');
    }
    if (this.productForm.price <= 0) {
      this.formErrors.push('El precio debe ser mayor a 0');
    }
    if (!this.productForm.image_url.trim()) {
      this.formErrors.push('La URL de la imagen es requerida');
    }
    if (this.productForm.stock < 0) {
      this.formErrors.push('El stock no puede ser negativo');
    }

    return this.formErrors.length === 0;
  }

  async saveProduct() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    try {
      let result;

      if (this.isEditing && this.editingProductId) {
        result = await this.adminService.updateProduct(this.editingProductId, this.productForm);
      } else {
        result = await this.adminService.createProduct(this.productForm);
      }

      if (result.success) {
        this.successMessage = this.isEditing ? 'Producto actualizado correctamente' : 'Producto creado correctamente';
        this.closeModal();
        await this.loadData();
        setTimeout(() => this.successMessage = '', 3000);
      } else {
        this.errorMessage = result.error || 'Error al guardar el producto';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    } catch (error) {
      console.error('Error saving product:', error);
      this.errorMessage = 'Error al guardar el producto';
      setTimeout(() => this.errorMessage = '', 5000);
    }

    this.isSubmitting = false;
  }

  async deleteProduct(product: Product) {
    const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar "${product.name}"?`);

    if (!confirmDelete) return;

    try {
      const result = await this.adminService.deleteProduct(product.id);

      if (result.success) {
        this.successMessage = 'Producto eliminado correctamente';
        await this.loadData();
        setTimeout(() => this.successMessage = '', 3000);
      } else {
        this.errorMessage = result.error || 'Error al eliminar el producto';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    } catch (error) {
      console.error('Error deleting product:', error);
      this.errorMessage = 'Error al eliminar el producto';
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }

  getCategoryName(categoryId: number): string {
    const category = this.categories.find(c => c.id === categoryId);
    return category ? category.name : 'Sin categoría';
  }

  goBackToDashboard() {
    this.router.navigate(['/admin']);
  }
}
