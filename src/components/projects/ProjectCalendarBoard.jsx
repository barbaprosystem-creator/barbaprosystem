import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { formatDate } from '../../lib/utils';
import {
  Calendar as CalendarIcon, ChevronLeft, ChevronRight, Plus, Minus,
  Clock, CheckCircle2, AlertTriangle, FileText,
  X, Save, Trash2, Edit3, Flag, Loader2
} from 'lucide-react';

export default function ProjectCalendarBoard({
  projectId,
  startDate: initialStartDate,
  targetEndDate: initialTargetEndDate,
  canEdit = true,
  onDatesUpdated
}) {
  // Current calendar month view
  const [currentDate, setCurrentDate] = useState(() => {
    if (initialStartDate) return new Date(initialStartDate);
    return new Date();
  });

  // Project timeline dates state
  const [startDate, setStartDate] = useState(initialStartDate || '');
  const [targetEndDate, setTargetEndDate] = useState(initialTargetEndDate || '');
  const [savingDates, setSavingDates] = useState(false);

  // Daily reports & notes
  const [dailyReports, setDailyReports] = useState([]);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Day note modal state
  const [selectedDay, setSelectedDay] = useState(null);
  const [noteModalOpen, setNoteModalOpen] = useState(false);
  const [dayNoteText, setDayNoteText] = useState('');
  const [dayWeather, setDayWeather] = useState('sunny');
  const [dayCrewCount, setDayCrewCount] = useState('');
  const [dayHoursWorked, setDayHoursWorked] = useState('');
  const [dayProgressPct, setDayProgressPct] = useState('');
  const [addDayDelay, setAddDayDelay] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [editingReportId, setEditingReportId] = useState(null);

  useEffect(() => {
    if (initialStartDate) setStartDate(initialStartDate);
    if (initialTargetEndDate) setTargetEndDate(initialTargetEndDate);
  }, [initialStartDate, initialTargetEndDate]);

  useEffect(() => {
    if (projectId) {
      fetchProjectData();
    }
  }, [projectId]);

  async function fetchProjectData() {
    setLoading(true);
    try {
      const [reportsRes, tasksRes, projectRes] = await Promise.all([
        supabase
          .from('daily_reports')
          .select('*')
          .eq('project_id', projectId)
          .order('report_date', { ascending: false }),
        supabase
          .from('project_tasks')
          .select('*')
          .eq('project_id', projectId)
          .order('created_at', { ascending: true }),
        supabase
          .from('projects')
          .select('start_date, target_end_date')
          .eq('id', projectId)
          .single()
      ]);

      if (!reportsRes.error) {
        setDailyReports(reportsRes.data || []);
      }
      if (!tasksRes.error) {
        setTasks(tasksRes.data || []);
      }
      if (projectRes.data) {
        if (projectRes.data.start_date) setStartDate(projectRes.data.start_date);
        if (projectRes.data.target_end_date) setTargetEndDate(projectRes.data.target_end_date);
      }
    } catch (err) {
      console.error('[ProjectCalendarBoard] fetch error:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calculate duration in calendar days
  const durationDays = useMemo(() => {
    if (!startDate || !targetEndDate) return null;
    const start = new Date(startDate);
    const end = new Date(targetEndDate);
    const diffTime = end.getTime() - start.getTime();
    const diffDays = Math.round(diffTime / (1000 * 3600 * 24)) + 1; // inclusive
    return diffDays > 0 ? diffDays : 1;
  }, [startDate, targetEndDate]);

  // Calculate days remaining or days overdue
  const timelineStatus = useMemo(() => {
    if (!targetEndDate) return { status: 'not_set', text: 'No target end date defined' };
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const end = new Date(targetEndDate);
    end.setHours(0, 0, 0, 0);

    const diffDays = Math.round((end.getTime() - today.getTime()) / (1000 * 3600 * 24));

    if (diffDays < 0) {
      return {
        status: 'delayed',
        days: Math.abs(diffDays),
        text: `Delayed by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`,
        color: 'text-red-400 bg-red-500/10 border-red-500/30'
      };
    } else if (diffDays === 0) {
      return {
        status: 'today',
        days: 0,
        text: 'Finishes Today!',
        color: 'text-amber-400 bg-amber-500/10 border-amber-500/30'
      };
    } else {
      return {
        status: 'on_track',
        days: diffDays,
        text: `${diffDays} day${diffDays === 1 ? '' : 's'} remaining`,
        color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30'
      };
    }
  }, [targetEndDate]);

  // Adjust duration by N days (+1, -1, +3, +7)
  const adjustDuration = async (daysDelta) => {
    if (!canEdit) return;
    setSavingDates(true);
    try {
      let baseStart = startDate ? new Date(startDate) : new Date();
      let baseEnd = targetEndDate ? new Date(targetEndDate) : new Date(baseStart);

      // Add days to target end date
      const newEnd = new Date(baseEnd);
      newEnd.setDate(newEnd.getDate() + daysDelta);

      // Don't allow end date to be before start date
      if (newEnd < baseStart) {
        newEnd.setTime(baseStart.getTime());
      }

      const formattedStart = baseStart.toISOString().split('T')[0];
      const formattedEnd = newEnd.toISOString().split('T')[0];

      const { error } = await supabase
        .from('projects')
        .update({
          start_date: formattedStart,
          target_end_date: formattedEnd,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;

      setStartDate(formattedStart);
      setTargetEndDate(formattedEnd);
      if (onDatesUpdated) {
        onDatesUpdated({ startDate: formattedStart, targetEndDate: formattedEnd });
      }
    } catch (err) {
      console.error('[ProjectCalendarBoard] adjustDuration error:', err);
      alert('Error updating project duration: ' + err.message);
    } finally {
      setSavingDates(false);
    }
  };

  // Update dates manually from inputs
  const handleSaveDates = async (newStart, newEnd) => {
    if (!canEdit) return;
    setSavingDates(true);
    try {
      const { error } = await supabase
        .from('projects')
        .update({
          start_date: newStart || null,
          target_end_date: newEnd || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', projectId);

      if (error) throw error;
      setStartDate(newStart);
      setTargetEndDate(newEnd);
      if (onDatesUpdated) {
        onDatesUpdated({ startDate: newStart, targetEndDate: newEnd });
      }
    } catch (err) {
      console.error('[ProjectCalendarBoard] handleSaveDates error:', err);
      alert('Error saving dates: ' + err.message);
    } finally {
      setSavingDates(false);
    }
  };

  // Open Day Note Modal
  const handleDayClick = (dayDateStr) => {
    const existing = dailyReports.find(r => r.report_date === dayDateStr);
    setSelectedDay(dayDateStr);
    if (existing) {
      setEditingReportId(existing.id);
      setDayNoteText(existing.notes || existing.issues || existing.work_completed || '');
      setDayWeather(existing.weather || 'sunny');
      setDayCrewCount(existing.crew_count || '');
      setDayHoursWorked(existing.hours_worked || '');
      setDayProgressPct(existing.progress_pct || '');
    } else {
      setEditingReportId(null);
      setDayNoteText('');
      setDayWeather('sunny');
      setDayCrewCount('');
      setDayHoursWorked('');
      setDayProgressPct('');
    }
    setAddDayDelay(false);
    setNoteModalOpen(true);
  };

  // Save Day Note / Report
  const handleSaveDayNote = async (e) => {
    e.preventDefault();
    if (!selectedDay) return;
    setSavingNote(true);
    try {
      const payload = {
        project_id: projectId,
        report_date: selectedDay,
        notes: dayNoteText.trim(),
        issues: dayNoteText.trim(),
        work_completed: dayNoteText.trim(),
        weather: dayWeather,
        crew_count: dayCrewCount ? Number(dayCrewCount) : null,
        hours_worked: dayHoursWorked ? Number(dayHoursWorked) : null,
        progress_pct: dayProgressPct ? Number(dayProgressPct) : null,
      };

      if (editingReportId) {
        const { error } = await supabase
          .from('daily_reports')
          .update(payload)
          .eq('id', editingReportId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('daily_reports')
          .insert(payload);
        if (error) throw error;
      }

      // If user checked "Add 1 day delay to project target date"
      if (addDayDelay) {
        await adjustDuration(1);
      }

      await fetchProjectData();
      setNoteModalOpen(false);
    } catch (err) {
      console.error('[ProjectCalendarBoard] saveNote error:', err);
      alert('Error saving daily note: ' + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  // Delete Day Note
  const handleDeleteDayNote = async (reportId) => {
    if (!confirm('Are you sure you want to delete this daily note?')) return;
    setSavingNote(true);
    try {
      const { error } = await supabase
        .from('daily_reports')
        .delete()
        .eq('id', reportId);
      if (error) throw error;
      await fetchProjectData();
      setNoteModalOpen(false);
    } catch (err) {
      console.error('[ProjectCalendarBoard] deleteNote error:', err);
      alert('Error deleting note: ' + err.message);
    } finally {
      setSavingNote(false);
    }
  };

  // Calendar Grid Generation
  const calendarDays = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDayOfMonth = new Date(year, month, 1);
    let startDayOfWeek = firstDayOfMonth.getDay() - 1;
    if (startDayOfWeek === -1) startDayOfWeek = 6;

    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const daysInPrevMonth = new Date(year, month, 0).getDate();

    const days = [];

    // Previous month padding
    for (let i = startDayOfWeek - 1; i >= 0; i--) {
      const d = new Date(year, month - 1, daysInPrevMonth - i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr, isCurrentMonth: false, dayNum: d.getDate() });
    }

    // Current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const d = new Date(year, month, i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr, isCurrentMonth: true, dayNum: i });
    }

    // Next month padding to fill grid
    const remaining = (7 - (days.length % 7)) % 7;
    for (let i = 1; i <= remaining; i++) {
      const d = new Date(year, month + 1, i);
      const dateStr = d.toISOString().split('T')[0];
      days.push({ date: d, dateStr, isCurrentMonth: false, dayNum: i });
    }

    return days;
  }, [currentDate]);

  // Check day relationship with project duration
  const getDayMeta = (dateStr) => {
    const isStart = startDate === dateStr;
    const isTargetEnd = targetEndDate === dateStr;
    
    let isInsideRange = false;
    if (startDate && targetEndDate) {
      isInsideRange = dateStr >= startDate && dateStr <= targetEndDate;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const isToday = dateStr === todayStr;
    const isOverdue = targetEndDate && dateStr > targetEndDate && dateStr <= todayStr;

    const report = dailyReports.find(r => r.report_date === dateStr);
    const dayTasks = tasks.filter(t => t.due_date === dateStr || (t.week_start && t.week_end && dateStr >= t.week_start && dateStr <= t.week_end));

    return { isStart, isTargetEnd, isInsideRange, isToday, isOverdue, report, dayTasks };
  };

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const weekDayHeaders = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="space-y-6">
      {/* â”€â”€ Top Header Bar: Duration Estimator & Quick Adjustments â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-[#121212] border border-[#262626] rounded-2xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5">
          
          {/* Left: Duration Status & Dates */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-12 h-12 rounded-xl bg-[#FACB00]/10 border border-[#FACB00]/20 flex items-center justify-center text-[#FACB00] shrink-0">
              <CalendarIcon size={24} />
            </div>

            <div>
              <div className="flex items-center gap-2.5 flex-wrap">
                <h3 className="text-lg font-bold text-white flex items-center gap-2">
                  Project Schedule & Duration
                </h3>
                {timelineStatus.status !== 'not_set' && (
                  <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold border flex items-center gap-1 ${timelineStatus.color}`}>
                    {timelineStatus.status === 'delayed' && <AlertTriangle size={12} />}
                    {timelineStatus.status === 'today' && <Clock size={12} />}
                    {timelineStatus.status === 'on_track' && <CheckCircle2 size={12} />}
                    {timelineStatus.text}
                  </span>
                )}
              </div>

              {/* Date Ranges and Duration */}
              <div className="flex items-center gap-4 text-xs text-gray-400 mt-1.5 flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Start:</span>
                  <span className="font-bold text-white">
                    {startDate ? formatDate(startDate) : 'Not set'}
                  </span>
                </div>
                <span className="text-gray-600">â€¢</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Est. Duration:</span>
                  <span className="font-bold text-[#FACB00] bg-[#FACB00]/10 px-2 py-0.5 rounded">
                    {durationDays ? `${durationDays} day${durationDays === 1 ? '' : 's'}` : 'Not set'}
                  </span>
                </div>
                <span className="text-gray-600">â€¢</span>
                <div className="flex items-center gap-1.5">
                  <span className="text-gray-500">Target Finish:</span>
                  <span className="font-bold text-white">
                    {targetEndDate ? formatDate(targetEndDate) : 'Not set'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Quick Adjust Duration (+ / - Days) */}
          {canEdit && (
            <div className="flex items-center gap-2 flex-wrap bg-[#1a1a1a] p-1.5 rounded-xl border border-[#2d2d2d]">
              <span className="text-xs font-semibold text-gray-400 px-2">Adjust Duration:</span>
              
              <button
                type="button"
                onClick={() => adjustDuration(-1)}
                disabled={savingDates || !targetEndDate}
                className="px-3 py-1.5 rounded-lg bg-[#252525] hover:bg-[#333] text-gray-200 text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-40"
                title="Subtract 1 day from target end date"
              >
                <Minus size={13} /> 1 Day
              </button>

              <button
                type="button"
                onClick={() => adjustDuration(1)}
                disabled={savingDates}
                className="px-3 py-1.5 rounded-lg bg-[#FACB00] hover:bg-[#e0b600] text-black text-xs font-bold transition-colors flex items-center gap-1 disabled:opacity-40 shadow-sm"
                title="Add 1 day to target end date"
              >
                <Plus size={13} /> 1 Day
              </button>

              <button
                type="button"
                onClick={() => adjustDuration(3)}
                disabled={savingDates}
                className="px-2.5 py-1.5 rounded-lg bg-[#252525] hover:bg-[#333] text-gray-200 text-xs font-bold transition-colors disabled:opacity-40"
                title="Add 3 days"
              >
                +3 Days
              </button>

              <button
                type="button"
                onClick={() => adjustDuration(7)}
                disabled={savingDates}
                className="px-2.5 py-1.5 rounded-lg bg-[#252525] hover:bg-[#333] text-gray-200 text-xs font-bold transition-colors disabled:opacity-40"
                title="Add 1 week"
              >
                +1 Wk
              </button>

              {savingDates && <Loader2 size={16} className="animate-spin text-[#FACB00] ml-2" />}
            </div>
          )}
        </div>

        {/* Edit Date Inputs Row */}
        {canEdit && (
          <div className="mt-4 pt-4 border-t border-[#222] grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Start Date (Fecha de Inicio)
              </label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleSaveDates(e.target.value, targetEndDate)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FACB00]"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold uppercase tracking-wider text-gray-400 mb-1">
                Target Finish Date (Fecha Fin Estimada)
              </label>
              <input
                type="date"
                value={targetEndDate}
                onChange={(e) => handleSaveDates(startDate, e.target.value)}
                className="w-full bg-[#0a0a0a] border border-[#2a2a2a] rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#FACB00]"
              />
            </div>

            <div className="flex items-end">
              <p className="text-xs text-gray-500 pb-2">
                ðŸ’¡ Tip: Click any day on the calendar below to add daily notes, report delays, or log work.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* â”€â”€ Main Interactive Month Calendar Grid â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="bg-[#121212] border border-[#262626] rounded-2xl p-5 shadow-xl">
        {/* Calendar Nav Header */}
        <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold text-white">
              {monthNames[currentDate.getMonth()]} {currentDate.getFullYear()}
            </h2>
            <button
              type="button"
              onClick={() => setCurrentDate(new Date())}
              className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-[#222] text-gray-300 hover:text-white hover:bg-[#333] transition-colors"
            >
              Today
            </button>
          </div>

          {/* Month Controls & Legend */}
          <div className="flex items-center gap-4 flex-wrap">
            {/* Legend */}
            <div className="hidden md:flex items-center gap-3 text-xs text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                <span>Start</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-[#FACB00]"></span>
                <span>Est. Duration</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400"></span>
                <span>Target Finish</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded bg-violet-400"></span>
                <span>Daily Notes</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1))}
                className="p-2 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#282828] transition-colors"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                type="button"
                onClick={() => setCurrentDate(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1))}
                className="p-2 rounded-xl bg-[#1c1c1c] border border-[#2a2a2a] text-gray-300 hover:text-white hover:bg-[#282828] transition-colors"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </div>

        {/* Days of Week Header */}
        <div className="grid grid-cols-7 gap-2 mb-2 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">
          {weekDayHeaders.map((day, idx) => (
            <div key={idx} className="py-1">
              {day}
            </div>
          ))}
        </div>

        {/* Grid Cells */}
        <div className="grid grid-cols-7 gap-2">
          {calendarDays.map((dayObj, idx) => {
            const { isStart, isTargetEnd, isInsideRange, isToday, isOverdue, report, dayTasks } = getDayMeta(dayObj.dateStr);

            let cellBg = 'bg-[#181818]/60 border-[#262626] text-gray-300';
            if (!dayObj.isCurrentMonth) {
              cellBg = 'bg-[#111]/40 border-[#1c1c1c] text-gray-600 opacity-60';
            }

            if (isInsideRange && dayObj.isCurrentMonth) {
              cellBg = 'bg-[#FACB00]/10 border-[#FACB00]/30 text-white';
            }

            if (isOverdue && dayObj.isCurrentMonth) {
              cellBg = 'bg-red-500/10 border-red-500/30 text-white';
            }

            return (
              <div
                key={idx}
                onClick={() => handleDayClick(dayObj.dateStr)}
                className={`min-h-[105px] rounded-xl p-2 border flex flex-col justify-between transition-all cursor-pointer group hover:border-[#FACB00] hover:scale-[1.01] relative ${cellBg} ${
                  isToday ? 'ring-2 ring-blue-500/50' : ''
                }`}
              >
                {/* Cell Header: Day Number & Status Badges */}
                <div className="flex items-center justify-between gap-1">
                  <span
                    className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                      isToday
                        ? 'bg-blue-500 text-white font-black'
                        : isStart
                        ? 'bg-emerald-500 text-black font-black'
                        : isTargetEnd
                        ? 'bg-blue-500 text-white font-black'
                        : 'text-gray-400 group-hover:text-white'
                    }`}
                  >
                    {dayObj.dayNum}
                  </span>

                  {/* Start or End flags */}
                  {isStart && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-0.5">
                      <Flag size={9} /> Start
                    </span>
                  )}
                  {isTargetEnd && (
                    <span className="text-[10px] font-extrabold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-0.5">
                      <Flag size={9} /> Finish
                    </span>
                  )}
                </div>

                {/* Cell Body: Notes, Issues, and Tasks */}
                <div className="flex-1 my-1.5 flex flex-col gap-1 overflow-hidden">
                  {report && (
                    <div
                      className="bg-violet-950/50 border border-violet-500/30 rounded-lg p-1.5 text-[11px] text-violet-200 leading-tight flex items-start gap-1 shadow-sm"
                      title={report.notes || report.issues || report.work_completed}
                    >
                      <FileText size={12} className="text-violet-400 shrink-0 mt-0.5" />
                      <p className="line-clamp-2 font-medium">
                        {report.notes || report.issues || report.work_completed}
                      </p>
                    </div>
                  )}

                  {dayTasks.map(t => (
                    <div
                      key={t.id}
                      className="bg-[#262626] border border-[#333] rounded px-1.5 py-0.5 text-[10px] text-gray-300 truncate"
                    >
                      â€¢ {t.title}
                    </div>
                  ))}
                </div>

                {/* Cell Footer: Add Note Prompt on Hover */}
                <div className="opacity-0 group-hover:opacity-100 flex items-center justify-between text-[10px] text-[#FACB00] font-semibold transition-opacity">
                  <span>{report ? 'Edit note' : '+ Add note'}</span>
                  {report?.weather && (
                    <span>{report.weather === 'rain' ? 'ðŸŒ§ï¸' : 'â˜€ï¸'}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* â”€â”€ Daily Note / BitÃ¡cora Modal â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      {noteModalOpen && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-[#121212] border border-[#2a2a2a] rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl my-8">
            <div className="flex justify-between items-center p-6 border-b border-[#222]">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Edit3 size={20} className="text-[#FACB00]" />
                  Daily Note & Jobsite Report
                </h2>
                <p className="text-xs text-gray-400 mt-0.5">
                  {selectedDay ? formatDate(selectedDay) : ''}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setNoteModalOpen(false)}
                className="text-gray-400 hover:text-white p-1 rounded-lg transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveDayNote} className="p-6 space-y-4">
              {/* Daily Note Text */}
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-1.5">
                  Daily Log / Note (BitÃ¡cora Diaria) *
                </label>
                <textarea
                  required
                  rows={3}
                  value={dayNoteText}
                  onChange={(e) => setDayNoteText(e.target.value)}
                  placeholder="ej. Se acabaron los gutters, 1 dÃ­a mÃ¡s / Material recibido y techo 80% terminado..."
                  className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-xl p-3 text-sm focus:outline-none focus:border-[#FACB00] transition-colors resize-none placeholder:text-gray-600"
                />
                <p className="text-[11px] text-gray-500 mt-1">
                  Esta nota se mostrarÃ¡ en el calendario y en la tarjeta de proyectos del Dashboard principal.
                </p>
              </div>

              {/* Quick Delay Checkbox */}
              <div className="bg-[#181818] border border-[#2a2a2a] rounded-xl p-3.5 flex items-start gap-3">
                <input
                  type="checkbox"
                  id="addDelayCheck"
                  checked={addDayDelay}
                  onChange={(e) => setAddDayDelay(e.target.checked)}
                  className="mt-0.5 rounded text-[#FACB00] focus:ring-[#FACB00]"
                />
                <label htmlFor="addDelayCheck" className="text-xs text-gray-300 cursor-pointer">
                  <span className="font-bold text-[#FACB00]">AÃ±adir +1 DÃ­a de retraso a la fecha fin estimada</span>
                  <p className="text-gray-500 mt-0.5">
                    Extiende automÃ¡ticamente la duraciÃ³n del proyecto en 1 dÃ­a al guardar esta nota.
                  </p>
                </label>
              </div>

              {/* Optional Jobsite Details */}
              <div className="grid grid-cols-3 gap-3 pt-2">
                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">Weather</label>
                  <select
                    value={dayWeather}
                    onChange={(e) => setDayWeather(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#FACB00]"
                  >
                    <option value="sunny">â˜€ï¸ Sunny</option>
                    <option value="cloudy">â›… Cloudy</option>
                    <option value="rain">ðŸŒ§ï¸ Rain</option>
                    <option value="cold">â„ï¸ Cold</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">Crew Count</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="ej. 4"
                    value={dayCrewCount}
                    onChange={(e) => setDayCrewCount(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#FACB00]"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-gray-400 mb-1">Hours Worked</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    placeholder="ej. 8"
                    value={dayHoursWorked}
                    onChange={(e) => setDayHoursWorked(e.target.value)}
                    className="w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-2.5 py-2 text-xs focus:outline-none focus:border-[#FACB00]"
                  />
                </div>
              </div>

              {/* Modal Actions */}
              <div className="pt-4 flex items-center justify-between gap-3 border-t border-[#222]">
                {editingReportId ? (
                  <button
                    type="button"
                    onClick={() => handleDeleteDayNote(editingReportId)}
                    disabled={savingNote}
                    className="p-2.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Delete note"
                  >
                    <Trash2 size={16} />
                  </button>
                ) : <div />}

                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setNoteModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl font-bold text-gray-400 bg-[#1c1c1c] hover:bg-[#262626] transition-colors text-xs"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={savingNote}
                    className="px-5 py-2.5 rounded-xl font-bold text-black bg-[#FACB00] hover:bg-[#e0b600] transition-colors text-xs flex items-center gap-1.5 shadow-md disabled:opacity-50"
                  >
                    {savingNote ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                    Guardar Nota
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}