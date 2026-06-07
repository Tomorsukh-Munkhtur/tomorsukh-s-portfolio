// Simple client-side authentication for demonstration purposes.
// NOTE: This is NOT real security — the password lives in the bundle and the
// "logged in" flag is just localStorage. It only protects message-reading API
// routes by sending this token, which is compared to the server ADMIN_PASSWORD.
// For real protection, switch to Supabase Auth.

const AUTH_KEY = 'admin_authenticated';
const SESSION_EXPIRY_KEY = 'admin_session_expiry';
const ADMIN_TOKEN_KEY = 'admin_token';
const ADMIN_PASSWORD = 'Asingiro8!'; // Change this in production!
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in ms

export function login(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION).toString());
      // Stored so admin-only API requests can be authorized server-side.
      localStorage.setItem(ADMIN_TOKEN_KEY, password);
    }
    return true;
  }
  return false;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
    localStorage.removeItem(ADMIN_TOKEN_KEY);
  }
}

export function isAuthenticated(): boolean {
  if (typeof window !== 'undefined') {
    const isAuthenticated = localStorage.getItem(AUTH_KEY) === 'true';
    if (!isAuthenticated) return false;

    const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (!expiryStr) return false;

    const expiry = parseInt(expiryStr, 10);
    if (Date.now() > expiry) {
      logout();
      return false;
    }

    return true;
  }
  return false;
}

// Token sent to admin-only API routes (the admin password).
export function getAdminToken(): string {
  if (typeof window !== 'undefined') {
    return localStorage.getItem(ADMIN_TOKEN_KEY) ?? '';
  }
  return '';
}

export function getSessionRemainingTime(): number {
  if (typeof window !== 'undefined') {
    const expiryStr = localStorage.getItem(SESSION_EXPIRY_KEY);
    if (!expiryStr) return 0;

    const expiry = parseInt(expiryStr, 10);
    const remaining = expiry - Date.now();
    return remaining > 0 ? remaining : 0;
  }
  return 0;
}
