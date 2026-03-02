import { useState, useCallback } from 'react';
import { apiFetch, getToken } from './api';

export interface TemplateSummary {
  key: string;
  label: string;
  placeholders: string[];
  updatedAt: string;
}

export interface TemplateDetail extends TemplateSummary {
  htmlContent: string;
}

export function useAdminTemplates() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<TemplateDetail | null>(null);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<TemplateSummary[]>('/admin/templates');
      setTemplates(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Vorlagen');
    }
  }, []);

  const fetchTemplate = useCallback(async (key: string) => {
    setError(null);
    try {
      const data = await apiFetch<TemplateDetail>(`/admin/templates/${key}`);
      setActiveTemplate(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Vorlage');
    }
  }, []);

  const updateTemplate = useCallback(async (key: string, htmlContent: string) => {
    setError(null);
    setSaving(true);
    try {
      await apiFetch(`/admin/templates/${key}`, {
        method: 'PUT',
        body: JSON.stringify({ htmlContent }),
      });
      if (activeTemplate && activeTemplate.key === key) {
        setActiveTemplate({ ...activeTemplate, htmlContent });
      }
      await fetchTemplates();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  }, [activeTemplate, fetchTemplates]);

  const previewTemplate = useCallback(async (key: string, htmlContent: string) => {
    setError(null);
    setPreviewing(true);
    try {
      const token = getToken();
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (token) headers['Authorization'] = `Bearer ${token}`;

      const res = await fetch(`/api/admin/templates/${key}/preview`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ htmlContent }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({ error: 'Fehler bei der Vorschau' }));
        throw new Error(body.error || `HTTP ${res.status}`);
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
      setTimeout(() => URL.revokeObjectURL(url), 60000);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler bei der Vorschau');
    } finally {
      setPreviewing(false);
    }
  }, []);

  const uploadImage = useCallback(async (file: File): Promise<string> => {
    const token = getToken();
    const form = new FormData();
    form.append('image', file);

    const headers: Record<string, string> = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch('/api/admin/templates/upload-image', {
      method: 'POST',
      headers,
      body: form,
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({ error: 'Upload fehlgeschlagen' }));
      throw new Error(body.error || `HTTP ${res.status}`);
    }

    const data = await res.json();
    return data.url;
  }, []);

  return {
    templates,
    activeTemplate,
    saving,
    previewing,
    error,
    fetchTemplates,
    fetchTemplate,
    updateTemplate,
    previewTemplate,
    setActiveTemplate,
    uploadImage,
  };
}
