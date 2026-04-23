import { useEffect, useState } from 'react';
import { Modal, DatePicker, TimePicker, InputNumber, Form, Typography } from 'antd';
import type { Dayjs } from 'dayjs';

const { Text } = Typography;

export interface AddSessionSubmit {
  date: string;           // YYYY-MM-DD
  time: string;           // HH:mm
  durationMinutes?: number;
  sessionCostCentsOverride?: number | null;
}

interface Props {
  open: boolean;
  onClose: () => void;
  onSubmit: (payload: AddSessionSubmit) => Promise<void>;
  defaultDurationMinutes: number;
  defaultCostCents: number;
  title?: string;
}

export default function AddSessionModal({
  open,
  onClose,
  onSubmit,
  defaultDurationMinutes,
  defaultCostCents,
  title = 'Einzeltermin hinzufügen',
}: Props) {
  const [date, setDate] = useState<Dayjs | null>(null);
  const [time, setTime] = useState<Dayjs | null>(null);
  const [duration, setDuration] = useState<number>(defaultDurationMinutes);
  const [costEuro, setCostEuro] = useState<number>(defaultCostCents / 100);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (open) {
      setDate(null);
      setTime(null);
      setDuration(defaultDurationMinutes);
      setCostEuro(defaultCostCents / 100);
    }
  }, [open, defaultDurationMinutes, defaultCostCents]);

  const canSubmit = !!date && !!time && !submitting;

  const handleOk = async () => {
    if (!date || !time) return;
    setSubmitting(true);
    try {
      const costCents = Math.round(costEuro * 100);
      const override = costCents === defaultCostCents ? undefined : costCents;
      const dur = duration === defaultDurationMinutes ? undefined : duration;
      await onSubmit({
        date: date.format('YYYY-MM-DD'),
        time: time.format('HH:mm'),
        durationMinutes: dur,
        sessionCostCentsOverride: override,
      });
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal
      title={title}
      open={open}
      onCancel={onClose}
      onOk={handleOk}
      okText="Hinzufügen"
      cancelText="Abbrechen"
      okButtonProps={{ disabled: !canSubmit, loading: submitting }}
    >
      <Form layout="vertical">
        <Form.Item label="Datum" required>
          <DatePicker
            value={date}
            onChange={(v: Dayjs | null) => setDate(v)}
            format="DD.MM.YYYY"
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="Uhrzeit" required>
          <TimePicker
            value={time}
            onChange={(v: Dayjs | null) => setTime(v)}
            format="HH:mm"
            minuteStep={5}
            style={{ width: '100%' }}
          />
        </Form.Item>
        <Form.Item label="Dauer (Min.)">
          <InputNumber
            value={duration}
            onChange={v => setDuration(Number(v))}
            min={15}
            step={5}
            style={{ width: '100%' }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>Standard: {defaultDurationMinutes} Min.</Text>
        </Form.Item>
        <Form.Item label="Kosten (€)">
          <InputNumber
            value={costEuro}
            onChange={v => setCostEuro(Number(v))}
            min={0}
            step={5}
            precision={2}
            decimalSeparator=","
            style={{ width: '100%' }}
          />
          <Text type="secondary" style={{ fontSize: 12 }}>
            Standard: {(defaultCostCents / 100).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </Text>
        </Form.Item>
      </Form>
    </Modal>
  );
}
