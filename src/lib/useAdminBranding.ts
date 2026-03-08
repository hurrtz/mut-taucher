import { useState, useCallback } from 'react';
import { apiFetch, getToken } from './api';

export interface BrandSettings {
  practiceName: string;
  subtitle: string;
  logoPath: string | null;
  logoUrl: string | null;
  logoLongPath: string | null;
  logoLongUrl: string | null;
  logoTallPath: string | null;
  logoTallUrl: string | null;
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  fontSizeBody: number;
  fontSizeHeading: number;
}

export function useAdminBranding() {
  const [settings, setSettings] = useState<BrandSettings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchBranding = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiFetch<BrandSettings>('/admin/branding');
      setSettings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Branding-Einstellungen');
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBranding = useCallback(async (updates: Partial<Omit<BrandSettings, 'logoPath' | 'logoUrl'>>) => {
    setSaving(true);
    setError(null);
    try {
      const data = await apiFetch<BrandSettings>('/admin/branding', {
        method: 'PUT',
        body: JSON.stringify(updates),
      });
      setSettings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern');
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  const uploadLogo = useCallback(async (file: File, variant: 'default' | 'long' | 'tall' = 'default') => {
    setSaving(true);
    setError(null);
    try {
      const token = getToken();
      const form = new FormData();
      form.append('logo', file);
      form.append('variant', variant);

      const headers: Record<string, string> = {};
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch('/api/admin/branding/logo', {
        method: 'POST',
        headers,
        body: form,
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Upload fehlgeschlagen' }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const data = await res.json();
      const keyMap = {
        default: { path: 'logoPath', url: 'logoUrl' },
        long: { path: 'logoLongPath', url: 'logoLongUrl' },
        tall: { path: 'logoTallPath', url: 'logoTallUrl' },
      } as const;
      const keys = keyMap[variant];
      setSettings(prev => prev ? { ...prev, [keys.path]: data.logoPath, [keys.url]: data.logoUrl } : prev);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Hochladen');
      throw e;
    } finally {
      setSaving(false);
    }
  }, []);

  return {
    settings,
    loading,
    saving,
    error,
    fetchBranding,
    updateBranding,
    uploadLogo,
  };
}
