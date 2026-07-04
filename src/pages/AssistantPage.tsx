import { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  Send, 
  Mic, 
  MicOff, 
  Bot, 
  User, 
  Sparkles, 
  Trash2,
  Settings,
  X
} from 'lucide-react';

export default function AssistantPage() {
  const [chatInput, setChatInput] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  
  const messages = useStore((state) => state.messages);
  const sendMessage = useStore((state) => state.sendMessage);
  const clearChat = useStore((state) => state.clearChat);
  const user = useStore((state) => state.user);
  const userName = user?.name ? user.name.split(' ')[0] : 'there';
  const isGenerating = useStore((state) => state.isGenerating);
  const stopGenerating = useStore((state) => state.stopGenerating);

  const isDemoMode = useStore((state) => state.isDemoMode);
  const geminiApiKey = useStore((state) => state.geminiApiKey);
  const setGeminiApiKey = useStore((state) => state.setGeminiApiKey);

  const [showKeyModal, setShowKeyModal] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(geminiApiKey || localStorage.getItem('zenith_gemini_api_key') || '');

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom of chat
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Web Speech API
  useEffect(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = false;
      rec.lang = 'en-US';

      rec.onstart = () => setIsListening(true);
      rec.onend = () => setIsListening(false);
      rec.onerror = () => setIsListening(false);
      
      rec.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setChatInput(transcript);
        setIsListening(false);
        if (transcript.trim()) {
          sendMessage(transcript);
          setChatInput('');
        }
      };

      setRecognition(rec);
    }
  }, [sendMessage]);

  const toggleMic = () => {
    if (!recognition) {
      alert("Voice dictation is not supported in this browser. Please try Chrome.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    sendMessage(chatInput);
    setChatInput('');
  };

  const executeCommand = (cmdText: string) => {
    sendMessage(cmdText);
  };

  const commandChips = [
    { text: "⚡ Plan my week", cmd: "Plan my week" },
    { text: "🎯 Prioritize my tasks", cmd: "Prioritize my tasks" },
    { text: " Decompose project tasks", cmd: "Break down my tasks" },
    { text: "⏳ Check deadlines", cmd: "List overdue items" }
  ];

  return (
    <div className="h-full flex flex-col justify-between bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden text-gray-800">
      {/* 1. Terminal Header */}
      <div className="bg-[#161719] px-6 py-4 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-2.5">
          <div className="bg-[#D2FC54] text-[#161719] p-1.5 rounded-xl flex items-center justify-center">
            <Bot size={18} className="fill-[#161719]" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white leading-none">Aura AI Assistant</h2>
            <p className="text-[9px] text-[#D2FC54] font-medium tracking-wide uppercase mt-0.5">
              {isDemoMode ? "Online (Direct API Fallback)" : "Online • Contextual Engine Active"}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setShowKeyModal(true)}
            className="text-gray-400 hover:text-[#D2FC54] p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            title="Configure Gemini API Key"
          >
            <Settings size={16} />
          </button>
          <button 
            onClick={clearChat}
            className="text-gray-400 hover:text-red-500 p-2 rounded-xl hover:bg-white/5 transition-colors cursor-pointer"
            title="Clear Terminal logs"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>



      {/* 2. Chat Messages Body */}
      <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-5 bg-gray-50/50">
        {isDemoMode && !apiKeyInput && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-800 animate-in fade-in duration-200">
            <div className="flex items-center gap-3">
              <span className="text-xl">⚠️</span>
              <div className="text-xs">
                <p className="font-extrabold text-amber-950">Gemini API Key Required (Static Mode)</p>
                <p className="font-medium text-amber-900/80 mt-0.5">
                  The backend server is offline. Please click "Configure API Key" to provide your key and enable full AI daily planning directly from your browser.
                </p>
              </div>
            </div>
            <button
              onClick={() => setShowKeyModal(true)}
              className="bg-amber-500 hover:bg-amber-600 text-white text-[10px] font-extrabold uppercase px-3 py-1.5 rounded-xl transition-all cursor-pointer shadow-sm shadow-amber-500/10 shrink-0"
            >
              Configure API Key
            </button>
          </div>
        )}


        {messages.length === 0 ? (
          <div className="flex-grow flex flex-col items-center justify-center text-center p-8 max-w-2xl mx-auto my-auto animate-in fade-in duration-500 gap-8">
            <div>
              <div className="relative mb-4 flex justify-center">
                <div className="absolute w-20 h-20 bg-gradient-to-tr from-[#A78BFA] via-[#D2FC54] to-[#f43f5e] rounded-full blur-xl opacity-20 animate-pulse"></div>
                <div className="relative bg-[#161719] text-[#D2FC54] p-4 flex items-center justify-center border border-gray-800 shadow-xl rounded-2xl">
                  <Sparkles size={24} className="text-[#D2FC54]" />
                </div>
              </div>
              <h2 className="text-2xl md:text-3xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-purple-700 to-gray-900 leading-none">
                Hello, {userName}
              </h2>
              <p className="text-[10px] text-purple-600 font-extrabold tracking-wider uppercase mt-1.5">
                Personal Coach & Grounded AI Engine
              </p>
            </div>

            {/* AI Skills Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full text-left">
              <div className="bg-white/80 border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-[#D2FC54] transition-all">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">🌐</span>
                  <h4 className="text-[10px] font-extrabold text-gray-900 uppercase tracking-wider">Google Search Grounding</h4>
                </div>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  Queries live web resources natively to answer questions with real-time accuracy and facts.
                </p>
              </div>

              <div className="bg-white/80 border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-[#D2FC54] transition-all">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">📅</span>
                  <h4 className="text-[10px] font-extrabold text-gray-900 uppercase tracking-wider">Circadian Task Scheduling</h4>
                </div>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  Resolves overlaps and distributes tasks dynamically across optimal energy time blocks.
                </p>
              </div>

              <div className="bg-white/80 border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-[#D2FC54] transition-all">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">🚨</span>
                  <h4 className="text-[10px] font-extrabold text-gray-900 uppercase tracking-wider">Urgency Heuristics</h4>
                </div>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  Calculates Eisenhower priority matrices and auto-tags categories from natural commands.
                </p>
              </div>

              <div className="bg-white/80 border border-gray-100 p-4 rounded-2xl shadow-sm hover:border-[#D2FC54] transition-all">
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="text-sm">🎙️</span>
                  <h4 className="text-[10px] font-extrabold text-gray-900 uppercase tracking-wider">Hands-free Dictation</h4>
                </div>
                <p className="text-[10px] text-gray-400 font-medium leading-relaxed">
                  Provides speech-to-text dictation with active listening bars and instant cancellation overlays.
                </p>
              </div>
            </div>
          </div>
        ) : (
          messages.map((m) => {
            const isAI = m.sender === 'ai';
            const isThinking = m.text === 'Aura is formulating a response...';
            return (
              <div 
                key={m.id}
                className={`flex gap-3 max-w-[85%] items-start ${
                  isAI ? 'self-start' : 'self-end flex-row-reverse'
                }`}
              >
                {/* Avatar Icon */}
                <div className={`w-8.5 h-8.5 rounded-xl flex items-center justify-center flex-shrink-0 border ${
                  isAI 
                    ? 'bg-[#161719] border-gray-800 text-[#D2FC54]' 
                    : 'bg-[#D2FC54] border-[#D2FC54] text-[#161719]'
                }`}>
                  {isAI ? <Bot size={15} /> : <User size={15} />}
                </div>

                {/* Message Bubble */}
                <div className={`flex flex-col gap-1`}>
                  <div className={`p-4 rounded-2xl text-xs leading-relaxed shadow-sm border ${
                    isAI 
                      ? 'bg-white text-gray-900 border-gray-100 rounded-tl-sm' 
                      : 'bg-[#161719] text-white border-gray-800 rounded-tr-sm'
                  }`}>
                    {/* Render message formatting for list returns */}
                    {isThinking ? (
                      <div className="flex flex-col gap-2.5 w-48 py-1">
                        <div className="h-3 bg-gradient-to-r from-gray-200 via-[#A78BFA]/10 to-gray-200 rounded-lg animate-pulse w-full"></div>
                        <div className="h-3 bg-gradient-to-r from-gray-200 via-[#D2FC54]/10 to-gray-200 rounded-lg animate-pulse w-11/12"></div>
                        <div className="h-3 bg-gradient-to-r from-gray-200 via-[#A78BFA]/10 to-gray-200 rounded-lg animate-pulse w-4/6"></div>
                      </div>
                    ) : (
                      <div className="whitespace-pre-line font-medium">{m.text}</div>
                    )}
                  </div>
                  <span className={`text-[9px] text-gray-400 font-bold px-1.5 mt-0.5 ${
                    isAI ? 'text-left' : 'text-right'
                  }`}>
                    {m.timestamp}
                  </span>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* 3. Input Console Area */}
      <div className="p-4 bg-white border-t border-gray-100 flex flex-col gap-3">
        {/* Quick Action Chips */}
        <div className="flex gap-2 flex-wrap">
          {commandChips.map((chip) => (
            <button
              key={chip.cmd}
              onClick={() => executeCommand(chip.cmd)}
              className="bg-gray-100 hover:bg-[#D2FC54] hover:text-[#161719] text-gray-700 text-[10px] font-bold px-3 py-1.5 rounded-full transition-all border border-gray-200/50 cursor-pointer shadow-sm"
            >
              {chip.text}
            </button>
          ))}
        </div>

        {/* Voice Dictation Active Overlay */}
        {isListening && (
          <div className="bg-red-50 border border-red-100 rounded-2xl p-3 flex items-center justify-between animate-pulse">
            <div className="flex items-center gap-3">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <span className="text-xs font-bold text-red-950">Aura Voice Dictation Listening...</span>
            </div>
            <button
              type="button"
              onClick={() => {
                if (recognition) recognition.stop();
                setIsListening(false);
              }}
              className="text-red-600 hover:text-red-800 flex items-center gap-1.5 text-[10px] font-extrabold uppercase bg-red-100/50 hover:bg-red-100 px-3 py-1.5 rounded-xl transition-all cursor-pointer border border-red-200/20"
            >
              <X size={12} className="stroke-[3px]" />
              Cancel Voice
            </button>
          </div>
        )}

        {/* Input Bar */}
        <form onSubmit={handleSend} className="flex gap-3">
          <div className="relative flex-1">
            <input 
              type="text"
              placeholder="Ask Aura to schedule, organize, or query task reports..."
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              className="w-full bg-gray-50 border border-gray-200/80 rounded-2xl py-3 pl-4 pr-11 text-xs text-gray-900 placeholder-gray-400 focus:outline-none focus:border-[#D2FC54] focus:ring-1 focus:ring-[#D2FC54] transition-all"
            />
            <button 
              type="button"
              onClick={toggleMic}
              className={`absolute right-3.5 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors cursor-pointer ${
                isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:text-gray-900'
              }`}
              title="Dictate message"
            >
              {isListening ? <Mic size={14} /> : <MicOff size={14} />}
            </button>
          </div>
          {isGenerating ? (
            <button 
              type="button"
              onClick={stopGenerating}
              className="bg-red-500 hover:bg-red-600 text-white p-3 rounded-2xl transition-all shadow-md cursor-pointer flex items-center justify-center flex-shrink-0"
              title="Stop generating"
            >
              <div className="w-3 h-3 bg-white rounded-sm animate-pulse" />
            </button>
          ) : (
            <button 
              type="submit"
              className="bg-[#161719] hover:bg-black text-[#D2FC54] hover:scale-102 p-3 rounded-2xl transition-all shadow-md shadow-black/10 cursor-pointer flex items-center justify-center flex-shrink-0"
            >
              <Send size={16} />
            </button>
          )}
        </form>
      </div>

      {/* 4. API Key Config Modal */}
      {showKeyModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-gray-100 flex flex-col gap-4 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center">
              <h3 className="text-base font-bold text-[#161719] flex items-center gap-2">
                <Sparkles size={18} className="text-[#D2FC54] fill-[#D2FC54]" />
                Gemini API Key Configuration
              </h3>
              <button 
                onClick={() => {
                  setShowKeyModal(false);
                  setApiKeyInput(geminiApiKey || localStorage.getItem('zenith_gemini_api_key') || '');
                }}
                className="text-gray-400 hover:text-gray-600 p-1.5 rounded-full hover:bg-gray-100 transition-colors cursor-pointer"
              >
                <X size={16} />
              </button>
            </div>
            
            <p className="text-xs text-gray-500 leading-relaxed">
              Zenith AI runs in **Demo Mode (offline)** when deployed on static hosting. To enable real AI assistance (adding tasks, scheduling plans, and completing goals via chat), please input your Gemini API Key below.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-extrabold text-gray-500 uppercase tracking-wider">
                Gemini API Key
              </label>
              <input 
                type="password"
                placeholder="Enter AI API Key (AI.zaSy...)"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-xs text-gray-900 focus:outline-none focus:border-[#D2FC54] focus:ring-1 focus:ring-[#D2FC54] transition-all"
              />
            </div>

            <div className="bg-blue-50 border border-blue-100 rounded-2xl p-3 flex items-start gap-2.5 text-blue-800 text-[11px] leading-relaxed">
              <span className="text-base shrink-0 mt-0.5">ℹ️</span>
              <p className="font-medium text-blue-900/80">
                Your API key is saved directly inside your browser's local storage and is never sent to any external server other than Google's secure Gemini API endpoint.
              </p>
            </div>

            <div className="flex justify-end gap-2.5 mt-2">
              <button 
                type="button"
                onClick={() => {
                  setShowKeyModal(false);
                  setApiKeyInput(geminiApiKey || localStorage.getItem('zenith_gemini_api_key') || '');
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold text-gray-500 hover:bg-gray-100 transition-all cursor-pointer"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => {
                  setGeminiApiKey(apiKeyInput);
                  localStorage.setItem('zenith_gemini_api_key', apiKeyInput);
                  setShowKeyModal(false);
                }}
                className="bg-[#161719] hover:bg-black text-[#D2FC54] px-4 py-2 rounded-xl text-xs font-bold transition-all hover:scale-102 cursor-pointer shadow-md shadow-black/10"
              >
                Save Configuration
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
