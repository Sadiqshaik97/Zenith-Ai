import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { 
  Brain, 
  Clock, 
  Mic, 
  TrendingUp,
  Check,
  Edit,
  X,
  CheckCircle2,
  Play,
  Pause,
  RotateCw,
  Calendar
} from 'lucide-react';

export default function TodayPage() {
  const navigate = useNavigate();
  const [nlpText, setNlpText] = useState('');
  const [showLogModal, setShowLogModal] = useState(false);
  
  const tasks = useStore((state) => state.tasks);
  const habits = useStore((state) => state.habits);
  const events = useStore((state) => state.events);
  const wellness = useStore((state) => state.wellnessMetrics);
  const apiKey = useStore((state) => state.geminiApiKey);
  
  const addTask = useStore((state) => state.addTask);
  const toggleTask = useStore((state) => state.toggleTask);
  const toggleHabit = useStore((state) => state.toggleHabit);
  const updateWellnessMetrics = useStore((state) => state.updateWellnessMetrics);
  const sendMessage = useStore((state) => state.sendMessage);

  // Pomodoro Live Timer State
  const [timeLeft, setTimeLeft] = useState(1500); // 25 minutes = 1500 seconds
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [timerType, setTimerType] = useState<'Work' | 'Break'>('Work');

  // Form states for focus metrics modal
  const [formFocusTimeMinutes, setFormFocusTimeMinutes] = useState(wellness.focusTimeMinutes);
  const [formFocusTargetMinutes, setFormFocusTargetMinutes] = useState(wellness.focusTargetMinutes);

  // Timer Tick Side-effect
  useEffect(() => {
    let interval: any = null;
    if (isTimerRunning) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            setIsTimerRunning(false);
            // Handle timer completion
            if (timerType === 'Work') {
              updateWellnessMetrics({
                focusTimeMinutes: wellness.focusTimeMinutes + 25
              });
              alert("🎉 Excellent focus! 25-minute Pomodoro session completed. Time for a 5-minute break!");
              setTimerType('Break');
              return 300; // 5 mins break
            } else {
              alert("☕ Break completed! Ready to focus again?");
              setTimerType('Work');
              return 1500; // 25 mins work
            }
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isTimerRunning, timerType, wellness.focusTimeMinutes, updateWellnessMetrics]);

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setTimerType('Work');
    setTimeLeft(1500);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleOpenLogModal = () => {
    setFormFocusTimeMinutes(wellness.focusTimeMinutes);
    setFormFocusTargetMinutes(wellness.focusTargetMinutes);
    setShowLogModal(true);
  };

  const handleSaveMetrics = (e: React.FormEvent) => {
    e.preventDefault();
    updateWellnessMetrics({
      focusTimeMinutes: Number(formFocusTimeMinutes),
      focusTargetMinutes: Number(formFocusTargetMinutes)
    });
    setShowLogModal(false);
  };

  // Helper to format minutes into hours/minutes
  const formatDuration = (mins: number) => {
    if (mins >= 60) {
      const hrs = mins / 60;
      return `${hrs.toFixed(1).replace('.0', '')}h`;
    }
    return `${mins}m`;
  };

  // Filter tasks for today or overdue
  const todayTasks = tasks.filter((t) => t.status !== 'Done');
  const completedToday = tasks.filter((t) => t.status === 'Done');

  // Priorities
  const topPriorities = [...todayTasks]
    .sort((a, b) => (b.priorityScore || 0) - (a.priorityScore || 0))
    .slice(0, 3);

  // Filter focus block events for today
  const todayEvents = events.filter((e) => {
    if (!e.start) return false;
    const eventDate = new Date(e.start);
    const today = new Date();
    return eventDate.toDateString() === today.toDateString();
  }).sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());



  const handleQuickAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nlpText.trim()) return;
    
    const lower = nlpText.trim().toLowerCase();
    const commandKeywords = ['add', 'create', 'new', 'schedule', 'plan', 'complete', 'done', 'delete', 'remove', 'remind', 'optimize', 'solve'];
    const isCommand = commandKeywords.some(kw => lower.startsWith(kw) || lower.includes(' ' + kw + ' '));

    if (apiKey && apiKey !== 'mock_key' && isCommand) {
      // Redirect to Aura Assistant
      navigate('/assistant');
      setTimeout(() => {
        sendMessage(nlpText);
      }, 150);
    } else {
      // Quick Add NLP
      const priority = nlpText.toLowerCase().includes('high') ? 'High' : 'Medium';
      addTask({
        title: nlpText,
        description: 'Quick captured via dashboard nlp bar.',
        deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        time: '12:00',
        priority,
        status: 'Todo',
        effort: 2,
        tags: ['QuickCapture'],
        subtasks: []
      });
    }
    setNlpText('');
  };

  // Real-time metrics calculations
  const completedTodayCount = completedToday.length;
  const completedHabitsCount = habits.filter(h => h.completedToday).length;

  const focusProgressPercent = Math.min(100, Math.round((wellness.focusTimeMinutes / wellness.focusTargetMinutes) * 100));
  const taskProgressPercent = tasks.length > 0 ? Math.min(100, Math.round((completedTodayCount / tasks.length) * 100)) : 0;
  const habitProgressPercent = habits.length > 0 ? Math.min(100, Math.round((completedHabitsCount / habits.length) * 100)) : 0;

  return (
    <div className="flex flex-col gap-6 text-gray-800 font-sans max-w-7xl mx-auto">
      
      {/* Responsive Dashboard Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Focus Tracker & scheduled events (col-span-8) */}
        <div className="lg:col-span-8 flex flex-col gap-6">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Card 1: Focus Pomodoro Tracker */}
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[380px]">
              <div className="flex justify-between items-start border-b border-gray-100 pb-3">
                <div>
                  <span className="text-[10px] text-[#A78BFA] font-extrabold uppercase tracking-wider">Real-time Focus</span>
                  <div className="flex items-center gap-2 mt-1">
                    {/* Pomodoro Clock Display */}
                    <span className="text-2xl md:text-3xl font-extrabold text-gray-900 font-mono tracking-tight">{formatTime(timeLeft)}</span>
                    
                    {/* Timer Controls */}
                    <div className="flex gap-1">
                      <button 
                        onClick={toggleTimer}
                        className={`p-1.5 rounded-lg border transition-all cursor-pointer ${
                          isTimerRunning 
                            ? 'bg-red-50 border-red-100 text-red-500 hover:bg-red-100' 
                            : 'bg-gray-50 border-gray-200 text-gray-600 hover:bg-gray-100'
                        }`}
                        title={isTimerRunning ? "Pause Timer" : "Start Focus Block"}
                      >
                        {isTimerRunning ? <Pause size={12} /> : <Play size={12} />}
                      </button>
                      <button 
                        onClick={resetTimer}
                        className="p-1.5 rounded-lg bg-gray-50 border border-gray-200 hover:bg-gray-100 text-gray-400 hover:text-red-500 transition-colors cursor-pointer"
                        title="Reset Timer"
                      >
                        <RotateCw size={12} />
                      </button>
                    </div>
                    <span className="text-[8px] bg-purple-50 text-[#A78BFA] border border-[#A78BFA]/20 px-1.5 py-0.5 rounded-md font-extrabold uppercase tracking-wider font-mono">
                      {timerType}
                    </span>
                  </div>
                </div>
                <button 
                  onClick={handleOpenLogModal}
                  className="w-8 h-8 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-center text-gray-400 hover:text-gray-900 cursor-pointer hover:bg-gray-100 transition-colors"
                  title="Configure Targets"
                >
                  <Edit size={14} />
                </button>
              </div>

              {/* Overlapping Venn Circles centered in fixed size container to lock overlap */}
              <div className="relative w-64 h-36 mx-auto my-4 flex items-center justify-center">
                
                {/* Circle 1: Focus Duration (Purple) */}
                <div className="absolute w-24 h-24 rounded-full bg-[#A78BFA]/10 border border-[#A78BFA]/30 flex flex-col items-center justify-center left-4 top-1 z-10 shadow-md shadow-[#a78bfa]/5 transition-all hover:scale-105 hover:z-30 duration-300 select-none">
                  <span className="text-lg font-extrabold text-[#7c3aed]">{formatDuration(wellness.focusTimeMinutes)}</span>
                  <span className="text-[9px] text-[#A78BFA] font-bold uppercase tracking-wide">focused</span>
                </div>

                {/* Circle 2: Tasks Completed (Dark Grey) */}
                <div className="absolute w-24 h-24 rounded-full bg-[#161719] border border-gray-800 flex flex-col items-center justify-center right-4 top-1 z-20 shadow-md shadow-black/10 transition-all hover:scale-105 hover:z-30 duration-300 select-none">
                  <span className="text-xl font-extrabold text-white">{completedTodayCount}</span>
                  <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wide">tasks</span>
                </div>

                {/* Circle 3: Habits Completed (Lime-Green) */}
                <div className="absolute w-20 h-20 rounded-full bg-[#E4FC86] border border-[#d2fc54] flex flex-col items-center justify-center left-1/2 -translate-x-1/2 top-12 z-25 shadow-md shadow-[#d2fc54]/10 transition-all hover:scale-105 hover:z-30 duration-300 select-none">
                  <span className="text-base font-extrabold text-gray-900">{completedHabitsCount}</span>
                  <span className="text-[8px] text-gray-900/60 font-extrabold uppercase tracking-wider">habits</span>
                </div>

              </div>

              {/* Progress Gauges */}
              <div className="flex flex-col gap-2 pt-2 border-t border-gray-100">
                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-gray-900">Focus Target ({focusProgressPercent}%)</span>
                    <span className="text-gray-400">{wellness.focusTimeMinutes} / {wellness.focusTargetMinutes} min</span>
                  </div>
                  <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#A78BFA] rounded-full transition-all duration-500" style={{ width: `${focusProgressPercent}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-gray-900">Tasks Done ({taskProgressPercent}%)</span>
                    <span className="text-gray-400">{completedTodayCount} / {tasks.length}</span>
                  </div>
                  <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-gray-900 rounded-full transition-all duration-500" style={{ width: `${taskProgressPercent}%` }}></div>
                  </div>
                </div>

                <div className="flex flex-col gap-1">
                  <div className="flex justify-between items-center text-[10px] font-bold">
                    <span className="text-gray-900">Habits Kept ({habitProgressPercent}%)</span>
                    <span className="text-gray-400">{completedHabitsCount} / {habits.length}</span>
                  </div>
                  <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-[#D2FC54] rounded-full transition-all duration-500" style={{ width: `${habitProgressPercent}%` }}></div>
                  </div>
                </div>
              </div>
            </div>

            {/* Card 2: Today's Focus Blocks Timeline */}
            <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[380px]">
              <div>
                <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                  <Calendar size={14} className="text-[#A78BFA]" />
                  Today's Scheduled Slots
                </h3>
                <p className="text-[10px] text-gray-400 mt-1 leading-snug">Visual timeline of slots mapped by the AI schedule algorithm.</p>
              </div>

              <div className="flex-1 overflow-y-auto max-h-[220px] pr-1 flex flex-col gap-3 my-4">
                {todayEvents.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-gray-100 rounded-2xl bg-gray-50/50 my-auto">
                    <Clock size={20} className="text-gray-300 mb-1" />
                    <span className="text-[10px] font-bold text-gray-600">No scheduled blocks today</span>
                    <span className="text-[9px] text-gray-400 mt-0.5 leading-snug">Use auto-schedule on calendar to structure your focus hours!</span>
                  </div>
                ) : (
                  todayEvents.map((ev) => {
                    const sTime = new Date(ev.start).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    const eTime = new Date(ev.end).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                    return (
                      <div key={ev.id} className="relative pl-6 border-l border-purple-100 py-1">
                        <div className="absolute left-[-4.5px] top-2.5 w-2 h-2 rounded-full bg-[#A78BFA]"></div>
                        <h4 className="text-xs font-bold text-gray-900 leading-tight">{ev.title}</h4>
                        <span className="text-[9px] text-[#A78BFA] font-bold mt-1 block font-mono">{sTime} - {eTime}</span>
                      </div>
                    );
                  })
                )}
              </div>

              <div className="border-t border-gray-100 pt-3 text-center">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">
                  Total blocks today: <strong className="text-gray-950 font-extrabold">{todayEvents.length}</strong>
                </span>
              </div>
            </div>

          </div>

          {/* Top Priorities Stack */}
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider">Top Priorities Stack</h3>
              <span className="text-[9px] text-gray-400 font-extrabold bg-gray-100 px-2 py-0.5 rounded-full">Aura Sorted</span>
            </div>

            <div className="flex flex-col gap-3">
              {topPriorities.length === 0 ? (
                <div className="py-8 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-2xl bg-gray-50/40 flex flex-col items-center justify-center p-6">
                  <CheckCircle2 size={24} className="text-gray-300 mb-1.5" />
                  <span className="font-bold text-gray-700">No pending priority tasks</span>
                  <span className="text-[10px] text-gray-400 mt-1 max-w-[280px]">Add tasks via Quick Capture or chat with Aura to schedule focus blocks!</span>
                </div>
              ) : (
                topPriorities.map((task) => (
                  <div 
                    key={task.id} 
                    className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-gray-200 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => toggleTask(task.id)}
                        className="w-5 h-5 rounded-xl border border-gray-300 flex items-center justify-center hover:border-gray-900 transition-colors cursor-pointer text-transparent hover:text-gray-950 bg-white"
                      >
                        <Check size={12} className="stroke-[3]" />
                      </button>
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 leading-none">{task.title}</h4>
                        <p className="text-[9px] text-gray-400 mt-1.5 font-medium">Estimate: {task.effort}h · Due: {task.deadline}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between sm:justify-end gap-3 border-t sm:border-t-0 border-gray-100 pt-2 sm:pt-0">
                      <span className="bg-red-50 text-red-600 text-[8px] font-extrabold px-2 py-0.5 rounded-full border border-red-100/50">
                        Score {task.priorityScore}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                        task.priority === 'High' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {task.priority}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Right Column: Quick Capture + Consistency Board (col-span-4) */}
        <div className="lg:col-span-4 flex flex-col gap-6">
          
          {/* Card 4: Quick Capture */}
          <div className="bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col justify-between min-h-[180px]">
            <div>
              <h3 className="text-xs font-extrabold text-gray-900 flex items-center gap-1.5 uppercase tracking-wider">
                <Brain className="text-[#A78BFA]" size={14} />
                Quick Capture
              </h3>
              <p className="text-[10px] text-gray-400 mt-1">Direct task registration (e.g. Prepare deck high priority)</p>
            </div>

            <form onSubmit={handleQuickAdd} className="relative mt-3">
              <input 
                type="text"
                placeholder="Type and hit Enter..."
                value={nlpText}
                onChange={(e) => setNlpText(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl py-2.5 pl-4 pr-10 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#D2FC54] focus:ring-1 focus:ring-[#D2FC54] transition-all"
              />
              <button 
                type="button" 
                onClick={() => useStore.getState().sendMessage("voice dictation active")}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 cursor-pointer"
              >
                <Mic size={14} />
              </button>
            </form>

            <div className="flex justify-between items-center text-[10px] text-gray-400 mt-3 font-bold uppercase tracking-wider">
              <span>Done: <strong className="text-gray-950 font-extrabold">{completedTodayCount}</strong></span>
              <span>Pending: <strong className="text-gray-950 font-extrabold">{todayTasks.length}</strong></span>
            </div>
            
          {/* Card 5: Habits Consistency Board */}
          <div className="flex-1 bg-white rounded-3xl p-5 md:p-6 shadow-sm border border-gray-100 flex flex-col">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xs font-extrabold text-gray-900 uppercase tracking-wider flex items-center gap-1.5">
                <TrendingUp size={14} className="text-[#D2FC54]" />
                Habits Board
              </h3>
              <span className="text-[9px] text-gray-400 font-bold bg-gray-100 px-2 py-0.5 rounded-full">{completedHabitsCount}/{habits.length} kept</span>
            </div>

            <div className="flex flex-col gap-3">
              {habits.length === 0 ? (
                <div className="py-10 text-center text-gray-400 text-xs border border-dashed border-gray-200 rounded-2xl bg-gray-50/40 flex flex-col items-center justify-center p-4">
                  <span className="font-bold text-gray-700">No habits tracked</span>
                  <span className="text-[9px] text-gray-400 mt-1 max-w-[180px]">Define and build streak routines in Goals page!</span>
                </div>
              ) : (
                habits.map((h) => (
                  <div 
                    key={h.id} 
                    className="flex items-center justify-between p-2.5 bg-gray-50 rounded-2xl border border-gray-100"
                  >
                    <span className="text-xs font-bold text-gray-900 truncate max-w-[130px]">{h.name}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[9px] text-gray-500 font-bold">🔥 {h.streak}d</span>
                      <button 
                        onClick={() => toggleHabit(h.id)}
                        className={`w-5 h-5 rounded-xl flex items-center justify-center transition-all cursor-pointer border ${
                          h.completedToday 
                            ? 'bg-[#D2FC54] border-[#D2FC54] text-[#161719]' 
                            : 'bg-white border-gray-300 text-transparent hover:border-gray-900'
                        }`}
                      >
                        <Check size={12} className="stroke-[3]" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          </div>

        </div>

      </div>

      {/* Focus Target Log Modal */}
      {showLogModal && (
        <div className="fixed inset-0 bg-[#161719]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-sm w-full border border-gray-100 shadow-2xl flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-2.5">
              <h3 className="text-sm font-extrabold text-gray-900">Update Focus Goals</h3>
              <button 
                onClick={() => setShowLogModal(false)}
                className="text-gray-400 hover:text-gray-900 cursor-pointer p-1 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveMetrics} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Focus Time Completed (Minutes)</label>
                <input 
                  type="number" 
                  value={formFocusTimeMinutes}
                  onChange={(e) => setFormFocusTimeMinutes(Number(e.target.value))}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D2FC54]"
                  min={0}
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] text-gray-400 font-bold uppercase">Daily Focus Target (Minutes)</label>
                <input 
                  type="number" 
                  value={formFocusTargetMinutes}
                  onChange={(e) => setFormFocusTargetMinutes(Number(e.target.value))}
                  className="bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-[#D2FC54]"
                  min={1}
                  required
                />
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 justify-end mt-2 border-t border-gray-100 pt-3">
                <button 
                  type="button"
                  onClick={() => setShowLogModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-xl text-xs font-bold hover:bg-gray-50 cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-5 py-2 bg-[#D2FC54] text-[#161719] rounded-xl text-xs font-bold hover:bg-[#c0ec3d] cursor-pointer shadow-md shadow-[#d2fc54]/10"
                >
                  Save Goals
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
