// src/app/admin/admin-categories/admin-categories.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AdminService, CategoryForm } from '../../services/admin.service';
import { SupabaseService, Product, Category } from '../../services/supabase.service';

@Component({
  selector: 'app-admin-categories',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-categories.component.html',
  styleUrls: ['./admin-categories.component.css']
})
export class AdminCategoriesComponent implements OnInit {
  categories: Category[] = [];
  products: Product[] = [];
  isLoading = true;

  // Modal states
  showModal = false;
  isEditing = false;
  editingCategoryId: number | null = null;

  // Form data - SIMPLIFICADO
  categoryForm: CategoryForm = {
    name: ''
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
      [this.categories, this.products] = await Promise.all([
        this.supabaseService.getCategories(),
        this.supabaseService.getProducts()
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

  openEditModal(category: Category) {
    this.categoryForm = {
      name: category.name
    };
    this.isEditing = true;
    this.editingCategoryId = category.id;
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
    this.resetForm();
  }

  resetForm() {
    this.categoryForm = {
      name: ''
    };
    this.formErrors = [];
    this.editingCategoryId = null;
  }

  validateForm(): boolean {
    this.formErrors = [];

    if (!this.categoryForm.name.trim()) {
      this.formErrors.push('El nombre es requerido');
    }

    // Verificar que no exista otra categoría con el mismo nombre
    const existingCategory = this.categories.find(c =>
      c.name.toLowerCase() === this.categoryForm.name.trim().toLowerCase() &&
      c.id !== this.editingCategoryId
    );

    if (existingCategory) {
      this.formErrors.push('Ya existe una categoría con ese nombre');
    }

    return this.formErrors.length === 0;
  }

  async saveCategory() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    try {
      let result;

      if (this.isEditing && this.editingCategoryId) {
        result = await this.adminService.updateCategory(this.editingCategoryId, this.categoryForm);
      } else {
        result = await this.adminService.createCategory(this.categoryForm);
      }

      if (result.success) {
        this.successMessage = this.isEditing ? 'Categoría actualizada correctamente' : 'Categoría creada correctamente';
        this.closeModal();
        await this.loadData();
        setTimeout(() => this.successMessage = '', 3000);
      } else {
        this.errorMessage = result.error || 'Error al guardar la categoría';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    } catch (error) {
      console.error('Error saving category:', error);
      this.errorMessage = 'Error al guardar la categoría';
      setTimeout(() => this.errorMessage = '', 5000);
    }

    this.isSubmitting = false;
  }

  async deleteCategory(category: Category) {
    const productCount = this.getProductCount(category.id);

    if (productCount > 0) {
      this.errorMessage = `No se puede eliminar la categoría "${category.name}" porque tiene ${productCount} producto(s) asociado(s)`;
      setTimeout(() => this.errorMessage = '', 5000);
      return;
    }

    const confirmDelete = confirm(`¿Estás seguro de que quieres eliminar la categoría "${category.name}"?`);

    if (!confirmDelete) return;

    try {
      const result = await this.adminService.deleteCategory(category.id);

      if (result.success) {
        this.successMessage = 'Categoría eliminada correctamente';
        await this.loadData();
        setTimeout(() => this.successMessage = '', 3000);
      } else {
        this.errorMessage = result.error || 'Error al eliminar la categoría';
        setTimeout(() => this.errorMessage = '', 5000);
      }
    } catch (error) {
      console.error('Error deleting category:', error);
      this.errorMessage = 'Error al eliminar la categoría';
      setTimeout(() => this.errorMessage = '', 5000);
    }
  }

  getProductCount(categoryId: number): number {
    return this.products.filter(p => p.category_id === categoryId).length;
  }

  goBackToDashboard() {
    this.router.navigate(['/admin']);
  }
}
