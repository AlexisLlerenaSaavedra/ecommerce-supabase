// src/app/admin/admin-dashboard/admin-dashboard.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AdminService } from '../../services/admin.service';
import { AuthService, AuthUser } from '../../services/auth.service';
import { Product } from '../../services/supabase.service';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.css']
})
export class AdminDashboardComponent implements OnInit {
  currentUser: AuthUser | null = null;
  stats = {
    totalProducts: 0,
    totalCategories: 0,
    lowStockCount: 0,
    totalInventoryValue: 0
  };
  lowStockProducts: Product[] = [];
  isLoading = true;

  constructor(
    private adminService: AdminService,
    private authService: AuthService,
    public router: Router
  ) { }

  async ngOnInit() {
    this.currentUser = this.authService.getCurrentUser();

    if (!this.adminService.isAdmin()) {
      this.router.navigate(['/productos']);
      return;
    }

    await this.loadDashboardData();
  }

  async loadDashboardData() {
    this.isLoading = true;

    try {
      this.stats = await this.adminService.getDashboardStats();
      this.lowStockProducts = await this.adminService.getLowStockProducts();
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    }

    this.isLoading = false;
  }

  navigateToProducts() {
    this.router.navigate(['/admin/products']);
  }

  navigateToCategories() {
    this.router.navigate(['/admin/categories']);
  }

  navigateToOrders() {
    this.router.navigate(['/admin/orders']);
  }

  navigateToUsers() {
    // Funcionalidad futura
    alert('Gestión de usuarios - próximamente');
  }

  logout() {
    this.authService.signOut().then(() => {
      this.router.navigate(['/productos']);
    });
  }
}
