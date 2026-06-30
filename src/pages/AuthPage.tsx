import { useState } from 'react';
import { useStore } from '../store/useStore';
import { Sparkles, Mail, Lock, User, ArrowRight, Eye, EyeOff } from 'lucide-react';

export default function AuthPage() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const login = useStore((state) => state.login);
  const signUp = useStore((state) => state.signUp);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email.trim() || !password.trim()) {
      setError('Please fill in all credentials fields.');
      return;
    }

    if (isSignUp && !name.trim()) {
      setError('Please enter your name.');
      return;
    }

    if (password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    try {
      if (isSignUp) {
        await signUp(name.trim(), email.trim(), password.trim());
      } else {
        await login(email.trim(), password.trim());
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to authenticate. Please check your credentials.');
    }
  };

  return (
    <div className="min-h-screen w-screen bg-[#eef0f2] flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background blobs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D2FC54]/10 rounded-full blur-3xl"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-[#A78BFA]/10 rounded-full blur-3xl"></div>

      {/* Main card */}
      <div className="bg-white max-w-4xl w-full rounded-[40px] shadow-2xl border border-white/50 overflow-hidden flex flex-col md:flex-row relative z-10 min-h-[560px]">
        
        {/* Left Side: Branding / Intro */}
        <div className="md:w-5/12 bg-[#161719] text-white p-10 flex flex-col justify-between relative overflow-hidden">
          <div className="absolute right-0 top-0 w-48 h-48 bg-[#D2FC54]/5 rounded-full blur-2xl"></div>
          
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-[#D2FC54] text-[#161719] p-2.5 rounded-2xl flex items-center justify-center shadow-lg shadow-[#d2fc54]/10">
              <Sparkles size={20} className="fill-[#161719]" />
            </div>
            <div className="flex flex-col">
              <span className="font-extrabold text-white text-xl tracking-tight leading-none">zenith</span>
              <span className="text-[9px] text-[#D2FC54] font-bold uppercase tracking-widest mt-0.5">AI assistant</span>
            </div>
          </div>

          {/* Marketing pitch */}
          <div className="my-8">
            <h2 className="text-2xl font-black text-white leading-tight">
              Circadian Planning & Real-time Tracking.
            </h2>
            <p className="text-xs text-gray-400 mt-4 leading-relaxed font-medium">
              Zenith AI resolves calendar overlaps, monitors cognitive energy peaks, and tracks habit consistency in real-time. Join our workspace to unlock predictive focus blocks.
            </p>
          </div>

          {/* Footer stats */}
          <div className="flex gap-6 border-t border-gray-800 pt-6">
            <div>
              <span className="text-xl font-bold text-white block">98%</span>
              <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wide">Focus rate</span>
            </div>
            <div>
              <span className="text-xl font-bold text-[#D2FC54] block">2.4x</span>
              <span className="text-[9px] text-gray-500 font-extrabold uppercase tracking-wide">Output rate</span>
            </div>
          </div>
        </div>

        {/* Right Side: Auth Forms */}
        <div className="flex-1 p-10 flex flex-col justify-center">
          <div className="max-w-md w-full mx-auto flex flex-col gap-6">
            
            {/* Header */}
            <div>
              <h1 className="text-2xl font-black text-gray-900 tracking-tight">
                {isSignUp ? 'Establish Your Account' : 'Welcome to Zenith AI'}
              </h1>
              <p className="text-xs text-gray-400 mt-1.5 font-medium">
                {isSignUp ? 'Join the peak performance network' : 'Continue tracking your cognitive rhythms'}
              </p>
            </div>

            {/* Tab switch */}
            <div className="flex border-b border-gray-100 pb-1 gap-4">
              <button 
                type="button"
                onClick={() => { setIsSignUp(false); setError(''); }}
                className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${!isSignUp ? 'border-[#7c3aed] text-gray-900' : 'border-transparent text-gray-400'}`}
              >
                Sign In
              </button>
              <button 
                type="button"
                onClick={() => { setIsSignUp(true); setError(''); }}
                className={`pb-2 text-xs font-black uppercase tracking-wider border-b-2 transition-all cursor-pointer ${isSignUp ? 'border-[#7c3aed] text-gray-900' : 'border-transparent text-gray-400'}`}
              >
                Sign Up
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <p className="text-[11px] text-red-500 font-bold bg-red-50 border border-red-100 rounded-xl p-3 leading-snug">
                {error}
              </p>
            )}

            {/* Input Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              
              {isSignUp && (
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                  <input 
                    type="text"
                    placeholder="Full Name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-11 pr-4 text-xs placeholder-gray-400 focus:outline-none focus:border-[#D2FC54] transition-all"
                    required
                  />
                </div>
              )}

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-11 pr-4 text-xs placeholder-gray-400 focus:outline-none focus:border-[#D2FC54] transition-all"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                <input 
                  type={showPassword ? "text" : "password"}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-3 pl-11 pr-12 text-xs placeholder-gray-400 focus:outline-none focus:border-[#D2FC54] transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-900 focus:outline-none cursor-pointer"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>

              {/* Submit Button */}
              <button 
                type="submit"
                className="w-full bg-[#161719] hover:bg-black text-[#D2FC54] py-3 rounded-2xl text-xs font-bold transition-all shadow-md shadow-black/10 cursor-pointer flex items-center justify-center gap-2 mt-2"
              >
                {isSignUp ? 'Create Workspace' : 'Enter Zenith AI'}
                <ArrowRight size={14} />
              </button>
            </form>

          </div>
        </div>

      </div>
    </div>
  );
}
