// src/app/models/order.models.ts
export interface Customer {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  street: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export interface OrderItem {
  productId: number;
  productName: string;
  price: number;
  quantity: number;
  imageUrl: string;
}

export interface Order {
  id?: string;
  orderNumber: string;
  customer: Customer;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  createdAt: Date;
}

export interface CheckoutStep {
  id: number;
  title: string;
  completed: boolean;
  active: boolean;
}
