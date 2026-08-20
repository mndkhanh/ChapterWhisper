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
    <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-4 bg-[#d8cbb8]/95 backdrop-blur-md border-b border-[#b6ab9c]">
      <div className="flex items-center gap-10">
        <div onClick={onNavigateLibrary} className="flex items-center gap-3.5 cursor-pointer group">
          <div className="w-7 h-7 border border-[#2c2c2c] group-hover:border-[#d49653] flex items-center justify-center font-serif text-xs font-semibold tracking-widest transition-colors">
            CW
          </div>
          <span className="text-[11px] tracking-[0.25em] font-semibold text-[#2c2c2c] group-hover:text-[#d49653] transition-colors">
            CHAPTERWHISPER
          </span>
        </div>

        <nav className="flex items-center gap-8">
          <button
            onClick={onNavigateLibrary}
            className={'text-[11px] font-semibold uppercase tracking-[0.18em] transition-all relative py-1 cursor-pointer ' + 
              (screen === 'projects' ? 'text-[#d49653]' : 'text-[#2c2c2c] hover:text-[#d49653]')}
          >
            Library
            {screen === 'projects' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d49653]" />}
          </button>
          <button
            onClick={onNavigateNew}
            className={'text-[11px] font-semibold uppercase tracking-[0.18em] transition-all relative py-1 cursor-pointer ' + 
              (screen === 'new' ? 'text-[#d49653]' : 'text-[#2c2c2c] hover:text-[#d49653]')}
          >
            + New Chapter
            {screen === 'new' && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#d49653]" />}
          </button>
        </nav>
      </div>

      <div className="flex items-center gap-6">
        {user && (
          <div className="flex items-center gap-2 text-xs tracking-wider text-[#615b53]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#d49653]" />
            <span className="font-mono text-[11px]">{user.email || user.name}</span>
          </div>
        )}
        <button
          onClick={onLogout}
          className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#978e81] hover:text-[#2c2c2c] transition-colors cursor-pointer"
        >
          Sign Out
        </button>
      </div>
    </header>
  );
};


