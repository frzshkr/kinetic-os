import { AuthUser, AuthResponse } from '../types';

const TOKEN_KEY = 'kinetic_auth_token';
const USER_KEY = 'kinetic_auth_user';

export const authService = {
  getToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  },

  getCurrentUser(): AuthUser | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  },

  saveSession(token: string, user: AuthUser): void {
    try {
      localStorage.setItem(TOKEN_KEY, token);
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    } catch (e) {
      console.warn('Failed to save session to localStorage', e);
    }
  },

  clearSession(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.warn('Failed to clear session', e);
    }
  },

  isAuthenticated(): boolean {
    return Boolean(this.getToken() && this.getCurrentUser());
  },

  async register(username: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Registration failed' };
      }
      if (data.token && data.user) {
        this.saveSession(data.token, data.user);
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed' };
    }
  },

  async login(username: string, password: string): Promise<AuthResponse> {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, error: data.error || 'Login failed' };
      }
      if (data.token && data.user) {
        this.saveSession(data.token, data.user);
      }
      return data;
    } catch (err: any) {
      return { success: false, error: err.message || 'Network connection failed' };
    }
  },

  async fetchCurrentUser(): Promise<AuthUser | null> {
    const token = this.getToken();
    if (!token) return null;

    try {
      const res = await fetch('/api/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        if (res.status === 401 || res.status === 403) {
          this.clearSession();
        }
        return null;
      }
      const data = await res.json();
      if (data.user) {
        localStorage.setItem(USER_KEY, JSON.stringify(data.user));
        return data.user;
      }
      return null;
    } catch {
      return this.getCurrentUser();
    }
  },

  logout(): void {
    this.clearSession();
  },
};
