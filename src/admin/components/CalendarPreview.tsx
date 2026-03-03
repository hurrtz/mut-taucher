import { useState, useMemo, useEffect } from 'react';
import type { RecurringRule, Event } from '../../lib/data';
import type { CalendarSession, BlockedDay } from '../../lib/useAdminBooking';
import { generateSlots } from '../../lib/useBooking';
import { CATEGORY_COLORS } from '../constants';
import type { EventCategory } from '../constants';
import {
  format, startOfMonth, addMonths, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameDay, isSameMonth,
} from 'date-fns';
import { de } from 'date-fns/locale';
import { Card, Button, Tag, Modal, Tooltip } from 'antd';
import { LeftOutlined, RightOutlined, CalendarOutlined, StopOutlined, UnlockOutlined } from '@ant-design/icons';

export default function CalendarPreview({ rules, events, onToggleException, calendarSessions, blockedDays, onBlockDay, onUnblockDay, onCancelSession, onMonthChange }: {
  rules: RecurringRule[];
  events: Event[];
  onToggleException: (ruleId: string, date: string) => void;
  calendarSessions: CalendarSession[];
  blockedDays: BlockedDay[];
  onBlockDay: (date: string) => void;
  onUnblockDay: (date: string) => void;
  onCancelSession: (type: 'einzeltherapie' | 'gruppentherapie', sessionId: number) => void;
  onMonthChange: (from: string, to: string) => void;
}) {
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(new Date()));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const blockedDateSet = useMemo(
    () => new Set(blockedDays.map(bd => bd.date)),
    [blockedDays]
  );

  useEffect(() => {
    onMonthChange(format(calendarStart, 'yyyy-MM-dd'), format(calendarEnd, 'yyyy-MM-dd'));
  }, [currentMonth.getTime()]);

  const allSlots = useMemo(
    () => generateSlots(rules, calendarStart, calendarEnd, [], events),
    [rules, events, calendarStart.getTime(), calendarEnd.getTime()]
  );

  const handleBlockDay = (dateStr: string) => {
    Modal.confirm({
      title: 'Tag sperren?',
      content: `Möchten Sie den ${format(new Date(dateStr), 'd. MMMM yyyy', { locale: de })} sperren? Alle Termine an diesem Tag werden abgesagt.`,
      okText: 'Sperren',
      okType: 'danger',
      cancelText: 'Abbrechen',
      onOk: () => onBlockDay(dateStr),
    });
  };

  const handleCancelSession = (session: CalendarSession) => {
    Modal.confirm({
      title: 'Sitzung absagen?',
      content: `${session.label} am ${format(new Date(session.sessionDate), 'd. MMM yyyy', { locale: de })} um ${session.sessionTime} Uhr absagen?`,
      okText: 'Absagen',
      okType: 'danger',
      cancelText: 'Abbrechen',
      onOk: () => onCancelSession(session.category, session.sessionId),
    });
  };

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
          const isBlocked = blockedDateSet.has(dateStr);

          const daySessions = calendarSessions.filter(s => s.sessionDate === dateStr);

          const cancelledOnDay = isBlocked ? [] : rules.flatMap(r =>
            r.exceptions.includes(dateStr)
              ? [{ ruleId: r.id, time: r.time }]
              : []
          );

          return (
            <div
              key={i}
              className="cal-day"
              style={{
                position: 'relative',
                minHeight: 60,
                padding: 4,
                borderRadius: 8,
                border: `1px solid ${isBlocked ? '#ffa39e' : isToday ? '#91caff' : inCurrentMonth ? '#f0f0f0' : '#f5f5f5'}`,
                backgroundColor: isBlocked ? '#fff1f0' : isToday ? '#e6f4ff' : inCurrentMonth ? '#ffffff' : '#fafafa',
                opacity: inCurrentMonth ? 1 : 0.4,
                fontSize: 11,
                boxSizing: 'border-box',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 2,
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: isToday ? 700 : 400,
                    color: isBlocked ? '#cf1322' : isToday ? '#1677ff' : '#8c8c8c',
                    flex: 1,
                    textAlign: 'center',
                  }}
                >
                  {format(day, 'd')}
                </span>
                {inCurrentMonth && !isBlocked && (
                  <Tooltip title="Tag sperren">
                    <StopOutlined
                      style={{
                        fontSize: 10,
                        color: '#d9d9d9',
                        cursor: 'pointer',
                        position: 'absolute',
                        top: 4,
                        right: 4,
                      }}
                      className="day-block-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleBlockDay(dateStr);
                      }}
                    />
                  </Tooltip>
                )}
                {inCurrentMonth && isBlocked && (
                  <Tooltip title="Sperre aufheben">
                    <UnlockOutlined
                      style={{
                        fontSize: 10,
                        color: '#cf1322',
                        cursor: 'pointer',
                        position: 'absolute',
                        top: 4,
                        right: 4,
                      }}
                      onClick={(e) => {
                        e.stopPropagation();
                        onUnblockDay(dateStr);
                      }}
                    />
                  </Tooltip>
                )}
              </div>
              {isBlocked && (
                <div style={{ textAlign: 'center', fontSize: 9, color: '#cf1322', fontWeight: 600, marginBottom: 2 }}>
                  Gesperrt
                </div>
              )}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {daySlots.map(slot => (
                  <Tag
                    key={slot.id}
                    color={CATEGORY_COLORS[(slot.category ?? (slot.eventId ? 'andere' : 'erstgespraech')) as EventCategory]}
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
                {daySessions.map(session => (
                  <Tag
                    key={`session-${session.sessionId}`}
                    color={CATEGORY_COLORS[session.category]}
                    style={{
                      fontSize: 10,
                      cursor: 'pointer',
                      margin: 0,
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                      display: 'block',
                    }}
                    title={`${session.label} — Klicken zum Absagen`}
                    onClick={() => handleCancelSession(session)}
                  >
                    {session.sessionTime} {session.label.substring(0, 6)}
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

      {/* Hover styles for block button */}
      <style>{`.cal-day:hover .day-block-btn { color: #8c8c8c !important; }`}</style>

      {/* Legend */}
      <div style={{ marginTop: 12, display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
        <Tag color="cyan" style={{ margin: 0 }}>Erstgespräch</Tag>
        <Tag color="blue" style={{ margin: 0 }}>Einzeltherapie</Tag>
        <Tag color="purple" style={{ margin: 0 }}>Gruppentherapie</Tag>
        <Tag color="gold" style={{ margin: 0 }}>Andere</Tag>
        <Tag color="default" style={{ margin: 0 }}>Ausnahme</Tag>
        <Tag color="error" style={{ margin: 0 }}>Gesperrt</Tag>
      </div>
    </Card>
  );
}
