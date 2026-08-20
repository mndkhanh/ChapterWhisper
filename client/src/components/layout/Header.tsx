import React from 'react';
import type { User } from '../../types.js';

interface HeaderProps {
  screen: 'projects' | 'new' | 'pipeline' | 'result';
  user: User | null;
  onNavigateLibrary: () => void;
  onNavigateNew: () => void;
  onLogout: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  screen,
  user,
  onNavigateLibrary,
  onNavigateNew,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 bg-[#d8cbb8]/90 backdrop-blur border-b border-[#b6ab9c]">
      <div className="flex items-center gap-9">
        <div onClick={onNavigateLibrary} className="flex items-center gap-3 cursor-pointer">
          <div className="w-7 h-7 border border-[#2c2c2c] flex items-center justify-center font-serif text-sm font-bold">
            CW
          </div>
          <span className="text-xs tracking-widest font-semibold">CHAPTERWHISPER</span>
        </div>
        <nav className="flex gap-6">
          <button
            onClick={onNavigateLibrary}
            className={'text-xs font-semibold uppercase tracking-wider transition-colors ' + (screen === 'projects' ? 'text-[#d49653]' : 'text-[#2c2c2c] hover:text-[#d49653]')}
          >
            Library
          </button>
          <button
            onClick={onNavigateNew}
            className={'text-xs font-semibold uppercase tracking-wider transition-colors ' + (screen === 'new' ? 'text-[#d49653]' : 'text-[#2c2c2c] hover:text-[#d49653]')}
          >
            New Chapter
          </button>
        </nav>
      </div>
      <div className="flex items-center gap-6">
        <span className="text-xs tracking-wider text-[#615b53]">{user ? (user.email || user.name) : ''}</span>
        <button
          onClick={onLogout}
          className="text-xs font-semibold uppercase tracking-wider text-[#978e81] hover:text-[#2c2c2c] transition-colors"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};

