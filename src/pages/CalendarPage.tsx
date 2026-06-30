import { useState } from 'react';
import { useStore } from '../store/useStore';
import { CalendarEvent } from '../types';
import { 
  Calendar, 
  Sparkles, 
  Brain, 
  Plus, 
  Check, 
  ShieldAlert,
  X,
  Trash2
} from 'lucide-react';

export default function CalendarPage() {
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [optComplete, setOptComplete] = useState(false);
  const [addModal, setAddModal] = useState<{ day: string; hour: number } | null>(null);
  const [removeConfirm, setRemoveConfirm] = useState<CalendarEvent | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [customTitle, setCustomTitle] = useState('');

  const tasks = useStore((state) => state.tasks);
  const events = useStore((state) => state.events);
  const addEvent = useStore((state) => state.addEvent);
  const deleteEvent = useStore((state) => state.deleteEvent);
  const runAiScheduler = useStore((state) => state.runAiScheduler);

  const weekdays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const hourlySlots = [9, 10, 11, 13, 14, 15, 16];

  const handleAutoSchedule = () => {
    setIsOptimizing(true);
    setOptComplete(false);
    setTimeout(() => {
      runAiScheduler();
      setIsOptimizing(false);
      setOptComplete(true);
      setTimeout(() => setOptComplete(false), 4000);
    }, 1500);
  };

  // Group events by Day-Hour for grid lookup
  const eventRegistry: { [key: string]: CalendarEvent } = {};
  events.forEach((ev) => {
    const startDate = new Date(ev.start);
    const dayIndex = startDate.getDay();
    const hour = startDate.getHours();
    if (dayIndex >= 1 && dayIndex <= 5) {
      const dayName = weekdays[dayIndex - 1];
      const key = `${dayName}-${hour}`;
      eventRegistry[key] = ev;
    }
  });

  const unscheduledTasks = tasks.filter((t) => t.status !== 'Done' && !t.scheduledDay);
  const pendingTasks = tasks.filter((t) => t.status !== 'Done');
  const conflictsDetected = unscheduledTasks.some((t) => t.priority === 'High');

  const handleOpenAdd = (day: string, hour: number) => {
    setAddModal({ day, hour });
    setSelectedTaskId('');
    setCustomTitle('');
  };

  const handleConfirmAdd = () => {
    if (!addModal) return;
    const { day, hour } = addModal;

    const today = new Date();
    const dayMap: { [k: string]: number } = {
      Monday: 1, Tuesday: 2, Wednesday: 3, Thursday: 4, Friday: 5
    };
    const targetDay = dayMap[day];
    const diff = (targetDay - today.getDay() + 7) % 7 || 7;
    const slotDate = new Date(today);
    slotDate.setDate(today.getDate() + diff);
    slotDate.setHours(hour, 0, 0, 0);
    const endDate = new Date(slotDate);
    endDate.setHours(hour + 1, 0, 0, 0);

    const task = pendingTasks.find((t) => t.id === selectedTaskId);
    const title = task ? task.title : customTitle.trim() || 'Focus Block';

    addEvent({
      title,
      start: slotDate.toISOString(),
      end: endDate.toISOString(),
      type: 'Focus'
    });

    setAddModal(null);
  };

  const handleRemoveEvent = () => {
    if (!removeConfirm) return;
    deleteEvent(removeConfirm.id);
    setRemoveConfirm(null);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 text-gray-800 h-full overflow-y-auto lg:overflow-hidden max-w-7xl mx-auto w-full">
      
      {/* 1. Main Calendar Grid */}
      <div className="flex-1 flex flex-col gap-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm overflow-visible lg:overflow-hidden">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <Calendar size={20} className="text-gray-900" />
            <h2 className="text-base font-extrabold text-gray-900">Aura AI Time Blocker</h2>
          </div>
          <div className="flex gap-2.5">
            <button 
              onClick={handleAutoSchedule}
              disabled={isOptimizing}
              className="bg-[#D2FC54] hover:bg-[#c0ec3d] text-[#161719] text-xs font-bold px-4 py-2.5 rounded-xl transition-all shadow-md shadow-[#d2fc54]/10 cursor-pointer flex items-center gap-1.5"
            >
              <Sparkles size={14} />
              {isOptimizing ? 'Optimizing...' : 'AI Auto-Schedule'}
            </button>
          </div>
        </div>

        {optComplete && (
          <div className="p-3 bg-green-50 border border-green-200 text-green-800 rounded-2xl text-[11px] font-bold flex items-center gap-2 animate-in fade-in duration-200">
            <Check size={14} className="stroke-[3]" />
            Optimal schedule computed! Overlapping deadlines resolved and focus blocks mapped.
          </div>
        )}

        {/* Calendar Grid */}
        <div className="flex-1 overflow-auto pr-1">
          <table className="w-full border-collapse border-spacing-0">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="w-20 py-3 text-[10px] text-gray-400 font-bold uppercase tracking-wider text-center">Time</th>
                {weekdays.map((day) => (
                  <th key={day} className="py-3 text-[10px] text-gray-900 font-extrabold uppercase tracking-wider text-center border-l border-gray-50">{day}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {hourlySlots.map((hour) => {
                const isAM = hour < 12;
                const displayTime = `${isAM ? hour : hour === 12 ? 12 : hour - 12}:00 ${isAM ? 'AM' : 'PM'}`;
                return (
                  <tr key={hour} className="border-b border-gray-100 hover:bg-gray-50/20">
                    <td className="py-4 text-[10px] font-extrabold text-gray-400 text-center font-mono border-r border-gray-50">{displayTime}</td>
                    {weekdays.map((day) => {
                      const key = `${day}-${hour}`;
                      const event = eventRegistry[key];
                      return (
                        <td key={day} className="p-1 border-l border-gray-50 align-top h-20 min-w-[120px]">
                          {event ? (
                            <div 
                              className={`p-2.5 rounded-xl text-[10px] leading-tight h-full shadow-sm flex flex-col justify-between border group relative ${
                                event.type === 'Focus' 
                                  ? 'bg-[#A78BFA]/10 border-[#A78BFA]/30 text-gray-900' 
                                  : 'bg-[#161719] border-gray-800 text-white'
                              }`}
                            >
                              <div className="font-extrabold line-clamp-2">{event.title}</div>
                              <div className="flex justify-between items-center text-[8px] text-gray-400 font-bold uppercase mt-1">
                                <span>{event.type}</span>
                                {event.type === 'Focus' && <span className="text-[#A78BFA]">1h Block</span>}
                              </div>
                              {/* Remove button — appears on hover */}
                              <button
                                onClick={() => setRemoveConfirm(event)}
                                className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 bg-red-500 hover:bg-red-600 text-white rounded-lg w-5 h-5 flex items-center justify-center transition-all cursor-pointer shadow-sm"
                                title="Remove from calendar"
                              >
                                <X size={10} />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => handleOpenAdd(day, hour)}
                              className="w-full h-full rounded-xl border border-dashed border-gray-200/60 hover:border-gray-300 hover:bg-gray-50/50 flex items-center justify-center transition-all cursor-pointer text-transparent hover:text-gray-400"
                              title={`Add task to ${day} ${displayTime}`}
                            >
                              <Plus size={14} />
                            </button>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Sidebar Panel */}
      <div className="w-full lg:w-80 flex flex-col gap-5 h-auto lg:h-full overflow-visible lg:overflow-hidden pb-6 lg:pb-0 flex-shrink-0">
        
        {/* AI Circadian Insights */}
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col gap-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-1.5">
            <Brain size={15} className="text-[#A78BFA]" />
            AI Scheduling Resolver
          </h3>
          
          <div className="flex flex-col gap-3 mt-1">
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Circadian Peak Focus</span>
                <h4 className="text-xs font-bold text-gray-900 mt-0.5">09:00 AM - 12:00 PM</h4>
              </div>
              <span className="bg-[#D2FC54] text-[#161719] text-[9px] font-extrabold px-2 py-0.5 rounded-full">Peak</span>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-gray-400 font-bold uppercase">Recovery Buffer</span>
                <h4 className="text-xs font-bold text-gray-900 mt-0.5">03:00 PM - 05:00 PM</h4>
              </div>
              <span className="bg-gray-200 text-gray-600 text-[9px] font-extrabold px-2 py-0.5 rounded-full">Buffer</span>
            </div>
          </div>
        </div>

        {/* Unscheduled Queue */}
        <div className="flex-1 bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex flex-col h-full overflow-hidden">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-3">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900">Unscheduled Queue</h3>
            <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{unscheduledTasks.length}</span>
          </div>

          {conflictsDetected && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-800 rounded-2xl text-[10px] font-bold flex gap-2 items-start mb-3 animate-pulse">
              <ShieldAlert size={14} className="flex-shrink-0 mt-0.5" />
              <span>Conflict: High priority tasks unallocated. Overlap risk elevated.</span>
            </div>
          )}

          <div className="flex-1 overflow-y-auto flex flex-col gap-2.5 pr-1">
            {unscheduledTasks.length === 0 ? (
              <p className="text-[11px] text-gray-400 text-center py-8">All tasks scheduled. Capacity balanced!</p>
            ) : (
              unscheduledTasks.map((t) => (
                <div key={t.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col gap-1 hover:border-gray-200 transition-colors">
                  <h4 className="text-[11px] font-bold text-gray-900 leading-snug line-clamp-1">{t.title}</h4>
                  <div className="flex justify-between items-center text-[9px] text-gray-400 font-bold uppercase mt-1">
                    <span>Effort: {t.effort}h</span>
                    <span className="text-red-500 font-extrabold">Score {t.priorityScore}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>

      {/* ── Add Task to Slot Modal ── */}
      {addModal && (
        <div className="fixed inset-0 bg-[#161719]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Add to Calendar</h3>
                <p className="text-[10px] text-gray-400 mt-0.5 font-medium">
                  {addModal.day} · {addModal.hour < 12 ? addModal.hour : addModal.hour === 12 ? 12 : addModal.hour - 12}:00 {addModal.hour < 12 ? 'AM' : 'PM'}
                </p>
              </div>
              <button onClick={() => setAddModal(null)} className="text-gray-400 hover:text-gray-900 p-1.5 rounded-xl hover:bg-gray-100 cursor-pointer transition-colors">
                <X size={16} />
              </button>
            </div>

            {/* Pick from existing tasks */}
            {pendingTasks.length > 0 && (
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Pick a Pending Task</label>
                <div className="flex flex-col gap-2 max-h-48 overflow-y-auto pr-1">
                  {pendingTasks.map((t) => (
                    <button
                      key={t.id}
                      onClick={() => { setSelectedTaskId(t.id); setCustomTitle(''); }}
                      className={`w-full text-left p-3 rounded-2xl border text-xs transition-all cursor-pointer ${
                        selectedTaskId === t.id
                          ? 'bg-[#D2FC54]/10 border-[#D2FC54] text-gray-900'
                          : 'bg-gray-50 border-gray-100 text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="font-bold block truncate">{t.title}</span>
                      <span className="text-[9px] text-gray-400 mt-0.5 block">Due: {t.deadline} · {t.priority}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Custom title input */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">
                {pendingTasks.length > 0 ? 'Or Type a Custom Title' : 'Event Title'}
              </label>
              <input 
                type="text"
                placeholder="e.g. Deep work session..."
                value={customTitle}
                onChange={(e) => { setCustomTitle(e.target.value); setSelectedTaskId(''); }}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3.5 py-2.5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#D2FC54] focus:ring-1 focus:ring-[#D2FC54] transition-all"
              />
            </div>

            <div className="flex gap-2 border-t border-gray-100 pt-4">
              <button
                onClick={() => setAddModal(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAdd}
                disabled={!selectedTaskId && !customTitle.trim()}
                className="flex-1 py-2.5 bg-[#D2FC54] hover:bg-[#c0ec3d] text-[#161719] rounded-xl text-xs font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed shadow-md shadow-[#d2fc54]/10"
              >
                Add to Calendar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Remove Event Confirm Modal ── */}
      {removeConfirm && (
        <div className="fixed inset-0 bg-[#161719]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-xs w-full border border-gray-100 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center flex-shrink-0">
                <Trash2 size={18} className="text-red-500" />
              </div>
              <div>
                <h3 className="text-sm font-extrabold text-gray-900">Remove from Calendar</h3>
                <p className="text-[10px] text-gray-400 mt-0.5">This will delete the event from your schedule.</p>
              </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100">
              <p className="text-xs font-bold text-gray-900 truncate">{removeConfirm.title}</p>
              <p className="text-[9px] text-gray-400 mt-1 font-medium">
                {new Date(removeConfirm.start).toLocaleDateString('en-US', { weekday: 'long' })} · {new Date(removeConfirm.start).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setRemoveConfirm(null)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                Keep It
              </button>
              <button
                onClick={handleRemoveEvent}
                className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm"
              >
                Remove
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
