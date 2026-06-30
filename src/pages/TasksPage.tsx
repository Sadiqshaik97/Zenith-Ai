import { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Plus, 
  Trash2, 
  ChevronDown, 
  ChevronUp, 
  SlidersHorizontal,
  Check,
  Clock
} from 'lucide-react';

export default function TasksPage() {
  const [view, setView] = useState<'List' | 'Kanban' | 'Timeline'>('List');
  const [filterCategory, setFilterCategory] = useState<string>('All');
  const [filterPriority, setFilterPriority] = useState<string>('All');
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);

  // New task manual form inputs
  const [showAddForm, setShowAddForm] = useState(false);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [deadline, setDeadline] = useState(new Date().toISOString().split('T')[0]);
  const [time, setTime] = useState('12:00');
  const [priority, setPriority] = useState<'High' | 'Medium' | 'Low'>('Medium');
  const [category, setCategory] = useState('Work');
  const [effort, setEffort] = useState(2);

  const tasks = useStore((state) => state.tasks);
  const addTask = useStore((state) => state.addTask);
  const updateTask = useStore((state) => state.updateTask);
  const deleteTask = useStore((state) => state.deleteTask);
  const toggleSubtask = useStore((state) => state.toggleSubtask);
  const toggleTask = useStore((state) => state.toggleTask);

  const handleCreateTask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    addTask({
      title,
      description: desc,
      deadline,
      time,
      priority,
      status: 'Todo',
      effort,
      tags: [category],
      subtasks: [
        { id: `s_man_${Date.now()}_1`, text: 'Initial scoping step', completed: false },
        { id: `s_man_${Date.now()}_2`, text: 'Refine core execution points', completed: false }
      ]
    });

    setTitle('');
    setDesc('');
    setShowAddForm(false);
  };

  // Filter tasks
  const filteredTasks = tasks.filter((t) => {
    const matchesCat = filterCategory === 'All' || t.tags.includes(filterCategory);
    const matchesPrio = filterPriority === 'All' || t.priority === filterPriority;
    return matchesCat && matchesPrio;
  });

  return (
    <div className="flex flex-col gap-6 text-gray-800">
      
      {/* Page Header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-3xl border border-gray-100 shadow-sm">
        {/* Toggle Switches */}
        <div className="flex gap-1.5 bg-gray-100 p-1.5 rounded-2xl">
          {(['List', 'Kanban', 'Timeline'] as const).map((v) => (
            <button
              key={v}
              onClick={() => setView(v)}
              className={`text-xs font-bold px-4 py-2.5 rounded-xl transition-all cursor-pointer ${
                view === v 
                  ? 'bg-white text-gray-900 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-900'
              }`}
            >
              {v} View
            </button>
          ))}
        </div>

        <div className="flex gap-3">
          {/* Add Task Trigger */}
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-[#161719] hover:bg-black text-[#D2FC54] text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} />
            Add Task
          </button>
        </div>
      </div>

      {/* Manual Task Add Dialog Form */}
      {showAddForm && (
        <form onSubmit={handleCreateTask} className="bg-white p-6 rounded-3xl border border-gray-200 shadow-lg flex flex-col gap-4 animate-in slide-in-from-top-3 duration-200">
          <h3 className="font-extrabold text-sm text-gray-900">Define Workspace Task</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Task Title</label>
              <input 
                type="text" 
                placeholder="Finish study homework..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D2FC54]"
                required
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Category / Tag</label>
              <select 
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
              >
                <option value="Work">Work</option>
                <option value="Study">Study</option>
                <option value="Finance">Finance</option>
                <option value="Health">Health</option>
                <option value="Personal">Personal</option>
              </select>
            </div>
            <div className="flex flex-col gap-1 col-span-2">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Description</label>
              <textarea 
                placeholder="Provide task notes..."
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D2FC54]"
                rows={2}
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Deadline Date</label>
              <input 
                type="date" 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Deadline Time</label>
              <input 
                type="time" 
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Priority</label>
              <select 
                value={priority}
                onChange={(e: any) => setPriority(e.target.value)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-[10px] text-gray-400 font-bold uppercase">Estimated Effort (Hours)</label>
              <input 
                type="number" 
                value={effort}
                onChange={(e) => setEffort(parseInt(e.target.value) || 1)}
                className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                min={1}
              />
            </div>
          </div>
          <div className="flex gap-2 justify-end mt-2">
            <button 
              type="button" 
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              className="px-4 py-2 bg-[#D2FC54] text-[#161719] rounded-xl text-xs font-bold hover:bg-[#c0ec3d] cursor-pointer"
            >
              Create Task
            </button>
          </div>
        </form>
      )}

      {/* Filter Controls Row */}
      <div className="flex flex-col lg:flex-row gap-4 lg:gap-6 items-start lg:items-center bg-white px-5 py-3.5 rounded-2xl border border-gray-100 shadow-sm text-xs w-full overflow-hidden">
        <div className="flex items-center gap-2">
          <SlidersHorizontal size={14} className="text-gray-400" />
          <span className="text-gray-400 font-semibold uppercase tracking-wider mt-0.5">Filters</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-400 font-semibold uppercase tracking-wider mr-1 mt-0.5">Category:</span>
          {['All', 'Work', 'Study', 'Finance', 'Health'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filterCategory === cat 
                  ? 'bg-[#161719] text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className="h-4 w-px bg-gray-200 hidden lg:block"></div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-gray-400 font-semibold uppercase tracking-wider mr-1 mt-0.5">Priority:</span>
          {['All', 'High', 'Medium', 'Low'].map((prio) => (
            <button
              key={prio}
              onClick={() => setFilterPriority(prio)}
              className={`px-3 py-1 rounded-full font-bold transition-all cursor-pointer ${
                filterPriority === prio 
                  ? 'bg-[#161719] text-white shadow-sm' 
                  : 'bg-gray-100 text-gray-500 hover:text-gray-900'
              }`}
            >
              {prio}
            </button>
          ))}
        </div>
      </div>

      {/* 3. Main Views Grid Rendering */}
      {view === 'List' && (
        <div className="flex flex-col gap-3">
          {filteredTasks.length === 0 ? (
            <div className="bg-white rounded-3xl py-12 text-center border border-gray-100 text-gray-500 text-xs">
              No tasks match your filters.
            </div>
          ) : (
            filteredTasks.map((t) => {
              const isExpanded = expandedTaskId === t.id;
              const isCompleted = t.status === 'Done';
              return (
                <div key={t.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3.5 flex-1 min-w-0">
                      <button 
                        onClick={() => toggleTask(t.id)}
                        className={`w-5.5 h-5.5 rounded-xl border flex items-center justify-center transition-all cursor-pointer ${
                          isCompleted 
                            ? 'bg-[#D2FC54] border-[#D2FC54] text-[#161719]' 
                            : 'bg-white border-gray-300 text-transparent hover:border-gray-950'
                        }`}
                      >
                        <Check size={14} className="stroke-[3]" />
                      </button>
                      <div className="min-w-0">
                        <h4 className={`text-xs font-bold leading-snug truncate ${isCompleted ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                          {t.title}
                        </h4>
                        <div className="flex gap-3 items-center text-[10px] text-gray-400 mt-1 font-semibold">
                          <span className="flex items-center gap-1">
                            <Clock size={11} /> {t.deadline} @ {t.time}
                          </span>
                          <span>•</span>
                          <span>Effort: {t.effort} hrs</span>
                          <span>•</span>
                          <span className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">{t.tags[0]}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Priority Score badge */}
                      <span className="bg-red-50 text-red-600 text-[9px] font-extrabold px-2.5 py-0.5 rounded-full border border-red-100/50">
                        Aura Score {t.priorityScore}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        t.priority === 'High' ? 'bg-red-100 text-red-700' : t.priority === 'Medium' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {t.priority}
                      </span>
                      <button 
                        onClick={() => setExpandedTaskId(isExpanded ? null : t.id)}
                        className="text-gray-400 hover:text-gray-900 cursor-pointer p-1"
                      >
                        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                      </button>
                      <button 
                        onClick={() => deleteTask(t.id)}
                        className="text-gray-400 hover:text-red-500 cursor-pointer p-1"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>

                  {/* Checklist Subtasks Panel */}
                  {isExpanded && (
                    <div className="bg-gray-50 border-t border-gray-100 p-4 pl-12 flex flex-col gap-2.5">
                      <p className="text-[11px] text-gray-500 font-semibold">{t.description || 'No description provided.'}</p>
                      
                      <div className="flex flex-col gap-1.5 mt-2">
                        <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">Decomposed Steps Checklist:</span>
                        {t.subtasks.map((sub) => (
                          <div key={sub.id} className="flex items-center gap-2 text-xs">
                            <button
                              onClick={() => toggleSubtask(t.id, sub.id)}
                              className={`w-4.5 h-4.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer ${
                                sub.completed 
                                  ? 'bg-[#161719] border-[#161719] text-[#D2FC54]' 
                                  : 'bg-white border-gray-300 text-transparent hover:border-gray-900'
                              }`}
                            >
                              <Check size={11} className="stroke-[3]" />
                            </button>
                            <span className={`text-[11px] font-semibold ${sub.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                              {sub.text} {sub.duration && `(${sub.duration} min)`}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      )}

      {view === 'Kanban' && (
        <div className="flex flex-col lg:grid lg:grid-cols-3 gap-6 h-auto lg:h-[calc(100vh-240px)] overflow-visible lg:overflow-hidden">
          {(['Todo', 'InProgress', 'Done'] as const).map((status) => {
            const statusTasks = filteredTasks.filter((t) => {
              if (status === 'Todo') return t.status === 'Todo' || t.status === 'Inbox';
              return t.status === status;
            });
            return (
              <div key={status} className="bg-white rounded-3xl border border-gray-100 p-5 flex flex-col h-full overflow-hidden">
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
                  <h3 className="font-extrabold text-xs uppercase tracking-wider text-gray-900">
                    {status === 'Todo' ? 'To Do' : status === 'InProgress' ? 'In Progress' : 'Done'}
                  </h3>
                  <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{statusTasks.length}</span>
                </div>
                
                <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
                  {statusTasks.map((t) => (
                    <div 
                      key={t.id}
                      onClick={() => updateTask(t.id, { 
                        status: status === 'Todo' ? 'InProgress' : status === 'InProgress' ? 'Done' : 'Todo' 
                      })}
                      className="p-4 bg-gray-50 hover:bg-gray-100/80 rounded-2xl border border-gray-100/80 cursor-pointer transition-colors flex flex-col justify-between min-h-[110px]"
                    >
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 leading-snug line-clamp-2">{t.title}</h4>
                        <div className="flex gap-2 items-center text-[9px] text-gray-400 font-bold uppercase mt-2">
                          <span className="bg-gray-200/50 text-gray-600 px-1.5 py-0.5 rounded-md">{t.tags[0]}</span>
                          <span className={`px-1.5 py-0.5 rounded-md ${
                            t.priority === 'High' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-600'
                          }`}>{t.priority}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center text-[9px] text-gray-400 font-semibold mt-3 pt-2 border-t border-gray-200/40">
                        <span>Due: {t.deadline}</span>
                        <span className="text-[#A78BFA] font-bold">Score {t.priorityScore}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {view === 'Timeline' && (
        <div className="bg-white rounded-3xl border border-gray-100 p-6 shadow-sm flex flex-col gap-6">
          <div className="border-b border-gray-100 pb-3">
            <h3 className="font-extrabold text-sm text-gray-900">Task Timeline Roadmap</h3>
            <p className="text-[10px] text-gray-400 mt-1">Linear progression of focus periods and deadlines</p>
          </div>

          <div className="flex flex-col gap-6 relative pl-4 border-l-2 border-[#D2FC54]/40">
            {filteredTasks.map((t, idx) => {
              const isCompleted = t.status === 'Done';
              return (
                <div key={t.id} className="relative flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gray-50/50 hover:bg-gray-50 p-4 rounded-2xl border border-gray-100">
                  {/* Timeline Dot Indicator */}
                  <span className="absolute -left-[23px] top-6 w-3 h-3 rounded-full border-2 border-white bg-[#D2FC54] ring-4 ring-[#D2FC54]/10 shadow-sm"></span>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] font-bold bg-gray-200 text-gray-600 px-2 py-0.5 rounded-md">BLOCK #{idx + 1}</span>
                      <h4 className={`text-xs font-bold text-gray-950 ${isCompleted ? 'line-through text-gray-400' : ''}`}>{t.title}</h4>
                    </div>
                    <p className="text-[10px] text-gray-500 font-semibold mt-1 pl-1">
                      Due: <strong className="text-gray-700">{t.deadline} @ {t.time}</strong> • Expected Effort: {t.effort} hours
                    </p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] text-gray-400 font-bold uppercase">{t.status}</span>
                    <button 
                      onClick={() => toggleTask(t.id)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-xl transition-all cursor-pointer flex items-center gap-1.5 ${
                        isCompleted 
                          ? 'bg-gray-100 text-gray-400' 
                          : 'bg-[#D2FC54] text-[#161719] hover:bg-[#c0ec3d]'
                      }`}
                    >
                      {isCompleted ? 'Completed' : 'Finish Block'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

    </div>
  );
}
