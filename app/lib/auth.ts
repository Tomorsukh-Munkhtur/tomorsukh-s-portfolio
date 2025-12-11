// Simple client-side authentication for demonstration purposes
// For production, use proper backend authentication (NextAuth.js, JWT, etc.)

const AUTH_KEY = 'admin_authenticated';
const SESSION_EXPIRY_KEY = 'admin_session_expiry';
const ADMIN_PASSWORD = 'admin123'; // Change this in production!
const SESSION_DURATION = 60 * 60 * 1000; // 1 hour in ms

export function login(password: string): boolean {
  if (password === ADMIN_PASSWORD) {
    if (typeof window !== 'undefined') {
      localStorage.setItem(AUTH_KEY, 'true');
      localStorage.setItem(SESSION_EXPIRY_KEY, (Date.now() + SESSION_DURATION).toString());
    }
    return true;
  }
  return false;
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(AUTH_KEY);
    localStorage.removeItem(SESSION_EXPIRY_KEY);
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
