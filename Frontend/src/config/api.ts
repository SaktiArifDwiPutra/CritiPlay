/**
 * Centralized API & Backend URL configuration for CritiPlay Frontend.
 *
 * In local development, falls back to 'http://127.0.0.1:8000'.
 * In production (e.g. Vercel deployment), set VITE_BACKEND_URL to 'https://api.critiplay.my.id'.
 */

const rawBackendUrl =
  (import.meta.env.VITE_BACKEND_URL as string | undefined) || 'http://127.0.0.1:8000';

// Strip any trailing slash to ensure clean URL concatenation
export const BACKEND_URL = rawBackendUrl.replace(/\/+$/, '');

export const API_BASE_URL = `${BACKEND_URL}/api`;

export const GOOGLE_AUTH_URL = `${BACKEND_URL}/auth/google/redirect`;

/**
 * Normalizes and resolves storage URLs (e.g., user avatars).
 * If the path is already an absolute URL (Google avatar, external image, data URL), returns it unchanged.
 * If null/empty, returns null.
 * Otherwise, prepends `${BACKEND_URL}/storage/`.
 */
export const getStorageUrl = (path: string | null | undefined): string | null => {
  if (!path) return null;
  if (
    path.startsWith('http://') ||
    path.startsWith('https://') ||
    path.startsWith('blob:') ||
    path.startsWith('data:')
  ) {
    return path;
  }
  const cleanPath = path.replace(/^\/?(storage\/)?/, '');
  return `${BACKEND_URL}/storage/${cleanPath}`;
};
