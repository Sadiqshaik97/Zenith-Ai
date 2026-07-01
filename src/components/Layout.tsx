import { useState } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import TopBar from './TopBar';
import { useStore } from '../store/useStore';
import { AlertCircle } from 'lucide-react';

export default function Layout() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isDemoMode = useStore((state) => state.isDemoMode);

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#eef0f2] relative">
      {/* Sidebar Navigation */}
      <Sidebar 
        collapsed={collapsed} 
        setCollapsed={setCollapsed} 
        mobileOpen={mobileOpen} 
        setMobileOpen={setMobileOpen} 
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Top Header */}
        <TopBar onToggleMenu={() => setMobileOpen(!mobileOpen)} />

        {isDemoMode && (
          <div className="bg-[#fff9db] border-b border-[#ffe066] text-[#856404] px-4 py-2 text-xs flex items-center justify-between gap-2 z-30">
            <div className="flex items-center gap-2">
              <AlertCircle size={14} className="text-[#e2b709] shrink-0" />
              <span>
                <strong>Demo Mode Active:</strong> Backend server is offline. Changes will be saved locally in this browser.
              </span>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-2 py-0.5 bg-[#fef08a] hover:bg-[#fde047] text-[#713f12] rounded font-bold cursor-pointer transition-colors"
            >
              Retry Connection
            </button>
          </div>
        )}

        {/* Dynamic Route Pages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 relative">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
