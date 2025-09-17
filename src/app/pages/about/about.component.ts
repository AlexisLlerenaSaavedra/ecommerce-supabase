// src/app/pages/about/about.component.ts
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-about',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './about.component.html',
  styleUrls: ['./about.component.css']
})
export class AboutComponent {
  stats = [
    { number: '10,000+', label: 'Clientes Satisfechos' },
    { number: '5,000+', label: 'Productos Vendidos' },
    { number: '99%', label: 'Satisfacción Cliente' },
    { number: '24/7', label: 'Soporte Disponible' }
  ];

  team = [
    {
      name: 'María González',
      position: 'CEO & Fundadora',
      description: 'Más de 10 años de experiencia en e-commerce y tecnología.',
      image: 'https://via.placeholder.com/200x200?text=MG'
    },
    {
      name: 'Carlos Rodríguez',
      position: 'Director de Tecnología',
      description: 'Experto en desarrollo web y arquitectura de sistemas.',
      image: 'https://via.placeholder.com/200x200?text=CR'
    },
    {
      name: 'Ana Martínez',
      position: 'Head de Marketing',
      description: 'Especialista en marketing digital y experiencia del usuario.',
      image: 'https://via.placeholder.com/200x200?text=AM'
    }
  ];

  values = [
    {
      title: 'Calidad',
      description: 'Seleccionamos cuidadosamente cada producto para garantizar la máxima calidad.',
      icon: '⭐'
    },
    {
      title: 'Confianza',
      description: 'Construimos relaciones duraderas basadas en la transparencia y honestidad.',
      icon: '🤝'
    },
    {
      title: 'Innovación',
      description: 'Constantemente mejoramos nuestra plataforma y servicios.',
      icon: '💡'
    },
    {
      title: 'Sostenibilidad',
      description: 'Comprometidos con prácticas responsables con el medio ambiente.',
      icon: '🌱'
    }
  ];
}
