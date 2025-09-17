// src/app/services/auth.service.ts
import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SupabaseService } from './supabase.service';
import { User } from '@supabase/supabase-js';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<AuthUser | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private loadingSubject = new BehaviorSubject<boolean>(true);
  public loading$ = this.loadingSubject.asObservable();

  constructor(private supabaseService: SupabaseService) {
    this.initializeAuth();
  }

  private async initializeAuth() {
    try {
      // Obtener sesión actual
      const { data: { session } } = await this.supabaseService.client.auth.getSession();

      if (session?.user) {
        await this.setCurrentUser(session.user);
      }

      // Escuchar cambios de autenticación
      this.supabaseService.client.auth.onAuthStateChange(async (event, session) => {
        if (session?.user) {
          await this.setCurrentUser(session.user);
        } else {
          this.currentUserSubject.next(null);
        }
      });
    } catch (error) {
      console.error('Error initializing auth:', error);
    } finally {
      this.loadingSubject.next(false);
    }
  }

  private async setCurrentUser(user: User) {
    try {
      // Obtener perfil del usuario desde nuestra tabla personalizada
      const { data: profile } = await this.supabaseService.client
        .from('user_profiles')
        .select('first_name, last_name')
        .eq('user_id', user.id)
        .single();

      const authUser: AuthUser = {
        id: user.id,
        email: user.email || '',
        firstName: profile?.first_name || '',
        lastName: profile?.last_name || ''
      };

      this.currentUserSubject.next(authUser);
    } catch (error) {
      // Si no existe perfil, usar solo datos básicos
      console.log('Profile not found, using basic auth data');
      const authUser: AuthUser = {
        id: user.id,
        email: user.email || ''
      };
      this.currentUserSubject.next(authUser);
    }
  }

  async signUp(email: string, password: string, firstName: string, lastName: string) {
    try {
      const { data, error } = await this.supabaseService.client.auth.signUp({
        email,
        password
      });

      if (error) throw error;

      // Crear perfil del usuario
      if (data.user) {
        await this.createUserProfile(data.user.id, firstName, lastName);
      }

      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signIn(email: string, password: string) {
    try {
      const { data, error } = await this.supabaseService.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) throw error;

      return { success: true, user: data.user };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async signOut() {
    try {
      const { error } = await this.supabaseService.client.auth.signOut();
      if (error) throw error;

      this.currentUserSubject.next(null);
      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async resetPassword(email: string) {
    try {
      const { error } = await this.supabaseService.client.auth.resetPasswordForEmail(email);
      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  private async createUserProfile(userId: string, firstName: string, lastName: string) {
    try {
      const { error } = await this.supabaseService.client
        .from('user_profiles')
        .insert({
          user_id: userId,
          first_name: firstName,
          last_name: lastName
        });

      if (error) throw error;
    } catch (error) {
      console.error('Error creating user profile:', error);
    }
  }

  getCurrentUser(): AuthUser | null {
    return this.currentUserSubject.value;
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  isLoading(): boolean {
    return this.loadingSubject.value;
  }
}
