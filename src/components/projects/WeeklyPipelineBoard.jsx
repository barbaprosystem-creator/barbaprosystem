import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, CheckCircle2, Clock, AlertCircle, X, Save, ChevronLeft, ChevronRight, FastForward } from 'lucide-react';

// -- Color coding: green=done, yellow=in_progress, gray=pending, red=delayed
const STATUS_CONFIG = {
  completed:   { label: 'Completed', color: '#10b981', bg: 'bg-emerald-500/20', border: 'border-emerald-500/40', text: 'text-emerald-300', Icon: CheckCircle2 },
  in_progress: { label: 'In Progress', color: '#f59e0b', bg: 'bg-amber-500/20',   border: 'border-amber-500/40',   text: 'text-amber-300',   Icon: Clock },
  pending:     { label: 'Pending',  color: '#6b7280', bg: 'bg-slate-500/20',   border: 'border-slate-500/40',   text: 'text-slate-300',   Icon: Clock },
  delayed:     { label: 'Delayed',  color: '#ef4444', bg: 'bg-red-500/20',     border: 'border-red-500/40',     text: 'text-red-300',     Icon: AlertCircle },
};

const TASK_CATEGORIES = [
  { id: 'demolition', label: 'Demolition' },
  { id: 'roofing',    label: 'Roofing' },
  { id: 'siding',     label: 'Siding' },
  { id: 'windows',    label: 'Windows' },
  { id: 'gutters',    label: 'Gutters' },
  { id: 'framing',    label: 'Framing' },
  { id: 'painting',   label: 'Painting' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'cleanup',    label: 'Cleanup' },
  { id: 'delivery',   label: 'Delivery' },
  { id: 'general',    label: 'General' },
];

// Get the Monday of the week containing a given date
function getMonday(date) {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1);
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// Get array of N weeks starting from a given Monday
function getWeeks(startDate, count) {
  const weeks = [];
  for (let i = 0; i < count; i++) {
    const mon = new Date(startDate);
    mon.setDate(mon.getDate() + i * 7);
    const sun = new Date(mon);
    sun.setDate(sun.getDate() + 6);
    weeks.push({ start: new Date(mon), end: new Date(sun) });
  }
  return weeks;
}

function formatShortDate(d) {
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function isCurrentWeek(week) {
  const now = new Date();
  return now >= week.start && now <= week.end;
}

// -- Task chip inside a week cell
function TaskChip({ task, canEdit, onStatusChange, onDelete, onShift }) {
  const cfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.pending;
  const Icon = cfg.Icon;

  const cycleStatus = () => {
    if (!canEdit) return;
    const order = ['pending', 'in_progress', 'completed', 'delayed'];
    const next = order[(order.indexOf(task.status) + 1) % order.length];
    onStatusChange(task.id, next);
  };

  return (
    <div className={`group relative flex flex-col gap-1 px-3 py-2 rounded-xl border ${cfg.bg} ${cfg.border} transition-all duration-200 cursor-pointer hover:scale-[1.02]`}
      onClick={cycleStatus}
      title={canEdit ? 'Click to change status' : ''}
    >
      <div className="flex items-center gap-2">
        <Icon size={13} className={cfg.text + ' flex-none'} />
        <span className="text-xs font-semibold text-[#e0e0e0] leading-tight flex-1">{task.title}</span>
      </div>
      {canEdit && (
        <div className="opacity-0 group-hover:opacity-100 flex items-center justify-end gap-2 mt-1 transition-opacity">
          <button
            title="Shift forward 1 week"
            className="text-[#555555] hover:text-blue-400 p-1"
            onClick={e => { e.stopPropagation(); onShift(task.id, -1); }}
          ><ChevronLeft size={14} /></button>
          <button
            title="Shift back 1 week (Delay)"
            className="text-[#555555] hover:text-orange-400 p-1"
            onClick={e => { e.stopPropagation(); onShift(task.id, 1); }}
          ><ChevronRight size={14} /></button>
          <button
            title="Delete"
            className="text-[#555555] hover:text-red-400 p-1 ml-1"
            onClick={e => { e.stopPropagation(); onDelete(task.id); }}
          ><X size={14} /></button>
        </div>
      )}
    </div>
  );
}

// -- Add task form inside a week cell
function AddTaskForm({ weekStart, weekEnd, projectId, onAdd, onCancel }) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('general');

  const submit = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    await onAdd({ title: title.trim(), category, weekStart, weekEnd });
    setTitle('');
  };

  return (
    <form onSubmit={submit} className="flex flex-col gap-2 p-2 bg-[#0d0d0d]/80 rounded-xl border border-[#333333]/50">
      <input
        autoFocus
        value={title}
        onChange={e => setTitle(e.target.value)}
        placeholder="Task name..."
        className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-3 py-2 text-xs text-[#f0f0f0] placeholder-[#555555] focus:outline-none focus:border-[#F5C518]"
      />
      <select
        value={category}
        onChange={e => setCategory(e.target.value)}
        className="w-full bg-[#1a1a1a] border border-[#333333] rounded-lg px-2 py-1.5 text-xs text-[#c0c0c0] focus:outline-none focus:border-[#F5C518]"
      >
        {TASK_CATEGORIES.map(c => <option key={c.id} value={c.id}>{c.label}</option>)}
      </select>
      <div className="flex gap-2">
        <button type="submit" className="flex-1 flex items-center justify-center gap-1 py-1.5 bg-violet-600 hover:bg-violet-500 rounded-lg text-xs font-semibold text-white transition-colors">
          <Save size={11} /> Save
        </button>
        <button type="button" onClick={onCancel} className="flex-1 py-1.5 bg-[#2a2a2a] hover:bg-[#333333] rounded-lg text-xs text-[#c0c0c0] transition-colors">
          Cancel
        </button>
      </div>
    </form>
  );
}

// -- Main Component
export default function WeeklyPipelineBoard({ projectId, startDate, canEdit = false }) {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [addingWeek, setAddingWeek] = useState(null); // week index where form is open
  const [weekOffset, setWeekOffset] = useState(0);    // pan left/right by N weeks

  // Determine board start: project start_date or nearest Monday
  const boardStart = getMonday(startDate ? new Date(startDate) : new Date());
  const shiftedStart = new Date(boardStart);
  shiftedStart.setDate(shiftedStart.getDate() + weekOffset * 7);

  const weeks = getWeeks(shiftedStart, 6); // show 6 weeks at a time

  useEffect(() => { fetchTasks(); }, [projectId]);

  async function fetchTasks() {
    setLoading(true);



    const { data } = await supabase
      .from('project_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('sort_order');
    setTasks(data || []);
    setLoading(false);
  }

  async function addTask({ title, category, weekStart, weekEnd }) {
    const { error } = await supabase.from('project_tasks').insert({
      project_id: projectId,
      title,
      task_category: category,
      status: 'pending',
      week_start: weekStart.toISOString().split('T')[0],
      week_end: weekEnd.toISOString().split('T')[0],
    });
    if (!error) { fetchTasks(); setAddingWeek(null); }
  }

  async function updateStatus(taskId, newStatus) {
    const updates = {
      status: newStatus,
      completed_at: newStatus === 'completed' ? new Date().toISOString() : null,
    };
    await supabase.from('project_tasks').update(updates).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  }

  async function deleteTask(taskId) {
    await supabase.from('project_tasks').delete().eq('id', taskId);
    setTasks(prev => prev.filter(t => t.id !== taskId));
  }

  async function shiftTask(taskId, direction) {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStart = new Date(task.week_start);
    newStart.setDate(newStart.getDate() + (direction * 7));
    const newEnd = new Date(task.week_end);
    newEnd.setDate(newEnd.getDate() + (direction * 7));

    let newTitle = task.title;
    if (direction > 0 && !newTitle.includes('(Delayed)')) {
      newTitle = newTitle.replace(' (Early)', '') + ' (Delayed)';
    } else if (direction < 0 && !newTitle.includes('(Early)')) {
      newTitle = newTitle.replace(' (Delayed)', '') + ' (Early)';
    }

    const updates = {
      week_start: newStart.toISOString().split('T')[0],
      week_end: newEnd.toISOString().split('T')[0],
      title: newTitle,
      status: direction > 0 ? 'delayed' : task.status // Auto-mark delayed if shifted right
    };

    await supabase.from('project_tasks').update(updates).eq('id', taskId);
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, ...updates } : t));
  }

  // Get tasks that belong to a given week
  function getTasksForWeek(week) {
    return tasks.filter(t => {
      if (!t.week_start) return false;
      const taskStart = new Date(t.week_start);
      const taskEnd = t.week_end ? new Date(t.week_end) : taskStart;
      return taskStart <= week.end && taskEnd >= week.start;
    });
  }

  // Summary stats
  const totalTasks = tasks.length;
  const doneTasks = tasks.filter(t => t.status === 'completed').length;
  const wipTasks = tasks.filter(t => t.status === 'in_progress').length;
  const pendingTasks = tasks.filter(t => t.status === 'pending').length;

  if (loading) return (
    <div className="flex items-center justify-center py-12 text-[#555555]">
      <div className="animate-spin rounded-full h-6 w-6 border-2 border-violet-500 border-t-transparent mr-3" />
      Loading pipeline...
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Legend + Stats */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          {Object.entries(STATUS_CONFIG).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div className="w-3 h-3 rounded-full" style={{ background: cfg.color }} />
              <span className="text-xs text-[#888888]">{cfg.label}</span>
              <span className="text-xs font-bold text-[#c0c0c0]">
                {key === 'completed' ? doneTasks : key === 'in_progress' ? wipTasks : pendingTasks}
              </span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-3">
          {/* Week navigation */}
          <button
            onClick={() => setWeekOffset(w => w - 1)}
            className="p-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#444444] text-[#888888] hover:text-[#e0e0e0] transition-all"
          >
            <ChevronLeft size={16} />
          </button>
          <span className="text-xs text-[#888888] font-medium">
            {formatShortDate(weeks[0].start)} - {formatShortDate(weeks[weeks.length - 1].end)}
          </span>
          <button
            onClick={() => setWeekOffset(w => w + 1)}
            className="p-1.5 rounded-lg bg-[#1a1a1a] border border-[#2a2a2a] hover:border-[#444444] text-[#888888] hover:text-[#e0e0e0] transition-all"
          >
            <ChevronRight size={16} />
          </button>
          {weekOffset !== 0 && (
            <button
              onClick={() => setWeekOffset(0)}
              className="text-xs text-violet-400 hover:text-violet-300 transition-colors"
            >
              Today
            </button>
          )}
        </div>
      </div>

      {/* Progress bar overall */}
      {totalTasks > 0 && (
        <div className="flex items-center gap-3">
          <div className="flex-1 h-2 bg-[#1a1a1a] rounded-full overflow-hidden flex">
            <div
              className="h-full bg-emerald-500 transition-all duration-500"
              style={{ width: `${(doneTasks / totalTasks) * 100}%` }}
            />
            <div
              className="h-full bg-amber-500 transition-all duration-500"
              style={{ width: `${(wipTasks / totalTasks) * 100}%` }}
            />
            <div
              className="h-full bg-red-500/60 transition-all duration-500"
              style={{ width: `${(pendingTasks / totalTasks) * 100}%` }}
            />
          </div>
          <span className="text-xs font-bold text-[#c0c0c0] whitespace-nowrap">
            {totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0}% completed
          </span>
        </div>
      )}

      {/* Gantt Grid */}
      <div className="overflow-x-auto pb-2">
        <div className="grid min-w-[700px]" style={{ gridTemplateColumns: `repeat(${weeks.length}, 1fr)`, gap: '8px' }}>
          {/* Week headers */}
          {weeks.map((week, i) => {
            const isCurrent = isCurrentWeek(week);
            return (
              <div
                key={i}
                className={`rounded-xl p-3 border text-center ${
                  isCurrent
                    ? 'bg-violet-500/10 border-violet-500/40'
                    : 'bg-[#1a1a1a]/40 border-[#2a2a2a]/40'
                }`}
              >
                <p className={`text-[10px] font-bold uppercase tracking-wider ${isCurrent ? 'text-violet-400' : 'text-[#555555]'}`}>
                  {isCurrent ? '• This Week' : `Week ${i + 1 + weekOffset}`}
                </p>
                <p className="text-xs text-[#888888] mt-0.5">
                  {formatShortDate(week.start)} - {formatShortDate(week.end)}
                </p>
              </div>
            );
          })}

          {/* Task cells */}
          {weeks.map((week, i) => {
            const weekTasks = getTasksForWeek(week);
            const isAdding = addingWeek === i;

            return (
              <div key={i} className="flex flex-col gap-2 min-h-[120px]">
                {weekTasks.map(task => (
                  <TaskChip
                    key={task.id}
                    task={task}
                    canEdit={canEdit}
                    onStatusChange={updateStatus}
                    onDelete={deleteTask}
                    onShift={shiftTask}
                  />
                ))}

                {isAdding ? (
                  <AddTaskForm
                    weekStart={week.start}
                    weekEnd={week.end}
                    projectId={projectId}
                    onAdd={addTask}
                    onCancel={() => setAddingWeek(null)}
                  />
                ) : (
                  canEdit && (
                    <button
                      onClick={() => setAddingWeek(i)}
                      className="flex items-center justify-center gap-1 py-2 rounded-xl border border-dashed border-[#2a2a2a] text-slate-600 hover:border-violet-600/50 hover:text-violet-500 transition-all duration-200 text-xs"
                    >
                      <Plus size={12} /> Task
                    </button>
                  )
                )}
              </div>
            );
          })}
        </div>
      </div>

      {totalTasks === 0 && !canEdit && (
        <div className="text-center py-8 text-[#555555]">
          <AlertCircle size={32} className="mx-auto mb-2 opacity-30" />
          <p className="text-sm">No tasks in the pipeline yet.</p>
        </div>
      )}
    </div>
  );
}

