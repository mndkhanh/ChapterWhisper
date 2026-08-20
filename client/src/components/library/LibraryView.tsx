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
  <main className="max-w-6xl mx-auto px-8 py-16">
    <div className="flex items-center gap-2 text-[11px] tracking-[0.25em] text-[#978e81] font-semibold uppercase mb-4">
      <span className="w-1.5 h-1.5 rounded-full bg-[#d49653]" />
      <span>STUDIO ARCHIVE · {user?.email}</span>
    </div>

    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-10 border-b border-[#b6ab9c]">
      <h1 className="font-serif font-light uppercase text-6xl md:text-8xl tracking-tight text-[#2c2c2c] m-0">
        Your Library
      </h1>
      <button
        onClick={onNewProject}
        className="self-start md:self-auto bg-[#2c2c2c] hover:bg-[#292622] text-[#d8cbb8] hover:text-[#d49653] transition-all rounded-[2px] px-8 py-4 text-xs font-semibold tracking-[0.2em] uppercase cursor-pointer shadow-sm"
      >
        + Begin a New Chapter
      </button>
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
      {projects.map((p) => {
        const doneCount = p.statuses.filter((x) => x === 'done').length;
        const pct = `${(doneCount / 5) * 100}%`;
        return (
          <div
            key={p.id}
            onClick={() => onOpenProject(p.id)}
            className="border border-[#b6ab9c] p-8 flex flex-col justify-between min-h-[290px] bg-[#d8cbb8] hover:bg-[#bfb4a3]/30 hover:border-[#2c2c2c] hover:shadow-md transition-all cursor-pointer group"
          >
            <div>
              <div className="flex items-center justify-end text-[11px] font-semibold tracking-[0.18em] mb-6">
                <span className={`px-2 py-0.5 text-[10px] rounded-[2px] ${
                  doneCount === 5
                    ? 'bg-[#d49653]/15 text-[#d49653]'
                    : doneCount > 0
                    ? 'bg-[#2c2c2c]/10 text-[#2c2c2c]'
                    : 'text-[#978e81]'
                }`}>
                  {doneCount === 5 ? 'COMPLETE' : doneCount > 0 ? `STEP 0${doneCount + 1}` : 'INITIAL'}
                </span>
              </div>
              <h3 className="font-serif font-light uppercase text-3xl leading-snug text-[#2c2c2c] mb-2.5 group-hover:text-[#292622]">
                {p.title}
              </h3>
              <p className="text-xs text-[#615b53] font-light">
                {p.wordCount.toLocaleString()} words · {p.chapters.length} chapter · {p.characters.length} cast
              </p>
            </div>

            <div className="mt-8 pt-4 border-t border-[#b6ab9c]/50">
              <div className="h-1 bg-[#b6ab9c]/40 w-full relative mb-3 overflow-hidden rounded-full">
                <div className="absolute top-0 left-0 bottom-0 bg-[#d49653] transition-all duration-500" style={{ width: pct }} />
              </div>
              <div className="flex items-center justify-between text-[11px] font-medium text-[#615b53]">
                <span className="font-mono">{doneCount} / 5 plates</span>
                <span className="uppercase tracking-widest font-semibold text-[#2c2c2c] group-hover:text-[#d49653] transition-colors">
                  Open Atelier →
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  </main>
);


