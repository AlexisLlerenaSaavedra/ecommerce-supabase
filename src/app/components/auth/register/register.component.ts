// src/app/components/auth/register/register.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  firstName = '';
  lastName = '';
  email = '';
  password = '';
  confirmPassword = '';
  isLoading = false;
  errorMessage = '';
  successMessage = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  async onSubmit() {
    this.errorMessage = '';
    this.successMessage = '';

    // Validaciones
    if (!this.firstName || !this.lastName || !this.email || !this.password) {
      this.errorMessage = 'Por favor completa todos los campos';
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }

    if (this.password.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }

    if (!this.isValidEmail(this.email)) {
      this.errorMessage = 'Por favor ingresa un email válido';
      return;
    }

    this.isLoading = true;

    const result = await this.authService.signUp(
      this.email,
      this.password,
      this.firstName,
      this.lastName
    );

    if (result.success) {
      this.successMessage = 'Cuenta creada exitosamente. Puedes iniciar sesión ahora.';
      setTimeout(() => {
        this.router.navigate(['/login']);
      }, 2000);
    } else {
      this.errorMessage = this.getErrorMessage(result.error);
    }

    this.isLoading = false;
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  toggleConfirmPasswordVisibility() {
    this.showConfirmPassword = !this.showConfirmPassword;
  }

  goToLogin() {
    this.router.navigate(['/login']);
  }

  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  private getErrorMessage(error: string): string {
    if (error.includes('User already registered')) {
      return 'Ya existe una cuenta con este email';
    }
    if (error.includes('Password should be at least 6 characters')) {
      return 'La contraseña debe tener al menos 6 caracteres';
    }
    if (error.includes('Invalid email')) {
      return 'Email inválido';
    }
    return 'Error al crear la cuenta. Intenta nuevamente.';
  }
}
