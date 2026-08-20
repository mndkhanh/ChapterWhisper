import React from 'react';
import type { Project } from '../../types.js';

interface ResultViewProps {
  project: Project;
  onBackToPipeline: () => void;
  onReturnLibrary: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  project,
  onBackToPipeline,
  onReturnLibrary,
}) => {
  const currentChapter = project.chapters[project.chapterIndex ?? 0] || project.chapters[0];

  return (
    <main className="max-w-7xl mx-auto px-8 py-16">
      <div className="flex items-center gap-2 text-[11px] tracking-[0.25em] text-[#d49653] font-semibold uppercase mb-3">
        <span className="w-2 h-2 rounded-full bg-[#d49653]" />
        <span>MASTERWORK EDITION · CHAPTER ILLUSTRATED</span>
      </div>
      <h1 className="font-serif font-light uppercase text-6xl md:text-8xl tracking-tight text-[#2c2c2c] mb-12">
        {project.title}
      </h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_0.45fr] gap-14 items-start">
        {/* Full Bleed Composition Plate */}
        <div className="border border-[#b6ab9c] bg-[#d8cbb8] p-8 shadow-md">
          <div className="aspect-[16/10] plate-canvas border border-[#b6ab9c] flex flex-col justify-between p-8 relative overflow-hidden">
            <div className="flex items-center justify-between z-10">
              <span className="text-[11px] tracking-[0.2em] font-semibold text-[#292622]/60 uppercase">
                FIRST EDITION COMPOSITION PLATE
              </span>
              <span className="text-[11px] tracking-widest font-mono text-[#292622]/60">
                {project.style || 'Ink & Wash'}
              </span>
            </div>

            {currentChapter?.illustrationUrl ? (
              <img
                src={currentChapter.illustrationUrl}
                alt={currentChapter.name}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : (
              <div className="my-auto text-center z-10">
                <div className="font-serif text-4xl text-[#292622]/70 mb-2">
                  {currentChapter?.name || 'Illustrated Chapter Scene'}
                </div>
                <div className="text-xs tracking-widest uppercase text-[#292622]/60 font-medium">
                  {project.style || 'Ink & Wash'}
                </div>
              </div>
            )}

            <div className="z-10 bg-[#d8cbb8]/90 backdrop-blur-sm -mx-8 -mb-8 p-5 border-t border-[#b6ab9c] flex items-center justify-between">
              <div>
                <div className="text-[10px] tracking-widest font-semibold uppercase text-[#978e81]">FEATURING CAST</div>
                <div className="font-serif text-xl text-[#2c2c2c]">
                  {project.characters.map((c) => c.name).join(' & ') || 'Principal Cast'}
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] tracking-widest font-semibold uppercase text-[#978e81]">ATMOSPHERE</div>
                <div className="text-xs font-semibold uppercase text-[#d49653]">{project.style || 'Ink & Wash'}</div>
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar Dossier */}
        <aside className="flex flex-col gap-6">
          <div className="border-t border-[#2c2c2c] pt-5">
            <div className="text-[11px] font-semibold text-[#978e81] uppercase tracking-[0.18em] mb-2">
              Visual Language
            </div>
            <div className="font-serif text-2xl text-[#2c2c2c] leading-snug">{project.style || 'Ink & Wash'}</div>
          </div>

          <div className="border-t border-[#b6ab9c] pt-5">
            <div className="text-[11px] font-semibold text-[#978e81] uppercase tracking-[0.18em] mb-3">
              Principal Cast ({project.characters.length})
            </div>
            <div className="flex flex-col gap-3">
              {project.characters.map((c) => (
                <div key={c.id} className="flex items-center gap-3 bg-[#bfb4a3]/20 p-3 border border-[#b6ab9c]/60">
                  {c.portraitUrl ? (
                    <img src={c.portraitUrl} alt={c.name} className="w-10 h-10 object-cover rounded-[1px] border border-[#b6ab9c]" />
                  ) : (
                    <div className="w-10 h-10 bg-[#a7a49d] flex items-center justify-center font-serif text-sm border border-[#b6ab9c]">
                      {c.name.charAt(0)}
                    </div>
                  )}
                  <div>
                    <div className="font-serif text-lg leading-tight text-[#2c2c2c]">{c.name}</div>
                    <div className="text-[10px] text-[#615b53]">{c.description || 'Adult cast member'}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t border-[#b6ab9c] pt-5">
            <div className="text-[11px] font-semibold text-[#978e81] uppercase tracking-[0.18em] mb-2">
              Illustrated Scene
            </div>
            <div className="font-serif text-xl leading-snug text-[#2c2c2c]">
              {currentChapter?.name || 'Chapter Scene'}
            </div>
            {currentChapter?.prompt && (
              <p className="text-xs text-[#615b53] italic mt-2 leading-relaxed bg-[#bfb4a3]/20 p-3 border border-[#b6ab9c]/40 font-serif">
                &ldquo;{currentChapter.prompt}&rdquo;
              </p>
            )}
          </div>

          <div className="flex flex-col gap-3.5 mt-4">
            <button
              onClick={onBackToPipeline}
              className="bg-[#2c2c2c] hover:bg-[#292622] text-[#d8cbb8] hover:text-[#d49653] transition-all rounded-[2px] py-4 text-xs font-semibold tracking-[0.2em] uppercase cursor-pointer shadow-sm"
            >
              ← Back to Pipeline Studio
            </button>
            <button
              onClick={onReturnLibrary}
              className="border border-[#2c2c2c] hover:bg-[#2c2c2c]/10 text-[#2c2c2c] transition-all rounded-[2px] py-4 text-xs font-semibold tracking-[0.2em] uppercase cursor-pointer"
            >
              Return to Library
            </button>
          </div>
        </aside>
      </div>
    </main>
  );
};


