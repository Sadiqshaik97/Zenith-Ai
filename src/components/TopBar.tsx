import { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Mic, MicOff, Bell, ChevronDown, User, Sparkles, X, Menu, Mail, Image } from 'lucide-react';
import { useStore } from '../store/useStore';

interface TopBarProps {
  onToggleMenu?: () => void;
}

export default function TopBar({ onToggleMenu }: TopBarProps) {
  const [searchValue, setSearchValue] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [recognition, setRecognition] = useState<any>(null);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [dismissedTaskIds, setDismissedTaskIds] = useState<string[]>([]);
  
  const location = useLocation();
  const navigate = useNavigate();
  const tasks = useStore((state) => state.tasks);
  const sendMessage = useStore((state) => state.sendMessage);
  
  // Auth state & actions
  const user = useStore((state) => state.user);
  const updateProfile = useStore((state) => state.updateProfile);

  // Edit Profile Form States
  const [editName, setEditName] = useState(user?.name || '');
  const [editEmail, setEditEmail] = useState(user?.email || '');
  const [editAvatarUrl, setEditAvatarUrl] = useState(user?.avatarUrl || '');

  // Image cropping and uploading states
  const [tempImageSrc, setTempImageSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const aspectRatio = naturalSize.width > 0 && naturalSize.height > 0 ? naturalSize.width / naturalSize.height : 1;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImageSrc(reader.result as string);
        setZoom(1);
        setOffset({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setNaturalSize({ width: img.naturalWidth, height: img.naturalHeight });
  };

  const constrainOffset = (x: number, y: number, currentZoom: number) => {
    if (naturalSize.width === 0 || naturalSize.height === 0) return { x, y };

    const containerSize = 288;
    const maskSize = 160;
    const maskOffset = (containerSize - maskSize) / 2; // 64

    let baseWidth = containerSize;
    let baseHeight = containerSize;
    const aspect = naturalSize.width / naturalSize.height;
    if (aspect > 1) {
      baseHeight = containerSize;
      baseWidth = containerSize * aspect;
    } else {
      baseWidth = containerSize;
      baseHeight = containerSize / aspect;
    }

    const scaledWidth = baseWidth * currentZoom;
    const scaledHeight = baseHeight * currentZoom;

    const initX = (containerSize - scaledWidth) / 2;
    const initY = (containerSize - scaledHeight) / 2;

    const minX = maskOffset + maskSize - initX - scaledWidth;
    const maxX = maskOffset - initX;

    const minY = maskOffset + maskSize - initY - scaledHeight;
    const maxY = maskOffset - initY;

    return {
      x: Math.min(maxX, Math.max(minX, x)),
      y: Math.min(maxY, Math.max(minY, y))
    };
  };

  const handleZoomChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const nextZoom = parseFloat(e.target.value);
    setZoom(nextZoom);
    setOffset(prev => constrainOffset(prev.x, prev.y, nextZoom));
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    setDragStart({ x: e.clientX - offset.x, y: e.clientY - offset.y });
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const newX = e.clientX - dragStart.x;
    const newY = e.clientY - dragStart.y;
    setOffset(constrainOffset(newX, newY, zoom));
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handlePointerLeave = () => {
    setIsDragging(false);
  };

  const handleApplyCrop = () => {
    if (!imageRef.current) return;
    const img = imageRef.current;
    
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, 256, 256);

    const containerSize = 288;
    const maskSize = 160;
    const maskOffset = (containerSize - maskSize) / 2;

    let baseWidth = containerSize;
    let baseHeight = containerSize;
    const aspect = naturalSize.width / naturalSize.height;
    if (aspect > 1) {
      baseHeight = containerSize;
      baseWidth = containerSize * aspect;
    } else {
      baseWidth = containerSize;
      baseHeight = containerSize / aspect;
    }

    const scaledWidth = baseWidth * zoom;
    const scaledHeight = baseHeight * zoom;

    const initX = (containerSize - scaledWidth) / 2;
    const initY = (containerSize - scaledHeight) / 2;

    const imgLeft = initX + offset.x;
    const imgTop = initY + offset.y;

    const relX = imgLeft - maskOffset;
    const relY = imgTop - maskOffset;

    const screenToNaturalScale = naturalSize.width / baseWidth;

    const sx = (-relX / zoom) * screenToNaturalScale;
    const sy = (-relY / zoom) * screenToNaturalScale;
    const sWidth = (maskSize / zoom) * screenToNaturalScale;
    const sHeight = (maskSize / zoom) * screenToNaturalScale;

    try {
      ctx.drawImage(img, sx, sy, sWidth, sHeight, 0, 0, 256, 256);
      const croppedBase64 = canvas.toDataURL('image/jpeg', 0.9);
      setEditAvatarUrl(croppedBase64);
      setTempImageSrc(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err) {
      console.error("Error cropping image:", err);
      alert("Failed to crop image. Please try again with a different photo.");
    }
  };

  // Filter urgent & overdue tasks for notification
  const urgentTasks = tasks.filter((t) => {
    if (t.status === 'Done') return false;
    const isHigh = t.priority === 'High';
    const isOverdue = new Date(t.deadline) < new Date();
    return isHigh || isOverdue;
  });

  const activeNotifications = urgentTasks.filter((t) => !dismissedTaskIds.includes(t.id));

  // Initialize Web Speech API
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
        setIsListening(false);
        
        // Handle voice input: redirect to assistant and execute command
        navigate('/assistant');
        setTimeout(() => {
          sendMessage(transcript);
        }, 150);
      };

      setRecognition(rec);
    }
  }, [navigate, sendMessage]);

  const toggleVoiceInput = () => {
    if (!recognition) {
      alert("Web Speech API is not supported in this browser. Please try Chrome.");
      return;
    }
    if (isListening) {
      recognition.stop();
    } else {
      recognition.start();
    }
  };

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: editName,
      email: editEmail,
      avatarUrl: editAvatarUrl
    });
    setShowEditProfileModal(false);
  };

  // Get Page Title based on route
  const getPageTitle = () => {
    switch (location.pathname) {
      case '/': return 'Focus Overview'; // Fits the productivity context better
      case '/tasks': return 'Task Operations';
      case '/calendar': return 'AI Time Blocks';
      case '/assistant': return 'Aura Coach Terminal';
      case '/goals': return 'Streaks & Milestones';
      case '/insights': return 'Productivity Metrics';
      case '/inbox': return 'Inbox Scratchpad';
      default: return 'Zenith AI Command Center';
    }
  };

  return (
    <div className="h-20 bg-transparent flex items-center justify-between px-4 md:px-8 border-b border-gray-200/80 z-30 gap-4">
      {/* Page Title & Mobile Toggle */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger Menu Toggle on Mobile */}
        <button 
          onClick={onToggleMenu}
          className="p-2 -ml-1 text-gray-600 hover:bg-gray-100 rounded-xl md:hidden cursor-pointer flex-shrink-0"
          title="Open Menu"
        >
          <Menu size={20} />
        </button>
        <div className="min-w-0">
          <div className="flex items-center gap-2.5">
            <h1 className="text-lg md:text-2xl font-bold text-gray-900 tracking-tight leading-none truncate max-w-[130px] sm:max-w-none">
              {getPageTitle()}
            </h1>
          </div>
          <p className="text-[10px] md:text-[11px] text-gray-500 font-medium tracking-wide uppercase mt-0.5 hidden sm:block truncate">
            Take control of your focus today!
          </p>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex items-center gap-2.5 md:gap-6 flex-shrink-0">
        {/* Search Input (Responsive Width) */}
        <div className="relative hidden sm:block">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
          <input 
            type="text"
            placeholder="Search tasks..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            className="w-40 md:w-64 pl-11 pr-11 py-2 bg-white border border-gray-200 rounded-full text-xs placeholder-gray-400 focus:outline-none focus:border-[#D2FC54] focus:ring-1 focus:ring-[#D2FC54] transition-all"
          />
          {/* Microphone Activation Button */}
          <button 
            onClick={toggleVoiceInput}
            className={`absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors cursor-pointer ${
              isListening ? 'bg-red-500 text-white animate-pulse' : 'text-gray-400 hover:bg-gray-100 hover:text-gray-600'
            }`}
            title="Ask Aura by Voice"
          >
            {isListening ? <Mic size={12} /> : <MicOff size={12} />}
          </button>
        </div>

        {/* Notification Bell */}
        <div className="relative">
            <button 
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative bg-white border border-gray-200 rounded-full p-2 text-gray-600 hover:bg-gray-50 transition-colors cursor-pointer"
          >
            <Bell size={18} />
            {activeNotifications.length > 0 && (
              <span className="absolute top-0.5 right-0.5 bg-[#D2FC54] border-2 border-white text-[#161719] text-[8px] font-bold w-3.5 h-3.5 rounded-full flex items-center justify-center">
                {activeNotifications.length}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div className="absolute right-0 mt-3 w-72 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 p-4 animate-in fade-in slide-in-from-top-2 duration-200">
              <div className="flex justify-between items-center border-b border-gray-100 pb-2 mb-3">
                <span className="text-xs font-bold text-gray-900">Urgent Notifications</span>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full font-semibold">{activeNotifications.length} items</span>
                  <button 
                    onClick={() => setShowNotifications(false)}
                    className="text-gray-400 hover:text-gray-900 cursor-pointer p-0.5 hover:bg-gray-100 rounded-md transition-colors"
                    title="Close notifications panel"
                  >
                    <X size={14} />
                  </button>
                </div>
              </div>
              <div className="flex flex-col gap-2 max-h-60 overflow-y-auto">
                {activeNotifications.length === 0 ? (
                  <p className="text-xs text-gray-500 text-center py-4">No urgent or overdue tasks. Nice work!</p>
                ) : (
                  activeNotifications.map((t) => (
                    <div key={t.id} className="p-2.5 rounded-xl bg-red-50/50 border border-red-100/50 flex gap-2.5 items-start relative pr-8">
                      <div className="bg-red-500 text-white p-1 rounded-lg mt-0.5 flex-shrink-0">
                        <Sparkles size={10} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 leading-tight truncate">{t.title}</h4>
                        <p className="text-[9px] text-red-600 font-semibold mt-1">Due: {t.deadline}</p>
                      </div>
                      <button
                        onClick={() => setDismissedTaskIds(prev => [...prev, t.id])}
                        className="absolute right-2 top-2 text-gray-400 hover:text-red-500 cursor-pointer p-0.5 hover:bg-gray-100 rounded-md transition-colors"
                        title="Dismiss notification"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User profile dropdown matching mockup */}
        <div className="relative">
          <div 
            onClick={() => setShowProfileMenu(!showProfileMenu)}
            className="flex items-center gap-2 bg-white hover:bg-gray-50 border border-gray-200/80 px-3 py-1.5 rounded-2xl shadow-sm cursor-pointer transition-colors"
          >
            <div className="w-8 h-8 rounded-xl bg-gray-900 text-white text-xs font-extrabold flex items-center justify-center overflow-hidden border border-gray-100">
              {user?.avatarUrl ? (
                <img 
                  src={user.avatarUrl}
                  alt={`${user.name} Avatar`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    const initials = user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
                    (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initials)}`;
                  }}
                />
              ) : (
                <span>{user?.name ? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U'}</span>
              )}
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-gray-900 leading-none">{user?.name || 'Guest User'}</span>
              <span className="text-[9px] text-gray-400 font-medium mt-1 hidden lg:block leading-none">{user?.email || 'guest@zenith.ai'}</span>
            </div>
            <ChevronDown size={12} className="text-gray-400 ml-1" />
          </div>

          {/* Profile Dropdown Menu */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2.5 w-48 bg-white border border-gray-200 rounded-2xl shadow-xl z-30 p-2 animate-in fade-in slide-in-from-top-2 duration-150">

              <button 
                onClick={() => {
                  setEditName(user?.name || '');
                  setEditEmail(user?.email || '');
                  setEditAvatarUrl(user?.avatarUrl || '');
                  setShowEditProfileModal(true);
                  setShowProfileMenu(false);
                }}
                className="w-full text-left px-4 py-2.5 hover:bg-gray-50 rounded-xl text-xs font-bold text-gray-700 transition-colors cursor-pointer"
              >
                Profile Settings
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Profile Editing Modal */}
      {showEditProfileModal && (
        <div className="fixed inset-0 bg-[#161719]/80 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full border border-gray-100 shadow-2xl flex flex-col gap-5 animate-in zoom-in-95 duration-200 relative overflow-hidden">
            {/* Header border-accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-[#D2FC54] via-[#A78BFA] to-[#D2FC54]"></div>
            
            {tempImageSrc ? (
              /* Cropper View */
              <div className="flex flex-col gap-4 items-center">
                <div className="text-center mt-1">
                  <h3 className="text-sm font-extrabold text-gray-900">Crop Profile Photo</h3>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Drag to position and zoom to fit the circle area</p>
                </div>

                {/* Crop Box Container */}
                <div 
                  className="w-72 h-72 relative overflow-hidden bg-[#161719] rounded-2xl cursor-move select-none border border-gray-200"
                  onPointerDown={handlePointerDown}
                  onPointerMove={handlePointerMove}
                  onPointerUp={handlePointerUp}
                  onPointerLeave={handlePointerLeave}
                  style={{ touchAction: 'none' }}
                >
                  {/* Image */}
                  <img 
                    ref={imageRef}
                    src={tempImageSrc}
                    alt="Source Crop"
                    onLoad={handleImageLoad}
                    className="max-w-none pointer-events-none absolute"
                    style={{
                      transform: `translate(${offset.x}px, ${offset.y}px) scale(${zoom})`,
                      transformOrigin: 'center center',
                      left: `${(288 - (aspectRatio > 1 ? 288 * aspectRatio : 288)) / 2}px`,
                      top: `${(288 - (aspectRatio > 1 ? 288 : 288 / aspectRatio)) / 2}px`,
                      width: `${aspectRatio > 1 ? 288 * aspectRatio : 288}px`,
                      height: `${aspectRatio > 1 ? 288 : 288 / aspectRatio}px`
                    }}
                  />

                  {/* Circle Mask Overlay */}
                  <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                    <div className="w-40 h-40 rounded-full border-2 border-white shadow-[0_0_0_9999px_rgba(22,23,25,0.6)]"></div>
                  </div>
                </div>

                {/* Zoom Slider Control */}
                <div className="w-full flex items-center gap-3 px-2">
                  <span className="text-[10px] text-gray-400 font-bold uppercase">Zoom</span>
                  <input 
                    type="range"
                    min="1"
                    max="3"
                    step="0.01"
                    value={zoom}
                    onChange={handleZoomChange}
                    className="flex-1 h-1.5 bg-gray-100 rounded-lg appearance-none cursor-pointer accent-[#D2FC54] outline-none"
                  />
                  <span className="text-[10px] text-gray-700 font-bold">{Math.round(zoom * 100)}%</span>
                </div>

                {/* Crop View Buttons */}
                <div className="flex gap-2.5 justify-end w-full border-t border-gray-100 pt-4 mt-1">
                  <button 
                    type="button" 
                    onClick={() => {
                      setTempImageSrc(null);
                      if (fileInputRef.current) fileInputRef.current.value = '';
                    }}
                    className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 transition-all cursor-pointer active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    type="button" 
                    onClick={handleApplyCrop}
                    className="px-5 py-2 bg-[#D2FC54] hover:bg-[#c0ec3d] text-[#161719] rounded-2xl text-xs font-bold transition-all shadow-md shadow-[#d2fc54]/10 cursor-pointer active:scale-95"
                  >
                    Apply Crop
                  </button>
                </div>
              </div>
            ) : (
              /* Main Profile Settings Form View */
              <>
                <div className="flex justify-between items-center border-b border-gray-100 pb-3 mt-1">
                  <div>
                    <h3 className="text-sm font-extrabold text-gray-900">Profile Settings</h3>
                    <p className="text-[10px] text-gray-400 font-medium mt-0.5">Customize your digital identity in Zenith AI</p>
                  </div>
                  <button 
                    onClick={() => setShowEditProfileModal(false)}
                    className="text-gray-400 hover:text-gray-900 hover:bg-gray-100 cursor-pointer p-1.5 rounded-xl transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>

                {/* Interactive Avatar Photo Selection */}
                <div className="flex flex-col sm:flex-row items-center gap-4 bg-gray-50 border border-gray-100 p-4 rounded-2xl">
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="relative flex-shrink-0 cursor-pointer group"
                    title="Click to upload a new profile photo"
                  >
                    <div className="w-16 h-16 rounded-2xl bg-gray-900 text-white font-extrabold flex items-center justify-center overflow-hidden border border-gray-200/50 shadow-md ring-4 ring-[#D2FC54]/20 group-hover:ring-[#D2FC54]/40 transition-all duration-200 relative">
                      {editAvatarUrl ? (
                        <img 
                          src={editAvatarUrl}
                          alt="Profile Avatar"
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                          onError={(e) => {
                            const initials = editName ? editName.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'U';
                            (e.target as HTMLImageElement).src = `https://api.dicebear.com/7.x/initials/svg?seed=${encodeURIComponent(initials)}`;
                          }}
                        />
                      ) : (
                        <span className="text-lg">{editName ? editName.slice(0, 2).toUpperCase() : 'U'}</span>
                      )}
                      {/* Hover Upload Overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <span className="text-[9px] text-white font-extrabold uppercase tracking-wider">Upload</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1 items-start text-center sm:text-left">
                    <span className="text-xs font-bold text-gray-900">Profile Photo</span>
                    <p className="text-[9px] text-gray-400 leading-snug">Click the image circle or upload button to select and crop a local photo.</p>
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 bg-white hover:bg-gray-50 border border-gray-200 rounded-xl text-[10px] font-bold text-gray-700 shadow-sm transition-all cursor-pointer hover:scale-105 active:scale-95"
                    >
                      <Image size={11} className="text-[#7c3aed]" />
                      Upload Photo
                    </button>
                  </div>
                </div>
                
                <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
                  {/* Hidden File Input */}
                  <input 
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept="image/*"
                    className="hidden"
                  />

                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Full Name</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input 
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-2.5 pl-11 pr-4 text-xs text-gray-950 placeholder-gray-400 focus:outline-none focus:border-[#D2FC54] focus:ring-1 focus:ring-[#D2FC54] focus:bg-white transition-all duration-200 font-medium"
                        placeholder="Lucas Bennett"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="flex flex-col gap-1">
                    <label className="text-[10px] text-gray-400 font-extrabold uppercase tracking-wider">Email Address</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={15} />
                      <input 
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-2xl py-2.5 pl-11 pr-4 text-xs text-gray-950 placeholder-gray-400 focus:outline-none focus:border-[#D2FC54] focus:ring-1 focus:ring-[#D2FC54] focus:bg-white transition-all duration-200 font-medium"
                        placeholder="bennet02@gmail.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="flex gap-2 justify-end mt-2 border-t border-gray-100 pt-4">
                    <button 
                      type="button" 
                      onClick={() => setShowEditProfileModal(false)}
                      className="px-4 py-2 bg-white hover:bg-gray-50 border border-gray-200 rounded-2xl text-xs font-bold text-gray-700 transition-all cursor-pointer active:scale-95"
                    >
                      Cancel
                    </button>
                    <button 
                      type="submit" 
                      className="px-5 py-2 bg-[#D2FC54] hover:bg-[#c0ec3d] text-[#161719] rounded-2xl text-xs font-bold hover:scale-102 transition-all cursor-pointer shadow-md shadow-[#d2fc54]/10 active:scale-95"
                    >
                      Save Changes
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {/* Live voice overlay */}
      {isListening && (
        <div className="fixed inset-0 bg-[#161719]/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center text-white">
          <div className="relative flex items-center justify-center">
            <div className="absolute w-32 h-32 bg-[#D2FC54]/20 rounded-full animate-ping"></div>
            <div className="absolute w-24 h-24 bg-[#D2FC54]/40 rounded-full animate-pulse"></div>
            <button 
              onClick={toggleVoiceInput}
              className="relative bg-[#D2FC54] text-[#161719] p-7 rounded-full shadow-2xl hover:scale-105 transition-transform"
            >
              <Mic size={36} />
            </button>
          </div>
          <h2 className="text-xl font-bold mt-8">Aura Voice Engine Active</h2>
          <p className="text-sm text-gray-400 mt-2">Speak your command (e.g. "Plan my week" or "Add study task")</p>
        </div>
      )}
    </div>
  );
}
