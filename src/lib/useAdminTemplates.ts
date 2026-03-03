import { useState, useCallback } from 'react';
import { apiFetch, getToken } from './api';

export interface TemplateSummary {
  key: string;
  label: string;
  groupName: string | null;
  placeholders: string[];
  updatedAt: string;
}

export interface TemplateDetail extends TemplateSummary {
  htmlContent: string;
}

export interface TemplateMapping {
  sendingPoint: string;
  templateKey: string | null;
  updatedAt: string;
}

export function useAdminTemplates() {
  const [templates, setTemplates] = useState<TemplateSummary[]>([]);
  const [activeTemplate, setActiveTemplate] = useState<TemplateDetail | null>(null);
  const [mappings, setMappings] = useState<TemplateMapping[]>([]);
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

  const createTemplate = useCallback(async (key: string, label: string, groupName?: string) => {
    setError(null);
    try {
      await apiFetch('/admin/templates', {
        method: 'POST',
        body: JSON.stringify({ key, label, groupName: groupName || null }),
      });
      await fetchTemplates();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Erstellen');
      throw e;
    }
  }, [fetchTemplates]);

  const removeTemplate = useCallback(async (key: string) => {
    setError(null);
    try {
      await apiFetch(`/admin/templates/${key}`, { method: 'DELETE' });
      if (activeTemplate?.key === key) setActiveTemplate(null);
      setTemplates(prev => prev.filter(t => t.key !== key));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Löschen');
    }
  }, [activeTemplate]);

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

  const updateTemplateGroup = useCallback(async (key: string, groupName: string | null) => {
    setError(null);
    try {
      await apiFetch(`/admin/templates/${key}/group`, {
        method: 'PATCH',
        body: JSON.stringify({ groupName }),
      });
      if (activeTemplate?.key === key) {
        setActiveTemplate({ ...activeTemplate, groupName });
      }
      await fetchTemplates();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren der Gruppe');
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

  const fetchMappings = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<TemplateMapping[]>('/admin/template-mappings');
      setMappings(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Zuordnungen');
    }
  }, []);

  const updateMapping = useCallback(async (sendingPoint: string, templateKey: string | null) => {
    setError(null);
    try {
      await apiFetch('/admin/template-mappings', {
        method: 'PUT',
        body: JSON.stringify({ sendingPoint, templateKey }),
      });
      setMappings(prev => prev.map(m =>
        m.sendingPoint === sendingPoint ? { ...m, templateKey } : m
      ));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Aktualisieren der Zuordnung');
    }
  }, []);

  return {
    templates,
    activeTemplate,
    mappings,
    saving,
    previewing,
    error,
    fetchTemplates,
    fetchTemplate,
    createTemplate,
    removeTemplate,
    updateTemplate,
    updateTemplateGroup,
    previewTemplate,
    setActiveTemplate,
    uploadImage,
    fetchMappings,
    updateMapping,
  };
}
