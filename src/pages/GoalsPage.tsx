import { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Trophy, 
  Flame, 
  Plus, 
  Award, 
  TrendingUp, 
  Target,
  Trash2,
  Check
} from 'lucide-react';

export default function GoalsPage() {
  const [showAddGoalForm, setShowAddGoalForm] = useState(false);
  const [newGoalTitle, setNewGoalTitle] = useState('');
  const [newGoalCategory, setNewGoalCategory] = useState('Study');
  const [newGoalTargetDate, setNewGoalTargetDate] = useState('2026-07-31');

  const goals = useStore((state) => state.goals);
  const habits = useStore((state) => state.habits);
  
  const addGoal = useStore((state) => state.addGoal);
  const deleteGoal = useStore((state) => state.deleteGoal);
  const addHabit = useStore((state) => state.addHabit);
  const deleteHabit = useStore((state) => state.deleteHabit);
  const toggleHabit = useStore((state) => state.toggleHabit);

  const handleCreateHabit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const habitName = formData.get('habitName') as string;
    if (!habitName || !habitName.trim()) return;

    addHabit(habitName.trim());
    e.currentTarget.reset();
  };

  const handleCreateGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGoalTitle.trim()) return;

    addGoal({
      title: newGoalTitle,
      targetDate: newGoalTargetDate,
      progress: 0,
      category: newGoalCategory
    });

    setNewGoalTitle('');
    setShowAddGoalForm(false);
  };

  return (
    <div className="flex flex-col gap-8 text-gray-800">
      
      {/* 1. Goals Grid */}
      <div className="flex flex-col gap-4 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <Trophy size={20} className="text-gray-900" />
            <h2 className="text-base font-extrabold text-gray-900">Milestones & Targets</h2>
          </div>
          <button 
            onClick={() => setShowAddGoalForm(!showAddGoalForm)}
            className="bg-[#161719] hover:bg-black text-[#D2FC54] text-xs font-bold px-4 py-2.5 rounded-xl transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Plus size={15} />
            Set Goal
          </button>
        </div>

        {/* Goal Add Form */}
        {showAddGoalForm && (
          <form onSubmit={handleCreateGoal} className="p-4 bg-gray-50 border border-gray-200 rounded-2xl flex flex-col gap-4 animate-in slide-in-from-top-2 duration-200">
            <h4 className="text-xs font-bold text-gray-900">Define Milestone Goal</h4>
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[9px] text-gray-400 font-bold uppercase">Goal Name</label>
                <input 
                  type="text" 
                  placeholder="e.g. Complete CS Thesis review..."
                  value={newGoalTitle}
                  onChange={(e) => setNewGoalTitle(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                  required
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] text-gray-400 font-bold uppercase">Category</label>
                <select 
                  value={newGoalCategory}
                  onChange={(e) => setNewGoalCategory(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                >
                  <option value="Study">Study</option>
                  <option value="Work">Work</option>
                  <option value="Health">Health</option>
                  <option value="Finance">Finance</option>
                </select>
              </div>
              <div className="flex flex-col gap-1 col-span-2">
                <label className="text-[9px] text-gray-400 font-bold uppercase">Target Deadline</label>
                <input 
                  type="date" 
                  value={newGoalTargetDate}
                  onChange={(e) => setNewGoalTargetDate(e.target.value)}
                  className="bg-white border border-gray-200 rounded-xl px-3 py-2 text-xs focus:outline-none"
                />
              </div>
              <div className="flex gap-2 items-end justify-end">
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-[#D2FC54] text-[#161719] rounded-xl text-xs font-bold hover:bg-[#c0ec3d] cursor-pointer shadow-md"
                >
                  Save Goal
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Goals Progress Ring Row */}
        {goals.length === 0 ? (
          <div className="py-12 text-center text-gray-500 text-xs border border-dashed border-gray-200 rounded-2xl bg-gray-50/40 flex flex-col items-center justify-center p-6 mt-2">
            <Target size={24} className="text-gray-300 mb-2" />
            <span className="font-bold text-gray-700">No active milestones</span>
            <span className="text-[10px] text-gray-400 mt-1 max-w-[280px]">Define target milestones and monitor your semester/sprint accomplishments.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-2">
            {goals.map((g) => {
              // Circle calculations
              const r = 40;
              const circ = 2 * Math.PI * r;
              const offset = circ - (circ * g.progress) / 100;
              
              return (
                <div 
                  key={g.id} 
                  className="bg-gray-50/50 rounded-2xl border border-gray-100 p-5 flex items-center justify-between hover:border-gray-200 transition-all group"
                >
                  <div className="flex flex-col justify-between h-24 max-w-[140px]">
                    <div>
                      <span className="text-[9px] text-gray-400 font-bold uppercase tracking-wider">{g.category} Target</span>
                      <h4 className="text-xs font-bold text-gray-900 mt-1 line-clamp-2">{g.title}</h4>
                    </div>
                    <div className="flex items-center gap-2 text-[10px] text-gray-400 font-semibold mt-2">
                      <Target size={12} />
                      <span>Target: {g.targetDate}</span>
                    </div>
                  </div>

                  {/* SVG Progress Circle */}
                  <div className="relative w-20 h-20 flex-shrink-0 flex items-center justify-center">
                    <svg className="w-20 h-20 transform -rotate-90">
                      <circle className="stroke-gray-200 fill-none" strokeWidth="6" cx="40" cy="40" r={r} />
                      <circle 
                        className="stroke-[#A78BFA] fill-none transition-all duration-700" 
                        strokeWidth="6" 
                        strokeLinecap="round"
                        strokeDasharray={circ} 
                        strokeDashoffset={offset} 
                        cx="40" 
                        cy="40" 
                        r={r} 
                      />
                    </svg>
                    <div className="absolute text-[11px] font-extrabold text-gray-900">{g.progress}%</div>
                    <button 
                      onClick={() => deleteGoal(g.id)}
                      className="absolute -top-1 -right-1 bg-white border border-gray-200 text-gray-400 hover:text-red-500 rounded-lg p-1 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                    >
                      <Trash2 size={10} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
