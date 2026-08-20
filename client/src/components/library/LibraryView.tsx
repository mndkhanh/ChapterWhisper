import React from 'react';
import type { User, Project } from '../../types.js';

interface LibraryViewProps {
  user: User | null;
  projects: Project[];
  onOpenProject: (id: string) => void;
  onNewProject: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  user,
  projects,
  onOpenProject,
  onNewProject,
}) => (
  <main className="max-w-6xl mx-auto px-8 py-14">
    <div className="text-xs tracking-[0.2em] text-[#978e81] font-semibold uppercase mb-4">
      SIGNED IN · {user?.email}
    </div>
    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-9 border-b border-[#b6ab9c]">
      <h1 className="font-serif font-light uppercase text-6xl md:text-8xl tracking-tight m-0">Your Library</h1>
      <button
        onClick={onNewProject}
        className="self-start md:self-auto border border-[#2c2c2c] hover:bg-[#2c2c2c] hover:text-[#d8cbb8] transition-colors rounded-[3px] px-6 py-4 text-xs font-semibold tracking-wider uppercase cursor-pointer"
      >
        Begin a New Chapter
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-[#b6ab9c] mt-8">
      {projects.map((p) => {
        const doneCount = p.statuses.filter((x) => x === 'done').length;
        const pct = `${(doneCount / 5) * 100}%`;
        return (
          <div
            key={p.id}
            onClick={() => onOpenProject(p.id)}
            className="border-r border-b border-[#b6ab9c] p-8 flex flex-col justify-between min-h-[260px] bg-[#d8cbb8] hover:bg-[#bfb4a3]/40 transition-colors cursor-pointer"
          >
            <div>
              <div className="flex items-center justify-between text-xs font-medium tracking-wider mb-6">
                <span className="text-[#978e81] uppercase">{p.style || 'STYLE PENDING'}</span>
                <span className={doneCount === 5 ? 'text-[#d49653]' : 'text-[#615b53]'}>
                  {doneCount === 5 ? 'COMPLETE' : doneCount > 0 ? 'IN PROGRESS' : 'NOT STARTED'}
                </span>
              </div>
              <h3 className="font-serif font-light uppercase text-3xl leading-tight mb-2">{p.title}</h3>
              <p className="text-xs text-[#615b53]">{p.wordCount.toLocaleString()} words · {p.chapters.length} chapter</p>
            </div>

            <div className="mt-8">
              <div className="h-0.5 bg-[#b6ab9c] w-full relative mb-3">
                <div className="absolute top-0 left-0 bottom-0 bg-[#d49653]" style={{ width: pct }} />
              </div>
              <div className="flex items-center justify-between text-xs font-medium">
                <span className="text-[#978e81]">{doneCount} / 5 plates</span>
                <span className="uppercase tracking-wider font-semibold">Open →</span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </main>
);

