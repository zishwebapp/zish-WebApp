// Updated for Google Sheets Backend
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export async function login(username: string, password: string) {
  try {
    console.log('Attempting login for:', username);
    
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    
    const payload = await res.json().catch(() => ({}));
    console.log('Login response:', payload);
    
    if (!res.ok || !payload?.success) {
      throw new Error(payload?.message || `Login failed (${res.status})`);
    }
    
    const { token, user } = payload.data || {};
    
    if (token) {
      try {
        localStorage.setItem('token', token);
        sessionStorage.setItem('token', token);
      } catch (e) {
        console.error('Failed to store token:', e);
      }
    }
    
    return user;
  } catch (error) {
    // Wrong credentials is an expected failure, not a bug — console.warn
    // (not console.error) so Next.js's dev overlay doesn't hijack the
    // screen and hide the WrongPasswordModal that's about to show.
    console.warn('Login error:', error);
    throw error;
  }
}

export async function register(name: string, email: string, password: string) {
  try {
    console.log('Attempting registration for:', email);
    
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });
    
    const payload = await res.json().catch(() => ({}));
    console.log('Registration response:', payload);
    
    if (!res.ok || !payload?.success) {
      throw new Error(payload?.message || `Registration failed (${res.status})`);
    }
    
    const { token, user } = payload.data || {};
    
    if (token) {
      try {
        localStorage.setItem('token', token);
        sessionStorage.setItem('token', token);
      } catch (e) {
        console.error('Failed to store token:', e);
      }
    }
    
    return user;
  } catch (error) {
    // Same reasoning as login() above: expected failure, not a bug.
    console.warn('Registration error:', error);
    throw error;
  }
}

export async function getCurrentUser() {
  try {
    const token = localStorage.getItem('token') || sessionStorage.getItem('token');
    
    if (!token) {
      throw new Error('No token found');
    }
    
    const res = await fetch(`${API_BASE_URL}/auth/me`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
    });
    
    const payload = await res.json().catch(() => ({}));
    
    if (!res.ok || !payload?.success) {
      throw new Error(payload?.message || 'Failed to get user info');
    }
    
    return payload.data;
  } catch (error) {
    console.error('Get current user error:', error);
    throw error;
  }
}

export function logout() {
  try {
    localStorage.removeItem('token');
    sessionStorage.removeItem('token');
  } catch {}
}


