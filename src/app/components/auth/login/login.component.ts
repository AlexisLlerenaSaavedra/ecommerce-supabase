// src/app/components/auth/login/login.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  email = '';
  password = '';
  isLoading = false;
  errorMessage = '';
  showPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    if (!this.email || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    const result = await this.authService.signIn(this.email, this.password);

    if (result.success) {
      this.router.navigate(['/productos']);
    } else {
      this.errorMessage = this.getErrorMessage(result.error);
    }

    this.isLoading = false;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  goToRegister() {
    this.router.navigate(['/register']);
  }

  goToForgotPassword() {
    this.router.navigate(['/forgot-password']);
  }

  private getErrorMessage(error: string): string {
    if (error.includes('Invalid login credentials')) {
      return 'Email o contraseña incorrectos';
    }
    if (error.includes('Email not confirmed')) {
      return 'Por favor confirma tu email antes de iniciar sesión';
    }
    return 'Error al iniciar sesión. Intenta nuevamente.';
  }
}
