import { useState, useMemo } from 'react';
import type { RecurringRule, Event } from '../../lib/data';
import { generateSlots } from '../../lib/useBooking';
import {
  format, startOfMonth, addMonths, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, Button, Tag } from 'antd';
import { LeftOutlined, RightOutlined, CalendarOutlined } from '@ant-design/icons';



export default function CalendarPreview({ rules, events, onToggleException }: {
  rules: RecurringRule[];
  events: Event[];
  onToggleException: (ruleId: string, date: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const allSlots = useMemo(
    () => generateSlots(rules, calendarStart, calendarEnd, [], events),
    [rules, events, calendarStart.getTime(), calendarEnd.getTime()]
  );

  return (
    <Card
      size="default"
      style={{ width: '100%' }}
      title={
        <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <CalendarOutlined style={{ color: '#8c8c8c' }} />
          Vorschau: {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </span>
      }
      extra={
        <Button.Group>
          <Button
            size="small"
            icon={<LeftOutlined />}
            onClick={() => setCurrentMonth(addMonths(currentMonth, -1))}
          />
          <Button
            size="small"
            type="link"
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
            style={{ padding: '0 8px' }}
          >
            Heute
          </Button>
          <Button
            size="small"
            icon={<RightOutlined />}
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          />
        </Button.Group>
      }
    >
      {/* Day-of-week headers */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4, textAlign: 'center', marginBottom: 4 }}>
        {['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'].map(d => (
          <div key={d} style={{ fontSize: 11, fontWeight: 500, color: '#bfbfbf' }}>{d}</div>
        ))}
      </div>

      {/* Calendar grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 4 }}>
        {calendarDays.map((day, i) => {
          const inCurrentMonth = isSameMonth(day, currentMonth);
          const dateStr = format(day, 'yyyy-MM-dd');
          const daySlots = allSlots.filter(s => s.date === dateStr);
          const isToday = isSameDay(day, new Date());

          const cancelledOnDay = rules.flatMap(r =>
            r.exceptions.includes(dateStr)
              ? [{ ruleId: r.id, time: r.time }]
              : []
          );

          return (
            <div
              key={i}
              style={{
                minHeight: 60,
                padding: 4,
                borderRadius: 8,
                border: `1px solid ${isToday ? '#91caff' : inCurrentMonth ? '#f0f0f0' : '#f5f5f5'}`,
                backgroundColor: isToday ? '#e6f4ff' : inCurrentMonth ? '#ffffff' : '#fafafa',
                opacity: inCurrentMonth ? 1 : 0.4,
                fontSize: 11,
                boxSizing: 'border-box',
              }}
            >
              <div style={{
                textAlign: 'center',
                fontSize: 11,
                marginBottom: 2,
                fontWeight: isToday ? 700 : 400,
                color: isToday ? '#1677ff' : '#8c8c8c',
              }}>
                {format(day, 'd')}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {daySlots.map(slot => (
                  <Tag
                    key={slot.id}
                    color={slot.eventId ? 'gold' : 'cyan'}
                    style={{
                      fontSize: 10,
                      cursor: 'pointer',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}
                    title={slot.eventId ? 'Einzeltermin' : 'Klicken um als Ausnahme zu markieren'}
                    onClick={() => {
                      if (slot.ruleId) {
                        onToggleException(slot.ruleId, dateStr);
                      }
                    }}
                  >
                    {slot.time}
                  </Tag>
                ))}
                {cancelledOnDay.map((c, j) => (
                  <Tag
                    key={`exc-${j}`}
                    color="default"
                    style={{
                      fontSize: 10,
                      cursor: 'pointer',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                      textDecoration: 'line-through',
                    }}
                    title="Ausnahme aufheben"
                    onClick={() => onToggleException(c.ruleId, dateStr)}
                  >
                    {c.time}
                  </Tag>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Legend */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 16 }}>
        <Tag color="cyan" style={{ margin: 0 }}>Regel</Tag>
        <Tag color="gold" style={{ margin: 0 }}>Einzeltermin</Tag>
        <Tag color="default" style={{ margin: 0 }}>Ausnahme</Tag>
      </div>
    </Card>
  );
}
