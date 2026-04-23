import { Tag } from 'antd';
import type { DocumentStatus } from '../../lib/data';

export default function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  if (status === null || status === 'complete') return null;
  if (status === 'sends-pending') {
    return <Tag color="red">Dokumente fehlen</Tag>;
  }
  if (status === 'signed-pending') {
    return <Tag color="orange">Unterschriften fehlen</Tag>;
  }
  return null;
}
