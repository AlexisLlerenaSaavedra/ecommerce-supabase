// src/app/components/checkout/checkout.component.ts
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CartService, CartItem } from '../../services/cart.service';
import { OrderService } from '../../services/order.service';
import { Customer, ShippingAddress, Order, CheckoutStep } from '../../models/order.models';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './checkout.component.html',
  styleUrls: ['./checkout.component.css']
})
export class CheckoutComponent implements OnInit {
  cartItems: CartItem[] = [];
  currentStep = 1;
  isProcessing = false;

  // Datos del formulario
  customer: Customer = {
    firstName: '',
    lastName: '',
    email: '',
    phone: ''
  };

  shippingAddress: ShippingAddress = {
    street: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'AR'
  };

  // Cálculos
  subtotal = 0;
  shipping = 0;
  tax = 0;
  total = 0;

  // Pasos del checkout
  steps: CheckoutStep[] = [
    { id: 1, title: 'Información Personal', completed: false, active: true },
    { id: 2, title: 'Dirección de Envío', completed: false, active: false },
    { id: 3, title: 'Revisión y Pago', completed: false, active: false }
  ];

  // Errores de validación
  customerErrors: string[] = [];
  addressErrors: string[] = [];

  countries = [
    { code: 'AR', name: 'Argentina' },
    { code: 'US', name: 'Estados Unidos' },
    { code: 'BR', name: 'Brasil' },
    { code: 'UY', name: 'Uruguay' },
    { code: 'CL', name: 'Chile' }
  ];

  constructor(
    private cartService: CartService,
    private orderService: OrderService,
    private router: Router
  ) { }

  ngOnInit() {
    this.cartItems = this.cartService.getCartItems();

    if (this.cartItems.length === 0) {
      this.router.navigate(['/productos']);
      return;
    }

    this.calculateTotals();
  }

  calculateTotals() {
    this.subtotal = this.cartService.getCartTotal();
    this.shipping = this.orderService.calculateShipping(this.subtotal, this.shippingAddress.country);
    this.tax = this.orderService.calculateTax(this.subtotal, this.shippingAddress.country);
    this.total = this.subtotal + this.shipping + this.tax;
  }

  // Navegación entre pasos
  nextStep() {
    if (this.currentStep === 1) {
      this.customerErrors = this.orderService.validateCustomer(this.customer);
      if (this.customerErrors.length > 0) return;
    }

    if (this.currentStep === 2) {
      this.addressErrors = this.orderService.validateShippingAddress(this.shippingAddress);
      if (this.addressErrors.length > 0) return;
      this.calculateTotals(); // Recalcular con país seleccionado
    }

    this.steps[this.currentStep - 1].completed = true;
    this.steps[this.currentStep - 1].active = false;

    this.currentStep++;

    if (this.currentStep <= 3) {
      this.steps[this.currentStep - 1].active = true;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.steps[this.currentStep - 1].active = false;
      this.currentStep--;
      this.steps[this.currentStep - 1].active = true;
      this.steps[this.currentStep - 1].completed = false;
    }
  }

  onCountryChange() {
    this.calculateTotals();
  }

  async completeOrder() {
    this.isProcessing = true;

    try {
      const order = this.orderService.createOrderFromCart(this.customer, this.shippingAddress);
      const success = await this.orderService.saveOrder(order);

      if (success) {
        // Redirigir a página de confirmación
        this.router.navigate(['/order-confirmation'], {
          state: { order: order }
        });
      } else {
        alert('Error al procesar la orden. Intenta nuevamente.');
      }
    } catch (error) {
      console.error('Error en checkout:', error);
      alert('Error al procesar la orden. Intenta nuevamente.');
    }

    this.isProcessing = false;
  }

  goToProducts() {
    this.router.navigate(['/productos']);
  }

  goToCart() {
    this.router.navigate(['/carrito']);
  }

  getCountryName(countryCode: string): string {
    const country = this.countries.find(c => c.code === countryCode);
    return country ? country.name : countryCode;
  }
}
