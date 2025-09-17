import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { CartService } from '../../services/cart.service';
import { AuthService, AuthUser } from '../../services/auth.service';
import { AdminService } from '../../services/admin.service';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css'],
})
export class HeaderComponent implements OnInit {
  cartCount = 0;
  currentUser: AuthUser | null = null;
  isAuthLoading = true;
  showUserMenu = false;

  constructor(
    private cartService: CartService,
    private authService: AuthService,
    private adminService: AdminService,
    public router: Router
  ) {}

  ngOnInit() {
    this.cartService.cart$.subscribe((items) => {
      this.cartCount = this.cartService.getCartCount();
    });

    this.authService.currentUser$.subscribe((user) => {
      this.currentUser = user;
    });

    this.authService.loading$.subscribe((loading) => {
      this.isAuthLoading = loading;
    });
  }

  goToProducts() {
    this.router.navigate(['/productos']);
  }

  goToCart() {
    this.router.navigate(['/carrito']);
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  toggleUserMenu() {
    this.showUserMenu = !this.showUserMenu;
  }

  async logout() {
    const result = await this.authService.signOut();
    if (result.success) {
      this.showUserMenu = false;
      this.router.navigate(['/productos']);
    }
  }

  onDocumentClick() {
    this.showUserMenu = false;
  }
  isAdmin(): boolean {
    return this.adminService.isAdmin();
  }
}
