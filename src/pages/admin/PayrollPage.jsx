// =============================================================================
// PayrollPage.jsx — Barba Construction CRM
// Full-featured payroll module with attendance, adjustments, and summaries
// =============================================================================

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { supabase } from '../../lib/supabase';
import { formatCurrency } from '../../lib/utils';
import PinLock from '../../components/PinLock';

// ---------------------------------------------------------------------------
// Constants & Helpers
// ---------------------------------------------------------------------------
const DAY_LABELS = ['SAB', 'DOM', 'LUN', 'MAR', 'MIE', 'JUE', 'VIE'];
const MONTH_NAMES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
const PRESET_GROUPS = ['OFICINA', 'GRUPO REGULAR', 'FENCE', 'FRAMEROS', 'SAIREROS', 'PINTORES'];

const ACCENT = '#FACB00';
const GREEN  = '#10b981';
const BG_CARD = '#1a1a1a';
const BORDER  = '#2a2a2a';
const TEXT_MUTED = '#888';

/** Returns the most recent Saturday (start of the SAT→FRI week) for a given date */
function getWeekStart(date = new Date()) {
  const d = new Date(date);
  const day = d.getDay(); // 0=Sun … 6=Sat
  const diff = day === 6 ? 0 : -(day + 1); // Saturday offset
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Returns array of 7 Date objects starting from weekStart (Sat→Fri) */
function getWeekDates(weekStart) {
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(d.getDate() + i);
    return d;
  });
}

function toISO(date) {
  return date.toISOString().split('T')[0];
}

function addWeeks(date, n) {
  const d = new Date(date);
  d.setDate(d.getDate() + n * 7);
  return d;
}

function fmtDate(date) {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]}`;
}

function fmtDateFull(date) {
  return `${date.getDate()} ${MONTH_NAMES[date.getMonth()]} ${date.getFullYear()}`;
}

/** Group array by key */
function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const k = item[key] || 'General';
    if (!acc[k]) acc[k] = [];
    acc[k].push(item);
    return acc;
  }, {});
}

// ---------------------------------------------------------------------------
// SQL Setup Template
// ---------------------------------------------------------------------------
const SETUP_SQL = `-- Run this SQL in your Supabase SQL editor to create the payroll tables:

CREATE TABLE payroll_workers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  group_name text NOT NULL DEFAULT 'General',
  daily_rate numeric NOT NULL DEFAULT 0,
  daily_rate_2 numeric,
  active boolean DEFAULT true,
  notes text,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE payroll_attendance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES payroll_workers(id) ON DELETE CASCADE,
  work_date date NOT NULL,
  worked boolean DEFAULT true,
  hours numeric,
  notes text,
  UNIQUE(worker_id, work_date)
);

CREATE TABLE payroll_adjustments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  worker_id uuid REFERENCES payroll_workers(id) ON DELETE CASCADE,
  week_start date NOT NULL,
  type text CHECK (type IN ('bonus','discount','reimbursement')) DEFAULT 'bonus',
  amount numeric DEFAULT 0,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS (optional, adjust policies as needed)
ALTER TABLE payroll_workers ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE payroll_adjustments ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users full access (adjust as needed)
CREATE POLICY "allow_all" ON payroll_workers FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON payroll_attendance FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all" ON payroll_adjustments FOR ALL USING (true) WITH CHECK (true);
`;

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

// Attendance Bubble
function AttendanceBubble({ label, worked, onClick, saving }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      title={label}
      style={{
        width: 40,
        height: 40,
        borderRadius: '50%',
        border: worked ? 'none' : `1.5px solid #333`,
        background: worked ? GREEN : '#111',
        cursor: saving ? 'wait' : 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 9,
        fontWeight: 700,
        color: worked ? '#fff' : TEXT_MUTED,
        boxShadow: worked ? `0 0 10px ${GREEN}88` : 'none',
        transition: 'all 0.18s ease',
        flexShrink: 0,
        letterSpacing: 0.3,
        opacity: saving ? 0.6 : 1,
      }}
    >
      {label}
    </button>
  );
}

// KPI Card
function KpiCard({ label, value, sub, color }) {
  return (
    <div style={{
      background: BG_CARD,
      border: `1px solid ${BORDER}`,
      borderRadius: 12,
      padding: '16px 20px',
      flex: '1 1 160px',
      minWidth: 140,
    }}>
      <div style={{ fontSize: 11, color: TEXT_MUTED, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>{label}</div>
      <div style={{ fontSize: 22, fontWeight: 800, color: color || '#fff', lineHeight: 1.1 }}>{value}</div>
      {sub && <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 4 }}>{sub}</div>}
    </div>
  );
}

// Modal backdrop + box
function Modal({ title, onClose, children, width = 480 }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)',
      zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '20px',
    }} onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{
        background: '#141414', border: `1px solid ${BORDER}`,
        borderRadius: 16, padding: 28, width: '100%', maxWidth: width,
        maxHeight: '90vh', overflowY: 'auto',
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
          <h3 style={{ margin: 0, fontSize: 17, fontWeight: 700, color: '#fff' }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: TEXT_MUTED, cursor: 'pointer', fontSize: 20, padding: '0 4px' }}>✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

// Styled input
function Input({ label, value, onChange, type = 'text', placeholder, style = {} }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginBottom: 5 }}>{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        style={{
          width: '100%', background: '#111', border: `1px solid ${BORDER}`,
          borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13,
          outline: 'none', boxSizing: 'border-box', ...style,
        }}
      />
    </div>
  );
}

// Select
function Select({ label, value, onChange, children, style = {} }) {
  return (
    <div style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 12, color: TEXT_MUTED, marginBottom: 5 }}>{label}</label>}
      <select
        value={value}
        onChange={onChange}
        style={{
          width: '100%', background: '#111', border: `1px solid ${BORDER}`,
          borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13,
          outline: 'none', boxSizing: 'border-box', ...style,
        }}
      >
        {children}
      </select>
    </div>
  );
}

// Group badge
function GroupBadge({ name }) {
  const colors = {
    'OFICINA': '#6366f1',
    'GRUPO REGULAR': '#f59e0b',
    'FENCE': '#3b82f6',
    'FRAMEROS': '#8b5cf6',
    'SAIREROS': '#ec4899',
    'PINTORES': '#14b8a6',
  };
  const bg = colors[name] || '#555';
  return (
    <span style={{
      background: bg + '22', border: `1px solid ${bg}66`,
      color: bg, borderRadius: 6, padding: '2px 8px',
      fontSize: 10, fontWeight: 700, letterSpacing: 0.5,
      whiteSpace: 'nowrap',
    }}>{name}</span>
  );
}

// Btn
function Btn({ onClick, children, variant = 'primary', small, disabled, style: s = {} }) {
  const base = {
    borderRadius: 8, fontWeight: 600, cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.5 : 1, border: 'none', transition: 'all 0.15s',
    fontSize: small ? 12 : 13, padding: small ? '5px 10px' : '9px 16px',
  };
  const variants = {
    primary:  { background: ACCENT, color: '#111' },
    danger:   { background: '#ef4444', color: '#fff' },
    ghost:    { background: '#ffffff11', color: '#fff' },
    success:  { background: GREEN, color: '#fff' },
  };
  return (
    <button onClick={onClick} disabled={disabled} style={{ ...base, ...variants[variant], ...s }}>
      {children}
    </button>
  );
}

// ---------------------------------------------------------------------------
// Worker Modal (Add / Edit)
// ---------------------------------------------------------------------------
function WorkerModal({ worker, groups, onSave, onClose }) {
  const [form, setForm] = useState({
    name: worker?.name || '',
    group_name: worker?.group_name || 'GRUPO REGULAR',
    daily_rate: worker?.daily_rate || '',
    daily_rate_2: worker?.daily_rate_2 || '',
    active: worker?.active !== false,
    notes: worker?.notes || '',
    newGroup: '',
  });
  const [saving, setSaving] = useState(false);
  const [useNewGroup, setUseNewGroup] = useState(false);

  const allGroups = [...new Set([...PRESET_GROUPS, ...groups])];

  async function handleSave() {
    if (!form.name.trim() || !form.daily_rate) return;
    setSaving(true);
    const groupName = useNewGroup ? form.newGroup.trim() : form.group_name;
    const data = {
      name: form.name.trim(),
      group_name: groupName || 'General',
      daily_rate: parseFloat(form.daily_rate) || 0,
      daily_rate_2: form.daily_rate_2 ? parseFloat(form.daily_rate_2) : null,
      active: form.active,
      notes: form.notes.trim() || null,
    };
    let res;
    if (worker?.id) {
      res = await supabase.from('payroll_workers').update(data).eq('id', worker.id).select().single();
    } else {
      res = await supabase.from('payroll_workers').insert(data).select().single();
    }
    setSaving(false);
    if (!res.error) onSave(res.data);
    else alert('Error: ' + res.error.message);
  }

  return (
    <Modal title={worker?.id ? 'Editar Trabajador' : 'Agregar Trabajador'} onClose={onClose}>
      <Input label="Nombre completo" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ej. Juan García" />

      {!useNewGroup ? (
        <Select label="Grupo" value={form.group_name} onChange={e => setForm(f => ({ ...f, group_name: e.target.value }))}>
          {allGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </Select>
      ) : (
        <Input label="Nuevo grupo" value={form.newGroup} onChange={e => setForm(f => ({ ...f, newGroup: e.target.value }))} placeholder="Nombre del grupo" />
      )}
      <button onClick={() => setUseNewGroup(v => !v)} style={{ background: 'none', border: 'none', color: ACCENT, cursor: 'pointer', fontSize: 12, marginTop: -8, marginBottom: 10, padding: 0 }}>
        {useNewGroup ? '← Usar grupo existente' : '+ Crear nuevo grupo'}
      </button>

      <Input label="Pago diario ($)" type="number" value={form.daily_rate} onChange={e => setForm(f => ({ ...f, daily_rate: e.target.value }))} placeholder="0.00" />
      <Input label="Pago diario 2 (opcional)" type="number" value={form.daily_rate_2} onChange={e => setForm(f => ({ ...f, daily_rate_2: e.target.value }))} placeholder="0.00" />
      <Input label="Notas" value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Observaciones..." />

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
        <input type="checkbox" id="wk-active" checked={form.active} onChange={e => setForm(f => ({ ...f, active: e.target.checked }))} />
        <label htmlFor="wk-active" style={{ color: '#ccc', fontSize: 13, cursor: 'pointer' }}>Activo</label>
      </div>

      <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
        <Btn variant="ghost" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={handleSave} disabled={saving || !form.name.trim() || !form.daily_rate}>
          {saving ? 'Guardando…' : (worker?.id ? 'Actualizar' : 'Agregar')}
        </Btn>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Adjustment inline row (bonus/discount/reimbursement)
// ---------------------------------------------------------------------------
function AdjustmentRow({ workerId, weekStart, adjustments, onChange }) {
  const bonus = adjustments.find(a => a.type === 'bonus' && a.worker_id === workerId);
  const discount = adjustments.find(a => a.type === 'discount' && a.worker_id === workerId);
  const reimb = adjustments.find(a => a.type === 'reimbursement' && a.worker_id === workerId);

  async function upsertAdj(type, amount, description) {
    if (!amount && amount !== 0) return;
    const existing = adjustments.find(a => a.type === type && a.worker_id === workerId);
    const data = { worker_id: workerId, week_start: weekStart, type, amount: parseFloat(amount) || 0, description };
    let res;
    if (existing) {
      res = await supabase.from('payroll_adjustments').update(data).eq('id', existing.id).select().single();
    } else {
      res = await supabase.from('payroll_adjustments').insert(data).select().single();
    }
    if (!res.error) onChange(res.data, existing?.id);
  }

  const fieldStyle = {
    width: 70, background: '#111', border: `1px solid ${BORDER}`,
    borderRadius: 6, padding: '4px 7px', color: '#fff', fontSize: 12, outline: 'none',
  };

  return (
    <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10, color: GREEN, fontWeight: 600 }}>+B</span>
        <input
          type="number"
          defaultValue={bonus?.amount || ''}
          onBlur={e => upsertAdj('bonus', e.target.value, 'Bono')}
          placeholder="0"
          style={fieldStyle}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10, color: '#ef4444', fontWeight: 600 }}>-D</span>
        <input
          type="number"
          defaultValue={discount?.amount || ''}
          onBlur={e => upsertAdj('discount', e.target.value, 'Descuento')}
          placeholder="0"
          style={fieldStyle}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <span style={{ fontSize: 10, color: '#60a5fa', fontWeight: 600 }}>+R</span>
        <input
          type="number"
          defaultValue={reimb?.amount || ''}
          onBlur={e => upsertAdj('reimbursement', e.target.value, 'Reembolso')}
          placeholder="0"
          style={fieldStyle}
        />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Worker Row in Semana Tab
// ---------------------------------------------------------------------------
function WorkerRow({ worker, weekDates, attendance, adjustments, onAttendanceToggle, onAdjustmentChange, onEdit, savingMap }) {
  const workedSet = new Set(
    attendance.filter(a => a.worker_id === worker.id && a.worked).map(a => a.work_date)
  );

  const daysWorked = weekDates.filter(d => workedSet.has(toISO(d))).length;
  const subtotal = daysWorked * (worker.daily_rate || 0);

  const bonus = adjustments.filter(a => a.type === 'bonus' && a.worker_id === worker.id).reduce((s, a) => s + (a.amount || 0), 0);
  const discount = adjustments.filter(a => a.type === 'discount' && a.worker_id === worker.id).reduce((s, a) => s + (a.amount || 0), 0);
  const reimb = adjustments.filter(a => a.type === 'reimbursement' && a.worker_id === worker.id).reduce((s, a) => s + (a.amount || 0), 0);
  const total = subtotal + bonus - discount + reimb;

  return (
    <div style={{
      background: '#111', border: `1px solid ${BORDER}`, borderRadius: 10,
      padding: '12px 14px', marginBottom: 8,
    }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{worker.name}</span>
          <GroupBadge name={worker.group_name} />
          <span style={{ fontSize: 11, color: TEXT_MUTED }}>{formatCurrency(worker.daily_rate)}/día</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 12, color: TEXT_MUTED }}>{daysWorked}d</span>
          <span style={{ fontWeight: 700, color: total >= 0 ? ACCENT : '#ef4444', fontSize: 15 }}>{formatCurrency(total)}</span>
          <Btn small variant="ghost" onClick={() => onEdit(worker)}>✏️</Btn>
        </div>
      </div>

      {/* Attendance bubbles */}
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
        {weekDates.map((d, i) => {
          const iso = toISO(d);
          const worked = workedSet.has(iso);
          const key = `${worker.id}-${iso}`;
          return (
            <AttendanceBubble
              key={iso}
              label={DAY_LABELS[i]}
              worked={worked}
              saving={savingMap[key]}
              onClick={() => onAttendanceToggle(worker.id, iso, worked)}
            />
          );
        })}
      </div>

      {/* Adjustments */}
      <AdjustmentRow
        workerId={worker.id}
        weekStart={toISO(weekDates[0])}
        adjustments={adjustments.filter(a => a.worker_id === worker.id)}
        onChange={onAdjustmentChange}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Semana Tab
// ---------------------------------------------------------------------------
function SemanaTab({ workers, weekDates, attendance, adjustments, onAttendanceToggle, onAdjustmentChange, onEditWorker, savingMap }) {
  const activeWorkers = workers.filter(w => w.active);
  const grouped = groupBy(activeWorkers, 'group_name');
  const groupNames = Object.keys(grouped).sort();

  if (!activeWorkers.length) {
    return (
      <div style={{ textAlign: 'center', padding: 60, color: TEXT_MUTED }}>
        <div style={{ fontSize: 40, marginBottom: 12 }}>👷</div>
        <div style={{ fontSize: 15 }}>No hay trabajadores activos.</div>
        <div style={{ fontSize: 13, marginTop: 6 }}>Ve a la pestaña "Trabajadores" para agregar.</div>
      </div>
    );
  }

  return (
    <div>
      {groupNames.map(group => (
        <div key={group} style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
            <GroupBadge name={group} />
            <span style={{ color: TEXT_MUTED, fontSize: 12 }}>{grouped[group].length} trabajador(es)</span>
            <div style={{ flex: 1, height: 1, background: BORDER }} />
          </div>
          {grouped[group].map(worker => (
            <WorkerRow
              key={worker.id}
              worker={worker}
              weekDates={weekDates}
              attendance={attendance}
              adjustments={adjustments.filter(a => a.worker_id === worker.id)}
              onAttendanceToggle={onAttendanceToggle}
              onAdjustmentChange={onAdjustmentChange}
              onEdit={onEditWorker}
              savingMap={savingMap}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Mes Tab
// ---------------------------------------------------------------------------
function MesTab({ workers }) {
  const [month, setMonth] = useState(() => {
    const n = new Date();
    return `${n.getFullYear()}-${String(n.getMonth() + 1).padStart(2, '0')}`;
  });
  const [attendance, setAttendance] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workers.length) return;
    setLoading(true);
    const [y, m] = month.split('-').map(Number);
    const start = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const end = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;

    Promise.all([
      supabase.from('payroll_attendance').select('*').gte('work_date', start).lte('work_date', end).eq('worked', true),
      supabase.from('payroll_adjustments').select('*').gte('week_start', start).lte('week_start', end),
    ]).then(([att, adj]) => {
      setAttendance(att.data || []);
      setAdjustments(adj.data || []);
      setLoading(false);
    });
  }, [month, workers]);

  const activeWorkers = workers.filter(w => w.active);

  const rows = activeWorkers.map(w => {
    const days = attendance.filter(a => a.worker_id === w.id).length;
    const subtotal = days * (w.daily_rate || 0);
    const bonus = adjustments.filter(a => a.worker_id === w.id && a.type === 'bonus').reduce((s, a) => s + a.amount, 0);
    const disc  = adjustments.filter(a => a.worker_id === w.id && a.type === 'discount').reduce((s, a) => s + a.amount, 0);
    const reimb = adjustments.filter(a => a.worker_id === w.id && a.type === 'reimbursement').reduce((s, a) => s + a.amount, 0);
    const total = subtotal + bonus - disc + reimb;
    return { ...w, days, subtotal, bonus, disc, reimb, total };
  });

  const grandTotal = rows.reduce((s, r) => s + r.total, 0);
  const totalDays  = rows.reduce((s, r) => s + r.days, 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <label style={{ color: TEXT_MUTED, fontSize: 13 }}>Mes:</label>
        <input type="month" value={month} onChange={e => setMonth(e.target.value)}
          style={{ background: '#111', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '7px 12px', color: '#fff', fontSize: 13, outline: 'none' }} />
        {loading && <span style={{ color: TEXT_MUTED, fontSize: 12 }}>Cargando…</span>}
      </div>

      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {['Trabajador', 'Grupo', 'Días', 'Subtotal', 'Bonos', 'Desc.', 'Reimb.', 'Total'].map(h => (
                <th key={h} style={{ padding: '8px 12px', color: TEXT_MUTED, textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${BORDER}11`, background: i % 2 === 0 ? '#ffffff04' : 'transparent' }}>
                <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: '10px 12px' }}><GroupBadge name={r.group_name} /></td>
                <td style={{ padding: '10px 12px', color: TEXT_MUTED }}>{r.days}</td>
                <td style={{ padding: '10px 12px', color: '#ccc' }}>{formatCurrency(r.subtotal)}</td>
                <td style={{ padding: '10px 12px', color: GREEN }}>{r.bonus > 0 ? `+${formatCurrency(r.bonus)}` : '—'}</td>
                <td style={{ padding: '10px 12px', color: '#ef4444' }}>{r.disc > 0 ? `-${formatCurrency(r.disc)}` : '—'}</td>
                <td style={{ padding: '10px 12px', color: '#60a5fa' }}>{r.reimb > 0 ? `+${formatCurrency(r.reimb)}` : '—'}</td>
                <td style={{ padding: '10px 12px', color: ACCENT, fontWeight: 700 }}>{formatCurrency(r.total)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ borderTop: `1px solid ${BORDER}` }}>
              <td colSpan={2} style={{ padding: '10px 12px', color: TEXT_MUTED, fontWeight: 700 }}>TOTAL</td>
              <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 700 }}>{totalDays}</td>
              <td colSpan={4} />
              <td style={{ padding: '10px 12px', color: ACCENT, fontWeight: 800, fontSize: 15 }}>{formatCurrency(grandTotal)}</td>
            </tr>
          </tfoot>
        </table>
        {!loading && rows.every(r => r.days === 0) && (
          <div style={{ textAlign: 'center', padding: 30, color: TEXT_MUTED }}>No hay asistencia registrada para este mes.</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Año Tab
// ---------------------------------------------------------------------------
function AnoTab({ workers }) {
  const [year, setYear] = useState(new Date().getFullYear());
  const [monthlyData, setMonthlyData] = useState([]);
  const [workerData, setWorkerData] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workers.length) return;
    setLoading(true);
    const start = `${year}-01-01`;
    const end   = `${year}-12-31`;

    Promise.all([
      supabase.from('payroll_attendance').select('*').gte('work_date', start).lte('work_date', end).eq('worked', true),
      supabase.from('payroll_adjustments').select('*').gte('week_start', start).lte('week_start', end),
    ]).then(([att, adj]) => {
      const attendance = att.data || [];
      const adjustments = adj.data || [];

      // Monthly totals
      const monthly = Array.from({ length: 12 }, (_, mi) => {
        const m = String(mi + 1).padStart(2, '0');
        const prefix = `${year}-${m}`;
        const attM = attendance.filter(a => a.work_date.startsWith(prefix));
        const adjM = adjustments.filter(a => a.week_start.startsWith(prefix));
        let total = 0;
        workers.filter(w => w.active).forEach(w => {
          const days = attM.filter(a => a.worker_id === w.id).length;
          const sub  = days * (w.daily_rate || 0);
          const bon  = adjM.filter(a => a.worker_id === w.id && a.type === 'bonus').reduce((s, a) => s + a.amount, 0);
          const dis  = adjM.filter(a => a.worker_id === w.id && a.type === 'discount').reduce((s, a) => s + a.amount, 0);
          const rei  = adjM.filter(a => a.worker_id === w.id && a.type === 'reimbursement').reduce((s, a) => s + a.amount, 0);
          total += sub + bon - dis + rei;
        });
        return { month: MONTH_NAMES[mi], total };
      });
      setMonthlyData(monthly);

      // Per-worker annual
      const wData = workers.filter(w => w.active).map(w => {
        const attW = attendance.filter(a => a.worker_id === w.id);
        const adjW = adjustments.filter(a => a.worker_id === w.id);
        const days = attW.length;
        const sub  = days * (w.daily_rate || 0);
        const bon  = adjW.filter(a => a.type === 'bonus').reduce((s, a) => s + a.amount, 0);
        const dis  = adjW.filter(a => a.type === 'discount').reduce((s, a) => s + a.amount, 0);
        const rei  = adjW.filter(a => a.type === 'reimbursement').reduce((s, a) => s + a.amount, 0);
        const total = sub + bon - dis + rei;
        // Approximate weeks
        const weeks = Math.ceil(days / 5) || 1;
        return { ...w, days, total, weeks, avg: total / weeks };
      }).sort((a, b) => b.total - a.total);
      setWorkerData(wData);

      setLoading(false);
    });
  }, [year, workers]);

  const grandTotal = monthlyData.reduce((s, m) => s + m.total, 0);

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
        <Btn small variant="ghost" onClick={() => setYear(y => y - 1)}>◀</Btn>
        <span style={{ color: '#fff', fontWeight: 700, fontSize: 16, minWidth: 50, textAlign: 'center' }}>{year}</span>
        <Btn small variant="ghost" onClick={() => setYear(y => y + 1)}>▶</Btn>
        {loading && <span style={{ color: TEXT_MUTED, fontSize: 12 }}>Cargando…</span>}
        <div style={{ flex: 1 }} />
        <span style={{ color: ACCENT, fontWeight: 700, fontSize: 16 }}>Total año: {formatCurrency(grandTotal)}</span>
      </div>

      {/* Bar Chart */}
      <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 12, padding: 20, marginBottom: 24 }}>
        <div style={{ color: TEXT_MUTED, fontSize: 12, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Nómina Mensual {year}</div>
        <ResponsiveContainer width="100%" height={220}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#222" />
            <XAxis dataKey="month" tick={{ fill: TEXT_MUTED, fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: TEXT_MUTED, fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
            <Tooltip
              contentStyle={{ background: '#141414', border: `1px solid ${BORDER}`, borderRadius: 8 }}
              labelStyle={{ color: '#fff', fontWeight: 700 }}
              formatter={v => [formatCurrency(v), 'Nómina']}
            />
            <Bar dataKey="total" radius={[6, 6, 0, 0]}>
              {monthlyData.map((_, i) => (
                <Cell key={i} fill={i % 2 === 0 ? ACCENT : '#f59e0b'} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Per-worker table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${BORDER}` }}>
              {['Trabajador', 'Grupo', 'Días Total', 'Total Pagado', 'Sem. Aprox.', 'Prom./Semana'].map(h => (
                <th key={h} style={{ padding: '8px 12px', color: TEXT_MUTED, textAlign: 'left', fontWeight: 600, whiteSpace: 'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {workerData.map((r, i) => (
              <tr key={r.id} style={{ borderBottom: `1px solid ${BORDER}11`, background: i % 2 === 0 ? '#ffffff04' : 'transparent' }}>
                <td style={{ padding: '10px 12px', color: '#fff', fontWeight: 600 }}>{r.name}</td>
                <td style={{ padding: '10px 12px' }}><GroupBadge name={r.group_name} /></td>
                <td style={{ padding: '10px 12px', color: TEXT_MUTED }}>{r.days}</td>
                <td style={{ padding: '10px 12px', color: ACCENT, fontWeight: 700 }}>{formatCurrency(r.total)}</td>
                <td style={{ padding: '10px 12px', color: TEXT_MUTED }}>{r.weeks}</td>
                <td style={{ padding: '10px 12px', color: '#ccc' }}>{formatCurrency(r.avg)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {!loading && workerData.every(r => r.days === 0) && (
          <div style={{ textAlign: 'center', padding: 30, color: TEXT_MUTED }}>No hay datos para {year}.</div>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trabajadores Tab
// ---------------------------------------------------------------------------
function TrabajadoresTab({ workers, onRefresh }) {
  const [showModal, setShowModal] = useState(false);
  const [editWorker, setEditWorker] = useState(null);
  const [filter, setFilter] = useState('');
  const [deleting, setDeleting] = useState(null);

  const groups = [...new Set(workers.map(w => w.group_name))];

  const filtered = workers.filter(w =>
    w.name.toLowerCase().includes(filter.toLowerCase()) ||
    w.group_name.toLowerCase().includes(filter.toLowerCase())
  );

  async function handleDelete(worker) {
    if (!window.confirm(`¿Eliminar a ${worker.name}? Esta acción no se puede deshacer.`)) return;
    setDeleting(worker.id);
    await supabase.from('payroll_workers').delete().eq('id', worker.id);
    setDeleting(null);
    onRefresh();
  }

  function handleSaved() {
    setShowModal(false);
    setEditWorker(null);
    onRefresh();
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <input
          value={filter}
          onChange={e => setFilter(e.target.value)}
          placeholder="Buscar trabajador..."
          style={{ flex: 1, minWidth: 160, background: '#111', border: `1px solid ${BORDER}`, borderRadius: 8, padding: '9px 12px', color: '#fff', fontSize: 13, outline: 'none' }}
        />
        <Btn onClick={() => { setEditWorker(null); setShowModal(true); }}>+ Agregar Trabajador</Btn>
      </div>

      <div style={{ display: 'grid', gap: 10 }}>
        {filtered.map(w => (
          <div key={w.id} style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 10, padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <div style={{ width: 38, height: 38, borderRadius: '50%', background: w.active ? GREEN + '22' : '#ffffff11', border: `1px solid ${w.active ? GREEN + '44' : '#333'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: w.active ? GREEN : TEXT_MUTED, fontWeight: 700 }}>
                {w.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <div style={{ fontWeight: 700, color: '#fff', fontSize: 14 }}>{w.name}</div>
                <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>
                  {formatCurrency(w.daily_rate)}/día
                  {w.daily_rate_2 ? ` · ${formatCurrency(w.daily_rate_2)}/día (2)` : ''}
                </div>
              </div>
              <GroupBadge name={w.group_name} />
              <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 6, background: w.active ? GREEN + '22' : '#ffffff11', color: w.active ? GREEN : TEXT_MUTED, fontWeight: 600 }}>
                {w.active ? 'Activo' : 'Inactivo'}
              </span>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn small variant="ghost" onClick={() => { setEditWorker(w); setShowModal(true); }}>✏️ Editar</Btn>
              <Btn small variant="danger" onClick={() => handleDelete(w)} disabled={deleting === w.id}>🗑️</Btn>
            </div>
          </div>
        ))}
        {!filtered.length && (
          <div style={{ textAlign: 'center', padding: 40, color: TEXT_MUTED }}>
            {filter ? 'Sin resultados.' : 'No hay trabajadores. Agrega uno para comenzar.'}
          </div>
        )}
      </div>

      {showModal && (
        <WorkerModal
          worker={editWorker}
          groups={groups}
          onSave={handleSaved}
          onClose={() => { setShowModal(false); setEditWorker(null); }}
        />
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Setup Prompt (tables missing)
// ---------------------------------------------------------------------------
function SetupPrompt({ onRetry }) {
  const [copied, setCopied] = useState(false);

  function copySQL() {
    navigator.clipboard.writeText(SETUP_SQL).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <div style={{ maxWidth: 700, margin: '60px auto', padding: '0 20px' }}>
      <div style={{ background: BG_CARD, border: `1px solid #f59e0b44`, borderRadius: 16, padding: 32 }}>
        <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ color: '#fff', margin: '0 0 8px', fontSize: 20 }}>Tablas de Nómina no encontradas</h2>
        <p style={{ color: TEXT_MUTED, fontSize: 14, margin: '0 0 20px' }}>
          Las tablas de Supabase necesarias no existen. Ejecuta el siguiente SQL en el editor de Supabase para crearlas:
        </p>
        <pre style={{ background: '#0d0d0d', border: `1px solid ${BORDER}`, borderRadius: 10, padding: 16, overflowX: 'auto', fontSize: 11, color: '#a3e635', margin: '0 0 16px', whiteSpace: 'pre', lineHeight: 1.6 }}>
          {SETUP_SQL}
        </pre>
        <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
          <Btn onClick={copySQL} variant={copied ? 'success' : 'primary'}>
            {copied ? '✓ Copiado!' : '📋 Copiar SQL'}
          </Btn>
          <Btn onClick={onRetry} variant="ghost">🔄 Reintentar</Btn>
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main PayrollPage
// ---------------------------------------------------------------------------
export default function PayrollPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [tab, setTab] = useState('semana');
  const [weekStart, setWeekStart] = useState(() => getWeekStart());
  const [workers, setWorkers]     = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [adjustments, setAdjustments] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [tablesExist, setTablesExist] = useState(true);
  const [savingMap, setSavingMap] = useState({});
  const [showWorkerModal, setShowWorkerModal] = useState(false);
  const [editingWorker, setEditingWorker] = useState(null);

  const weekDates = getWeekDates(weekStart);

  // ── Data loading ──────────────────────────────────────────────────────────
  const loadData = useCallback(async (wStart = weekStart) => {
    setLoading(true);
    const weekStartISO = toISO(wStart);
    const weekEndISO   = toISO(getWeekDates(wStart)[6]);

    // Check tables exist by fetching workers
    const { data: wData, error: wErr } = await supabase
      .from('payroll_workers')
      .select('*')
      .order('group_name')
      .order('name');

    if (wErr) {
      if (wErr.code === '42P01' || wErr.message?.includes('does not exist')) {
        setTablesExist(false);
        setLoading(false);
        return;
      }
    }

    setTablesExist(true);
    setWorkers(wData || []);

    const [attRes, adjRes] = await Promise.all([
      supabase.from('payroll_attendance').select('*')
        .gte('work_date', weekStartISO)
        .lte('work_date', weekEndISO),
      supabase.from('payroll_adjustments').select('*')
        .eq('week_start', weekStartISO),
    ]);

    setAttendance(attRes.data || []);
    setAdjustments(adjRes.data || []);
    setLoading(false);
  }, [weekStart]);

  useEffect(() => {
    loadData(weekStart);
  }, [weekStart]);

  // ── Attendance toggle ─────────────────────────────────────────────────────
  async function handleAttendanceToggle(workerId, workDate, currentlyWorked) {
    const key = `${workerId}-${workDate}`;
    setSavingMap(m => ({ ...m, [key]: true }));

    const newWorked = !currentlyWorked;

    // Optimistic update
    setAttendance(prev => {
      const exists = prev.find(a => a.worker_id === workerId && a.work_date === workDate);
      if (exists) {
        return prev.map(a =>
          a.worker_id === workerId && a.work_date === workDate
            ? { ...a, worked: newWorked }
            : a
        );
      }
      return [...prev, { id: `temp-${key}`, worker_id: workerId, work_date: workDate, worked: newWorked }];
    });

    const { data, error } = await supabase
      .from('payroll_attendance')
      .upsert({ worker_id: workerId, work_date: workDate, worked: newWorked }, { onConflict: 'worker_id,work_date' })
      .select()
      .single();

    if (!error && data) {
      setAttendance(prev =>
        prev.map(a =>
          a.worker_id === workerId && a.work_date === workDate ? data : a
        ).filter(a => !a.id.startsWith('temp-') || a.worker_id !== workerId || a.work_date !== workDate)
      );
    }
    setSavingMap(m => { const n = { ...m }; delete n[key]; return n; });
  }

  // ── Adjustment change ─────────────────────────────────────────────────────
  function handleAdjustmentChange(newAdj, oldId) {
    setAdjustments(prev => {
      if (oldId) {
        return prev.map(a => a.id === oldId ? newAdj : a);
      }
      const exists = prev.find(a => a.id === newAdj.id);
      return exists ? prev.map(a => a.id === newAdj.id ? newAdj : a) : [...prev, newAdj];
    });
  }

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const activeWorkers = workers.filter(w => w.active);
  const weekISO = toISO(weekStart);
  const weekAdjustments = adjustments.filter(a => a.week_start === weekISO);

  const totalPayroll = activeWorkers.reduce((sum, w) => {
    const daysWorked = weekDates.filter(d => {
      const iso = toISO(d);
      return attendance.some(a => a.worker_id === w.id && a.work_date === iso && a.worked);
    }).length;
    const sub = daysWorked * (w.daily_rate || 0);
    const bon  = weekAdjustments.filter(a => a.worker_id === w.id && a.type === 'bonus').reduce((s, a) => s + a.amount, 0);
    const disc = weekAdjustments.filter(a => a.worker_id === w.id && a.type === 'discount').reduce((s, a) => s + a.amount, 0);
    const reimb= weekAdjustments.filter(a => a.worker_id === w.id && a.type === 'reimbursement').reduce((s, a) => s + a.amount, 0);
    return sum + sub + bon - disc + reimb;
  }, 0);

  const totalDaysWorked = attendance.filter(a => a.worked && weekDates.some(d => toISO(d) === a.work_date)).length;
  const totalBonuses    = weekAdjustments.filter(a => a.type === 'bonus').reduce((s, a) => s + a.amount, 0);

  // ── Print ─────────────────────────────────────────────────────────────────
  function handlePrint() {
    window.print();
  }

  // ── Worker edit handler ───────────────────────────────────────────────────
  function handleEditWorker(worker) {
    setEditingWorker(worker);
    setShowWorkerModal(true);
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (!tablesExist) {
    return (
      <PinLock pin="2012" title="Payroll — Restringido">
        <SetupPrompt onRetry={() => { setTablesExist(true); loadData(weekStart); }} />
      </PinLock>
    );
  }

  const TABS = [
    { id: 'semana', label: '📅 Semana' },
    { id: 'mes',    label: '📆 Mes' },
    { id: 'ano',    label: '📊 Año' },
    { id: 'trabajadores', label: '👷 Trabajadores' },
  ];

  return (
    <PinLock pin="2012" title="Payroll — Restringido">
      <div style={{ minHeight: '100vh', background: '#0d0d0d', padding: '20px 16px', fontFamily: 'Inter, system-ui, sans-serif', color: '#fff' }}>
        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
          <div>
            <h1 style={{ margin: 0, fontSize: 24, fontWeight: 800, color: '#fff' }}>
              💰 Nómina
            </h1>
            <div style={{ fontSize: 13, color: TEXT_MUTED, marginTop: 2 }}>Barba Construction — Control de Pagos</div>
          </div>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <Btn variant="ghost" small onClick={handlePrint}>🖨️ Imprimir</Btn>
            <Btn variant="ghost" small onClick={() => loadData(weekStart)} disabled={loading}>
              {loading ? '⏳' : '🔄'} Actualizar
            </Btn>
          </div>
        </div>

        {/* ── Week Selector ───────────────────────────────────────────────── */}
        {tab === 'semana' && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: 12,
            background: BG_CARD, border: `1px solid ${BORDER}`,
            borderRadius: 12, padding: '10px 16px', marginBottom: 20, flexWrap: 'wrap',
          }}>
            <Btn small variant="ghost" onClick={() => setWeekStart(d => addWeeks(d, -1))}>◀</Btn>
            <div style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#fff' }}>
                {fmtDate(weekDates[0])} — {fmtDateFull(weekDates[6])}
              </div>
              <div style={{ fontSize: 11, color: TEXT_MUTED, marginTop: 2 }}>
                {DAY_LABELS.map((l, i) => (
                  <span key={l} style={{ marginRight: 6, color: toISO(weekDates[i]) === toISO(new Date()) ? ACCENT : TEXT_MUTED, fontWeight: toISO(weekDates[i]) === toISO(new Date()) ? 700 : 400 }}>
                    {l} {weekDates[i].getDate()}
                  </span>
                ))}
              </div>
            </div>
            <Btn small variant="ghost" onClick={() => setWeekStart(d => addWeeks(d, 1))}>▶</Btn>
            <Btn small variant="ghost" onClick={() => setWeekStart(getWeekStart())}>Hoy</Btn>
          </div>
        )}

        {/* ── KPI Cards ──────────────────────────────────────────────────── */}
        {tab === 'semana' && (
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 20 }}>
            <KpiCard label="Total Nómina" value={formatCurrency(totalPayroll)} color={ACCENT} sub="Esta semana" />
            <KpiCard label="Trabajadores" value={activeWorkers.length} sub="Activos" />
            <KpiCard label="Días Trabajados" value={totalDaysWorked} sub="Total semana" />
            <KpiCard label="Bonos / Extras" value={formatCurrency(totalBonuses)} color={GREEN} sub="Esta semana" />
          </div>
        )}

        {/* ── Tab Bar ────────────────────────────────────────────────────── */}
        <div style={{
          display: 'flex', gap: 4, background: BG_CARD,
          border: `1px solid ${BORDER}`, borderRadius: 12,
          padding: 4, marginBottom: 20, overflowX: 'auto',
        }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              flex: 1, minWidth: 90, padding: '8px 14px', borderRadius: 9, border: 'none',
              background: tab === t.id ? ACCENT : 'transparent',
              color: tab === t.id ? '#111' : TEXT_MUTED,
              fontWeight: tab === t.id ? 700 : 500,
              cursor: 'pointer', fontSize: 13, transition: 'all 0.15s', whiteSpace: 'nowrap',
            }}>{t.label}</button>
          ))}
        </div>

        {/* ── Tab Content ────────────────────────────────────────────────── */}
        <div style={{ background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 14, padding: '20px 16px' }}>
          {loading && tab === 'semana' ? (
            <div style={{ textAlign: 'center', padding: 60, color: TEXT_MUTED }}>
              <div style={{ fontSize: 30, marginBottom: 12 }}>⏳</div>
              Cargando nómina…
            </div>
          ) : (
            <>
              {tab === 'semana' && (
                <SemanaTab
                  workers={workers}
                  weekDates={weekDates}
                  attendance={attendance}
                  adjustments={adjustments}
                  onAttendanceToggle={handleAttendanceToggle}
                  onAdjustmentChange={handleAdjustmentChange}
                  onEditWorker={handleEditWorker}
                  savingMap={savingMap}
                />
              )}
              {tab === 'mes' && <MesTab workers={workers} />}
              {tab === 'ano' && <AnoTab workers={workers} />}
              {tab === 'trabajadores' && (
                <TrabajadoresTab
                  workers={workers}
                  onRefresh={() => loadData(weekStart)}
                />
              )}
            </>
          )}
        </div>

        {/* ── Worker Edit Modal (from Semana tab) ─────────────────────────── */}
        {showWorkerModal && (
          <WorkerModal
            worker={editingWorker}
            groups={[...new Set(workers.map(w => w.group_name))]}
            onSave={() => {
              setShowWorkerModal(false);
              setEditingWorker(null);
              loadData(weekStart);
            }}
            onClose={() => {
              setShowWorkerModal(false);
              setEditingWorker(null);
            }}
          />
        )}

        {/* ── Print styles ────────────────────────────────────────────────── */}
        <style>{`
          @media print {
            body { background: #fff !important; color: #000 !important; }
            button, [role="button"] { display: none !important; }
            input, select { border: 1px solid #ccc !important; background: #fff !important; color: #000 !important; }
            div[style*="background: #0d0d0d"] { background: #fff !important; }
            div[style*="background: #1a1a1a"] { background: #f9f9f9 !important; border: 1px solid #ddd !important; }
            div[style*="background: #111"] { background: #fff !important; border: 1px solid #eee !important; }
          }
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
          * { box-sizing: border-box; }
          input[type=number]::-webkit-inner-spin-button,
          input[type=number]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
          input[type=number] { -moz-appearance: textfield; }
          ::-webkit-scrollbar { width: 6px; height: 6px; }
          ::-webkit-scrollbar-track { background: #111; }
          ::-webkit-scrollbar-thumb { background: #333; border-radius: 3px; }
        `}</style>
      </div>
    </PinLock>
  );
}
