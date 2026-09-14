'use client';

import React from 'react';
import { MessageCircle, Settings, BookOpen, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function GameSidebar() {
  const router = useRouter();

  return (
    <div style={{
      position: 'fixed',
      right: '1.5rem',
      top: '50%',
      transform: 'translateY(-50%)',
      display: 'flex',
      flexDirection: 'column',
      gap: '1rem',
      zIndex: 100,
    }}>
      <SidebarButton icon={<MessageCircle size={22} />} tooltip="Chat" />
      <SidebarButton icon={<Settings size={22} />} tooltip="Settings" />
      <SidebarButton icon={<BookOpen size={22} />} tooltip="Rules" />
      <SidebarButton 
        icon={<LogOut size={22} />} 
        tooltip="Leave Room" 
        onClick={() => router.push('/')} 
        danger 
      />
    </div>
  );
}

function SidebarButton({ icon, tooltip, onClick, danger }: { icon: React.ReactNode, tooltip: string, onClick?: () => void, danger?: boolean }) {
  const [hover, setHover] = React.useState(false);
  
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      title={tooltip}
      style={{
        width: '48px',
        height: '48px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: '50%',
        color: danger ? '#e74c3c' : '#c9a84c',
        cursor: 'pointer',
        transition: 'all 0.2s',
        border: danger ? '1px solid rgba(231,76,60,0.3)' : '1px solid rgba(201,168,76,0.2)',
        background: hover 
          ? (danger ? 'rgba(231,76,60,0.15)' : 'rgba(201,168,76,0.15)')
          : 'rgba(0,0,0,0.4)',
        boxShadow: hover ? '0 4px 12px rgba(0,0,0,0.5)' : '0 2px 4px rgba(0,0,0,0.3)',
        backdropFilter: 'blur(8px)'
      }}
    >
      {icon}
    </button>
  );
}
