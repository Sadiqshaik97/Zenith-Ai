import { useStore } from '../store/useStore';
import { 
  BarChart2, 
  Brain, 
  Lightbulb, 
  TrendingUp, 
  Clock, 
  CheckCircle
} from 'lucide-react';

export default function InsightsPage() {
  const tasks = useStore((state) => state.tasks);
  const habits = useStore((state) => state.habits);

  const completedTasks = tasks.filter((t) => t.status === 'Done');
  const incompleteTasks = tasks.filter((t) => t.status !== 'Done');

  const totalEffortDone = completedTasks.reduce((acc, t) => acc + t.effort, 0);
  const totalEffortPending = incompleteTasks.reduce((acc, t) => acc + t.effort, 0);

  // Dynamic advice
  const getAIAdvice = () => {
    if (incompleteTasks.length === 0) {
      return "Excellent consistency! Your queue is completely balanced. Explore adding a learning goal or routine stretch.";
    }
    const highPriorityCount = incompleteTasks.filter((t) => t.priority === 'High').length;
    if (highPriorityCount > 1) {
      return `Critical warning: You have ${highPriorityCount} High priority tasks pending. Aura recommends postponing collaborative calls and reserving your Morning Circadian Peak for deep focus execution.`;
    }
    return "Workload is stable. Maintain standard POMODORO blocks to ensure task progression matches target schedule timelines.";
  };

  return (
    <div className="flex flex-col gap-6 text-gray-800 font-sans max-w-7xl mx-auto">
      
      {/* 1. Header Overview Cards (Responsive) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Focus Completed</span>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{totalEffortDone} hrs</h3>
          </div>
          <div className="bg-green-50 text-green-600 p-2.5 rounded-xl">
            <CheckCircle size={20} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Queue Workload</span>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{totalEffortPending} hrs</h3>
          </div>
          <div className="bg-amber-50 text-amber-600 p-2.5 rounded-xl">
            <Clock size={20} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Habit Consistency</span>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">
              {habits.length > 0 ? Math.round((habits.filter(h => h.completedToday).length / habits.length) * 100) : 0}%
            </h3>
          </div>
          <div className="bg-purple-50 text-purple-600 p-2.5 rounded-xl">
            <TrendingUp size={20} />
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-gray-100 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Completed Stack</span>
            <h3 className="text-2xl font-extrabold text-gray-900 mt-1">{completedTasks.length} / {tasks.length}</h3>
          </div>
          <div className="bg-blue-50 text-blue-600 p-2.5 rounded-xl">
            <BarChart2 size={20} />
          </div>
        </div>
      </div>

      {/* 2. Visual Charts Row (Responsive) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Hourly Productivity Curve */}
        <div className="lg:col-span-8 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[300px]">
          <div className="flex justify-between items-center border-b border-gray-100 pb-3 mb-4">
            <div>
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900">Hourly Focus Efficiency</h3>
              <p className="text-[9px] text-gray-400 mt-0.5">Average output ratings recorded across active blocks</p>
            </div>
            <span className="bg-[#D2FC54] text-[#161719] text-[9px] font-extrabold px-2.5 py-0.5 rounded-full">Peak Optimized</span>
          </div>

          {/* Styled chart bars */}
          <div className="flex-1 flex items-end justify-between px-1 md:px-4 pb-2 overflow-x-auto gap-3">
            {[
              { time: '09 AM', eff: 90, label: 'Deep Work Peak' },
              { time: '11 AM', eff: 80, label: 'High' },
              { time: '01 PM', eff: 45, label: 'Slump' },
              { time: '03 PM', eff: 65, label: 'Medium Collab' },
              { time: '05 PM', eff: 35, label: 'Low Admin' },
              { time: '07 PM', eff: 75, label: 'Refactor Focus' }
            ].map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-2 w-14 justify-end h-full group relative flex-shrink-0">
                {/* Floating tooltip */}
                <div className="absolute bottom-full mb-2 bg-[#161719] text-[#D2FC54] text-[9px] font-bold px-2 py-1 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap shadow-md z-10">
                  {item.label} ({item.eff}%)
                </div>
                
                <div 
                  className={`w-5 rounded-full transition-all duration-500 bg-gray-100 group-hover:scale-y-105 cursor-pointer ${
                    item.eff >= 80 
                      ? 'bg-gradient-to-t from-[#A78BFA] to-[#D2FC54]' 
                      : item.eff >= 60 
                        ? 'bg-[#161719]' 
                        : 'bg-gray-200'
                  }`}
                  style={{ height: `${item.eff}%` }}
                ></div>
                <span className="text-[9px] text-gray-400 font-extrabold tracking-tight">{item.time}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Suggestion Card 3 */}
        <div className="lg:col-span-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-[300px]">
          <div>
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900 flex items-center gap-1.5 border-b border-gray-100 pb-3">
              <Lightbulb size={15} className="text-amber-500 fill-amber-500" />
              Aura Coach Insights
            </h3>
            
            <div className="mt-4 flex gap-3 items-start">
              <div className="bg-[#D2FC54]/10 text-[#161719] p-2.5 rounded-xl mt-1">
                <Brain size={18} />
              </div>
              <p className="text-xs text-gray-600 leading-relaxed font-medium">
                {getAIAdvice()}
              </p>
            </div>
          </div>
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 text-[10px] text-gray-400 font-semibold leading-relaxed">
            💡 <strong>Pro Tip:</strong> Block out social media notifications from 09:00 to 11:30. This slot correlates with your highest cognitive efficiency logs.
          </div>
        </div>

      </div>

    </div>
  );
}
