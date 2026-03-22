import { useEffect } from 'react';
import { Modal, Select, Divider, Typography } from 'antd';
import type { TemplateSummary, TemplateMapping } from '../../lib/useAdminTemplates';

const { Text } = Typography;

const SENDING_POINT_LABELS: Record<string, string> = {
  'email:booking_confirmation': 'Buchungsbestätigung',
  'email:contact_copy': 'Kontaktformular-Kopie',
  'email:cancellation_erstgespraech': 'Absage Erstgespräch',
  'email:cancellation_einzeltherapie': 'Absage Einzeltherapie',
  'email:cancellation_gruppentherapie': 'Absage Gruppentherapie',
  'email:document_cover': 'Dokument-Anschreiben',
  'email:invoice_cover': 'Rechnungs-Anschreiben',
  'email:workbook_send': 'Arbeitsmappe versenden',
  'pdf:rechnung': 'Rechnung',
  'pdf:rechnung_erstgespraech': 'Rechnung Erstgespräch',
  'pdf:rechnung_einzeltherapie': 'Rechnung Einzeltherapie',
  'pdf:rechnung_gruppentherapie': 'Rechnung Gruppentherapie',
  'pdf:zahlungsaufforderung_erstgespraech': 'Zahlungsaufforderung Erstgespräch',
  'pdf:vertrag_einzeltherapie': 'Vertrag Einzeltherapie',
  'pdf:vertrag_gruppentherapie': 'Vertrag Gruppentherapie',
  'pdf:datenschutzinfo': 'Datenschutzinformation',
  'pdf:datenschutz_digital': 'Datenschutz Digital',
  'pdf:email_einwilligung': 'E-Mail-Einwilligung',
  'pdf:onlinetherapie': 'Onlinetherapie-Vereinbarung',
  'pdf:schweigepflichtentbindung': 'Schweigepflichtentbindung',
  'pdf:video_einverstaendnis': 'Video-Einverständnis',
};

export default function TemplateMappingModal({
  open,
  onClose,
  mappings,
  templates,
  onUpdate,
  onLoad,
}: {
  open: boolean;
  onClose: () => void;
  mappings: TemplateMapping[];
  templates: TemplateSummary[];
  onUpdate: (sendingPoint: string, templateKey: string | null) => void;
  onLoad: () => void;
}) {
  useEffect(() => {
    if (open) onLoad();
  }, [open, onLoad]);

  const emailMappings = mappings.filter(m => m.sendingPoint.startsWith('email:'));
  const pdfMappings = mappings.filter(m => m.sendingPoint.startsWith('pdf:'));

  const templateOptions = [
    { value: '', label: 'Standard (PHP-Datei)' },
    ...templates.map(t => ({ value: t.key, label: t.label })),
  ];

  const renderRow = (m: TemplateMapping) => (
    <div key={m.sendingPoint} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', gap: 16 }}>
      <Text style={{ flex: '0 0 auto', minWidth: 200 }}>
        {SENDING_POINT_LABELS[m.sendingPoint] || m.sendingPoint}
      </Text>
      <Select
        value={m.templateKey || ''}
        onChange={(val) => onUpdate(m.sendingPoint, val || null)}
        options={templateOptions}
        style={{ flex: '1 1 auto', minWidth: 200 }}
      />
    </div>
  );

  return (
    <Modal
      title="Vorlagen-Zuordnungen"
      open={open}
      onCancel={onClose}
      footer={null}
      width={700}
    >
      <Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
        Ordne E-Mail- und PDF-Versandpunkten individuelle Vorlagen zu. Bei &quot;Standard&quot; wird die eingebaute PHP-Vorlage verwendet.
      </Text>

      <Divider titlePlacement="left">E-Mail-Vorlagen</Divider>
      {emailMappings.map(renderRow)}

      <Divider titlePlacement="left">PDF-Vorlagen</Divider>
      {pdfMappings.map(renderRow)}
    </Modal>
  );
}
