/**
 * Wrapper around fetch() that adds:
 * 1. Timeout via AbortController (default 15s)
 * 2. Auto-injects Authorization header from localStorage (uses access_token for admin)
 * 3. Suppresses AbortError console noise
 * 
 * Usage:
 *   import fetchWithTimeout from '../utils/fetchWithTimeout';
 *   const data = await fetchWithTimeout('/api/endpoint');
 *   const data = await fetchWithTimeout('/api/endpoint', { method: 'POST', body: ... }, 20000);
 */

const fetchWithTimeout = async (url, options = {}, timeoutMs = 15000) => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  // Auto-inject auth token (admin uses access_token)
  const token = localStorage.getItem('access_token');
  const headers = {
    ...(token && !options.skipAuth ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    const response = await fetch(url, {
      ...options,
      headers,
      signal: controller.signal,
    });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    if (error.name === 'AbortError') {
      console.warn(`Request timed out after ${timeoutMs}ms: ${url}`);
    }
    throw error;
  }
};

export default fetchWithTimeout;
