// src/app/pages/contact/contact.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-contact',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './contact.component.html',
  styleUrls: ['./contact.component.css']
})
export class ContactComponent {
  contactForm = {
    name: '',
    email: '',
    subject: '',
    message: ''
  };

  isSubmitting = false;
  submitMessage = '';

  contactMethods = [
    {
      icon: '📞',
      title: 'Teléfono',
      info: '+54 11 1234-5678',
      description: 'Lun - Vie: 9:00 - 18:00'
    },
    {
      icon: '📧',
      title: 'Email',
      info: 'info@miecommerce.com',
      description: 'Respuesta en 24 horas'
    },
    {
      icon: '💬',
      title: 'Chat en Vivo',
      info: 'Chat disponible',
      description: 'Lun - Vie: 9:00 - 20:00'
    },
    {
      icon: '📍',
      title: 'Dirección',
      info: 'Buenos Aires, Argentina',
      description: 'Oficinas centrales'
    }
  ];

  departments = [
    'Consulta General',
    'Soporte Técnico',
    'Ventas',
    'Reclamos',
    'Sugerencias',
    'Prensa'
  ];

  async onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;

    // Simular envío del formulario
    try {
      await new Promise(resolve => setTimeout(resolve, 2000));

      this.submitMessage = 'Mensaje enviado correctamente. Te responderemos pronto.';
      this.resetForm();
    } catch (error) {
      this.submitMessage = 'Error al enviar el mensaje. Intenta nuevamente.';
    }

    this.isSubmitting = false;

    // Limpiar mensaje después de 5 segundos
    setTimeout(() => {
      this.submitMessage = '';
    }, 5000);
  }

  validateForm(): boolean {
    if (!this.contactForm.name || !this.contactForm.email ||
        !this.contactForm.subject || !this.contactForm.message) {
      this.submitMessage = 'Por favor completa todos los campos.';
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.contactForm.email)) {
      this.submitMessage = 'Por favor ingresa un email válido.';
      return false;
    }

    return true;
  }

  resetForm() {
    this.contactForm = {
      name: '',
      email: '',
      subject: '',
      message: ''
    };
  }
}
