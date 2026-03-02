import { useState, useCallback } from 'react';
import { apiFetch } from './api';

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

  return {
    templates,
    activeTemplate,
    saving,
    error,
    fetchTemplates,
    fetchTemplate,
    updateTemplate,
    setActiveTemplate,
  };
}
