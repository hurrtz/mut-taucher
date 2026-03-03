import { useState, useCallback } from 'react';
import { apiFetch } from './api';
import type { WorkbookMaterial } from './data';

export function useAdminWorkbook() {
  const [materials, setMaterials] = useState<WorkbookMaterial[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchMaterials = useCallback(async () => {
    setError(null);
    try {
      const data = await apiFetch<WorkbookMaterial[]>('/admin/workbook');
      setMaterials(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Laden der Materialien');
    }
  }, []);

  const uploadMaterial = useCallback(async (file: File, name: string, groupName?: string) => {
    setError(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      fd.append('name', name);
      if (groupName) fd.append('groupName', groupName);

      const result = await apiFetch<WorkbookMaterial>('/admin/workbook', {
        method: 'POST',
        body: fd,
      });
      setMaterials(prev => [...prev, result]);
      return result;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Hochladen');
      return null;
    }
  }, []);

  const removeMaterial = useCallback(async (id: number) => {
    setError(null);
    try {
      await apiFetch(`/admin/workbook/${id}`, { method: 'DELETE' });
      setMaterials(prev => prev.filter(m => m.id !== id));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Löschen');
    }
  }, []);

  const sendMaterial = useCallback(async (id: number, clientIds: number[]) => {
    setError(null);
    try {
      const result = await apiFetch<{ results: { clientId: number; success: boolean; error?: string }[] }>(
        `/admin/workbook/${id}/send`,
        { method: 'POST', body: JSON.stringify({ clientIds }) },
      );
      return result.results;
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Fehler beim Versenden');
      return null;
    }
  }, []);

  return { materials, error, fetchMaterials, uploadMaterial, removeMaterial, sendMaterial };
}
