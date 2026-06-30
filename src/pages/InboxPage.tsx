import { useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  Inbox, 
  Plus, 
  Trash2, 
  Mic, 
  Save 
} from 'lucide-react';

export default function InboxPage() {
  const [memoText, setMemoText] = useState('');
  const [memos, setMemos] = useState<{ id: string; text: string; date: string }[]>(() => {
    const stored = localStorage.getItem('aura_memos');
    return stored ? JSON.parse(stored) : [
      { id: 'm1', text: 'Brainstorm layout themes for the upcoming OS project presentation.', date: new Date().toLocaleDateString() },
      { id: 'm2', text: 'Quick reminder: check out Semaphores lectures video before Friday.', date: new Date().toLocaleDateString() }
    ];
  });

  const addTask = useStore((state) => state.addTask);

  const saveMemo = () => {
    if (!memoText.trim()) return;
    const newMemo = {
      id: 'memo_' + Date.now(),
      text: memoText,
      date: new Date().toLocaleDateString()
    };
    const updated = [newMemo, ...memos];
    setMemos(updated);
    localStorage.setItem('aura_memos', JSON.stringify(updated));
    setMemoText('');
  };

  const deleteMemo = (id: string) => {
    const updated = memos.filter((m) => m.id !== id);
    setMemos(updated);
    localStorage.setItem('aura_memos', JSON.stringify(updated));
  };

  const convertToTask = (memo: { id: string; text: string }) => {
    // Quick add task from memo
    addTask({
      title: memo.text.slice(0, 50) + (memo.text.length > 50 ? '...' : ''),
      description: memo.text,
      deadline: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow
      time: '12:00',
      priority: 'Medium',
      status: 'Todo',
      effort: 2,
      tags: ['InboxConverted'],
      subtasks: []
    });
    deleteMemo(memo.id);
    alert('Inbox note successfully converted to active task!');
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 text-gray-800 h-full overflow-y-auto lg:overflow-hidden max-w-7xl mx-auto w-full">
      
      {/* 1. Quick Capture Memo Pad */}
      <div className="flex-1 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col justify-between h-auto lg:h-full min-h-[300px]">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4">
          <div className="flex items-center gap-2">
            <Inbox size={20} className="text-gray-900" />
            <h2 className="text-base font-extrabold text-gray-900">Inbox Memo Capture</h2>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 my-5 relative">
          <textarea
            value={memoText}
            onChange={(e) => setMemoText(e.target.value)}
            placeholder="Jot down quick reminders, tasks, project thoughts, or meeting logs. Save to capture pile, or convert straight to tasks..."
            className="w-full h-full bg-gray-50 border border-gray-200/80 rounded-2xl p-5 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#D2FC54] focus:ring-1 focus:ring-[#D2FC54] transition-all resize-none leading-relaxed"
          />
          <button 
            onClick={() => useStore.getState().sendMessage("activate audio logging")}
            className="absolute right-4 bottom-4 bg-[#161719] hover:bg-black text-[#D2FC54] p-3 rounded-full shadow-lg shadow-black/10 cursor-pointer"
            title="Audio Log Dictation"
          >
            <Mic size={18} />
          </button>
        </div>

        <div className="flex justify-end gap-3">
          <button 
            onClick={saveMemo}
            className="bg-[#161719] hover:bg-black text-[#D2FC54] text-xs font-bold px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md shadow-black/5 flex items-center gap-1.5"
          >
            <Save size={14} />
            Save Note
          </button>
        </div>
      </div>

      {/* 2. Inbox capture pile (Saved Memos) */}
      <div className="w-full lg:w-96 bg-white rounded-3xl p-6 border border-gray-100 shadow-sm flex flex-col h-auto lg:h-full overflow-visible lg:overflow-hidden pb-6 lg:pb-0 flex-shrink-0">
        <div className="flex justify-between items-center border-b border-gray-100 pb-4 mb-4">
          <h3 className="text-xs font-extrabold uppercase tracking-wider text-gray-900">Capture Pile</h3>
          <span className="bg-gray-100 text-gray-600 text-[10px] font-bold px-2 py-0.5 rounded-full">{memos.length}</span>
        </div>

        <div className="flex-1 overflow-y-auto flex flex-col gap-3 pr-1">
          {memos.length === 0 ? (
            <p className="text-[11px] text-gray-400 text-center py-8">Inbox pile is empty. Write notes to capture thoughts.</p>
          ) : (
            memos.map((m) => (
              <div key={m.id} className="p-4 bg-gray-50/50 hover:bg-gray-50 border border-gray-100 rounded-2xl flex flex-col justify-between min-h-[120px] transition-colors relative group">
                <p className="text-[11px] text-gray-800 leading-relaxed line-clamp-3 font-medium pr-4">{m.text}</p>
                
                <div className="flex justify-between items-center mt-4 pt-2 border-t border-gray-200/40 text-[9px] text-gray-400 font-bold uppercase">
                  <span>{m.date}</span>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => convertToTask(m)}
                      className="text-[#A78BFA] hover:text-[#8b5cf6] font-bold flex items-center gap-1 cursor-pointer"
                    >
                      <Plus size={12} /> Convert to Task
                    </button>
                    <button 
                      onClick={() => deleteMemo(m.id)}
                      className="text-gray-400 hover:text-red-500 cursor-pointer p-0.5"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
