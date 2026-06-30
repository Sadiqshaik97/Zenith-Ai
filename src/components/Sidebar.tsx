import { NavLink } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CheckSquare, 
  Calendar, 
  MessageSquare, 
  Trophy, 
  BarChart2, 
  Inbox, 
  Sparkles, 
  ChevronLeft, 
  ChevronRight
} from 'lucide-react';
import { useStore } from '../store/useStore';

interface SidebarProps {
  collapsed: boolean;
  setCollapsed: (val: boolean) => void;
  mobileOpen: boolean;
  setMobileOpen: (val: boolean) => void;
}

export default function Sidebar({ collapsed, setCollapsed, mobileOpen, setMobileOpen }: SidebarProps) {
  const tasks = useStore((state) => state.tasks);
  const incompleteCount = tasks.filter((t) => t.status !== 'Done').length;

  const menuItems = [
    { to: '/', label: 'Dashboard', icon: LayoutDashboard, badge: incompleteCount > 0 ? incompleteCount : undefined },
    { to: '/tasks', label: 'Tasks', icon: CheckSquare },
    { to: '/calendar', label: 'Calendar', icon: Calendar },
    { to: '/assistant', label: 'AI Assistant', icon: MessageSquare, highlight: true },
    { to: '/goals', label: 'Goals', icon: Trophy },
    { to: '/insights', label: 'Insights', icon: BarChart2 },
    { to: '/inbox', label: 'Inbox Capture', icon: Inbox }
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
        ></div>
      )}

      <div 
        className={`h-screen bg-[#161719] text-gray-400 flex flex-col justify-between transition-all duration-300 fixed md:relative left-0 top-0 z-40 border-r border-[#232427] ${
          collapsed ? 'w-20' : 'w-64'
        } ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Collapse Trigger Button (Hidden on Mobile) */}
        <button 
          onClick={() => setCollapsed(!collapsed)}
          className="absolute top-6 -right-3.5 bg-[#D2FC54] hover:bg-[#c0ec3d] text-[#161719] rounded-full p-1 border-2 border-[#161719] transition-colors shadow-md cursor-pointer hidden md:block"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

      <div>
        {/* Logo Section */}
        <div className={`p-6 flex items-center gap-3 border-b border-[#232427] ${collapsed ? 'justify-center' : ''}`}>
          <div className="bg-[#D2FC54] text-[#161719] p-2 rounded-xl flex items-center justify-center shadow-lg shadow-[#d2fc54]/10">
            <Sparkles size={20} className="fill-[#161719]" />
          </div>
          {!collapsed && (
            <div className="flex flex-col">
              <span className="font-bold text-white text-lg tracking-tight leading-none">zenith</span>
              <span className="text-[10px] text-[#D2FC54] font-medium uppercase tracking-wider mt-0.5">AI assistant</span>
            </div>
          )}
        </div>

        {/* Menu Navigation */}
        <nav className="p-4 flex flex-col gap-1.5">
          {menuItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => 
                `flex items-center gap-3.5 px-4 py-3 rounded-xl font-medium text-sm transition-all duration-200 cursor-pointer ${
                  isActive 
                    ? 'bg-white text-[#161719] shadow-md shadow-white/5' 
                    : item.highlight 
                      ? 'text-[#D2FC54] hover:bg-white/5 hover:text-white' 
                      : 'hover:bg-white/5 hover:text-white'
                }`
              }
            >
              <item.icon size={20} className="flex-shrink-0" />
              {!collapsed && (
                <span className="flex-1 text-left truncate">{item.label}</span>
              )}
              {!collapsed && item.badge !== undefined && (
                <span className="bg-[#D2FC54] text-[#161719] text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {item.badge}
                </span>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
      </div>
    </>
  );
}
