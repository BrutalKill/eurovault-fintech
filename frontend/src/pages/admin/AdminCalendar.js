import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar, Clock, Phone, Mail, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || '';

const MONTH_NAMES = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const DAY_NAMES   = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const STATUS_COLORS = {
  'Novo':          '#3A86FF',
  'Depositado':    '#22c58b',
  'Call Later':    '#FFBE0B',
  'Low Potential': '#7a8299',
  'No Answer':     '#4a5068',
  'VIP':           '#F59E0B',
};

function daysInMonth(m, y) {
  return new Date(y, m, 0).getDate();
}
function firstDayOfMonth(m, y) {
  return new Date(y, m - 1, 1).getDay();
}

export default function AdminCalendar() {
  const navigate = useNavigate();
  const now      = new Date();
  const [month, setMonth]     = useState(now.getMonth() + 1);
  const [year, setYear]       = useState(now.getFullYear());
  const [events, setEvents]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null); // dia seleccionado

  const fetchCalendar = async () => {
    setLoading(true);
    const token = localStorage.getItem('adminToken');
    try {
      const res = await fetch(`${BACKEND_URL}/api/admin/calendar?month=${month}&year=${year}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.events || []);
      }
    } catch (_) {}
    setLoading(false);
  };

  useEffect(() => { fetchCalendar(); }, [month, year]); // eslint-disable-line

  const prevMonth = () => { if (month === 1) { setMonth(12); setYear(y => y - 1); } else setMonth(m => m - 1); };
  const nextMonth = () => { if (month === 12) { setMonth(1); setYear(y => y + 1); } else setMonth(m => m + 1); };

  const days    = daysInMonth(month, year);
  const firstDay = firstDayOfMonth(month, year);
  const today   = now.getDate();
  const isToday = (d) => d === today && month === now.getMonth() + 1 && year === now.getFullYear();

  // Agrupar eventos por dia
  const eventsByDay = events.reduce((acc, e) => {
    const d = e.day;
    if (!acc[d]) acc[d] = [];
    acc[d].push(e);
    return acc;
  }, {});

  const selectedEvents = selected ? (eventsByDay[selected] || []) : [];

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 20, fontWeight: 700, color: '#f3f5ff', margin: 0 }}>
            Calendário de Follow-ups
          </h1>
          <p style={{ fontSize: 13, color: '#7a8299', margin: '4px 0 0' }}>
            {events.length} contacto{events.length !== 1 ? 's' : ''} agendado{events.length !== 1 ? 's' : ''} em {MONTH_NAMES[month - 1]} {year}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button onClick={prevMonth} style={{ width: 36, height: 36, background: '#111118', border: '1px solid #26263a', borderRadius: 9, cursor: 'pointer', color: '#f3f5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronLeft size={16} />
          </button>
          <span style={{ fontFamily: 'var(--font-heading)', fontSize: 16, fontWeight: 700, color: '#f3f5ff', minWidth: 160, textAlign: 'center' }}>
            {MONTH_NAMES[month - 1]} {year}
          </span>
          <button onClick={nextMonth} style={{ width: 36, height: 36, background: '#111118', border: '1px solid #26263a', borderRadius: 9, cursor: 'pointer', color: '#f3f5ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ChevronRight size={16} />
          </button>
          <button onClick={() => { setMonth(now.getMonth()+1); setYear(now.getFullYear()); setSelected(today); }}
            style={{ padding: '7px 14px', background: 'rgba(58,134,255,0.12)', border: '1px solid rgba(58,134,255,0.3)', borderRadius: 9, color: '#3A86FF', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
            Hoje
          </button>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 300px', gap: 16, alignItems: 'start' }}>

        {/* Calendário */}
        <div style={{ background: '#111118', border: '1px solid #26263a', borderRadius: 16, overflow: 'hidden' }}>
          {/* Cabeçalho dos dias da semana */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)', background: '#0d0d1a' }}>
            {DAY_NAMES.map(d => (
              <div key={d} style={{ padding: '10px 0', textAlign: 'center', fontSize: 11, fontWeight: 700, color: '#4a5068', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{d}</div>
            ))}
          </div>

          {/* Grid dos dias */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7,1fr)' }}>
            {/* Células vazias antes do 1º dia */}
            {[...Array(firstDay)].map((_, i) => (
              <div key={`empty-${i}`} style={{ minHeight: 80, borderRight: '1px solid #1a1a2a', borderBottom: '1px solid #1a1a2a', background: 'rgba(0,0,0,0.2)' }} />
            ))}

            {/* Dias do mês */}
            {[...Array(days)].map((_, i) => {
              const day = i + 1;
              const dayEvents = eventsByDay[day] || [];
              const isSelected = selected === day;
              const _isToday = isToday(day);

              return (
                <div key={day}
                  onClick={() => setSelected(isSelected ? null : day)}
                  style={{
                    minHeight: 80, padding: '6px',
                    borderRight: '1px solid #1a1a2a', borderBottom: '1px solid #1a1a2a',
                    cursor: 'pointer',
                    background: isSelected ? 'rgba(58,134,255,0.12)' : 'transparent',
                    transition: 'background .15s',
                  }}
                  onMouseEnter={e => { if (!isSelected) e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; }}
                  onMouseLeave={e => { if (!isSelected) e.currentTarget.style.background = 'transparent'; }}>
                  {/* Número do dia */}
                  <div style={{
                    width: 24, height: 24, borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 12, fontWeight: _isToday ? 900 : 500,
                    background: _isToday ? '#3A86FF' : 'transparent',
                    color: _isToday ? '#fff' : isSelected ? '#3A86FF' : 'hsl(215,16%,70%)',
                    marginBottom: 4,
                  }}>
                    {day}
                  </div>

                  {/* Eventos deste dia */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {dayEvents.slice(0, 2).map((ev, ei) => (
                      <div key={ei} style={{
                        fontSize: 9, fontWeight: 700, padding: '2px 5px', borderRadius: 4,
                        background: `${STATUS_COLORS[ev.status] || '#3A86FF'}20`,
                        color: STATUS_COLORS[ev.status] || '#3A86FF',
                        whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                      }}>
                        {ev.full_name?.split(' ')[0]}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div style={{ fontSize: 9, color: '#4a5068', fontWeight: 700 }}>+{dayEvents.length - 2}</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Painel lateral: eventos do dia seleccionado */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {selected ? (
            <>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#f3f5ff', padding: '14px 18px', background: '#111118', border: '1px solid #26263a', borderRadius: 12 }}>
                <Calendar size={14} style={{ marginRight: 8 }} color="#3A86FF" />
                {selected} de {MONTH_NAMES[month - 1]}
                <span style={{ fontSize: 12, color: '#7a8299', fontWeight: 400, marginLeft: 8 }}>
                  {selectedEvents.length} contacto{selectedEvents.length !== 1 ? 's' : ''}
                </span>
              </div>

              {selectedEvents.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', color: '#4a5068', background: '#111118', border: '1px solid #26263a', borderRadius: 12 }}>
                  <Calendar size={24} style={{ opacity: 0.2, marginBottom: 8 }} />
                  <p style={{ fontSize: 12, margin: 0 }}>Nenhum follow-up neste dia</p>
                </div>
              ) : selectedEvents.map((ev, i) => (
                <div key={i} style={{ background: '#111118', border: `1px solid ${STATUS_COLORS[ev.status] || '#26263a'}30`, borderRadius: 12, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid #1e1e30' }}>
                    <div style={{ width: 34, height: 34, borderRadius: '50%', background: `${STATUS_COLORS[ev.status] || '#3A86FF'}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color: STATUS_COLORS[ev.status] || '#3A86FF', flexShrink: 0 }}>
                      {ev.full_name?.[0]?.toUpperCase()}
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#f3f5ff' }}>{ev.full_name}</div>
                      <span style={{ fontSize: 9, padding: '1px 6px', borderRadius: 4, background: `${STATUS_COLORS[ev.status] || '#26263a'}20`, color: STATUS_COLORS[ev.status] || '#7a8299', fontWeight: 800 }}>{ev.status}</span>
                    </div>
                  </div>
                  <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#FFBE0B' }}>
                      <Clock size={11} />
                      {ev.followup_date ? new Date(ev.followup_date).toLocaleString('pt-PT', { hour: '2-digit', minute: '2-digit' }) : '—'}
                    </div>
                    {ev.email && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#7a8299' }}>
                        <Mail size={11} />{ev.email}
                      </div>
                    )}
                    {ev.phone && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 7, fontSize: 11, color: '#7a8299' }}>
                        <Phone size={11} />{ev.phone}
                      </div>
                    )}
                    {ev.followup_note && (
                      <div style={{ fontSize: 11, color: 'hsl(215,16%,60%)', fontStyle: 'italic', padding: '6px 8px', background: 'rgba(255,190,11,0.06)', border: '1px solid rgba(255,190,11,0.15)', borderRadius: 7 }}>
                        "{ev.followup_note}"
                      </div>
                    )}
                    <button
                      onClick={() => navigate('/adm')}
                      style={{ width: '100%', marginTop: 4, padding: '7px', background: 'rgba(58,134,255,0.08)', border: '1px solid rgba(58,134,255,0.2)', borderRadius: 8, color: '#3A86FF', fontSize: 11, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 5 }}>
                      <User size={11} />Ver Lead
                    </button>
                  </div>
                </div>
              ))}
            </>
          ) : (
            <div style={{ padding: '32px 16px', textAlign: 'center', color: '#4a5068', background: '#111118', border: '1px solid #26263a', borderRadius: 12 }}>
              <Calendar size={28} style={{ opacity: 0.2, marginBottom: 10 }} />
              <p style={{ fontSize: 13, margin: '0 0 6px' }}>Clique num dia para ver os follow-ups</p>
              {events.length > 0 && (
                <p style={{ fontSize: 11, color: '#26263a', margin: 0 }}>{events.length} follow-up{events.length !== 1 ? 's' : ''} este mês</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
