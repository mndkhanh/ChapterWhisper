import React from 'react';
import type { Project } from '../../types.js';

const SAMPLE_CHAPTERS = [
  'I. The Letter Beneath the Door',
  'II. The Midnight Market',
  'III. The Duel in the Rafters',
];

interface ResultViewProps {
  project: Project;
  onBackToPipeline: () => void;
  onReturnLibrary: () => void;
}

export const ResultView: React.FC<ResultViewProps> = ({
  project,
  onBackToPipeline,
  onReturnLibrary,
}) => (
  <main className="max-w-7xl mx-auto px-8 py-14">
    <div className="text-xs tracking-[0.2em] text-[#d49653] font-semibold uppercase mb-3">Chapter Illustrated</div>
    <h1 className="font-serif font-light uppercase text-6xl md:text-7xl tracking-tight mb-10">{project.title}</h1>

    <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_0.45fr] gap-12 items-start">
      <div className="aspect-[16/11] bg-[#a7a49d] border border-[#b6ab9c] flex flex-col justify-end p-8">
        <div className="text-xs font-semibold uppercase text-[#292622]">FINAL COMPOSITION PLATE</div>
        <div className="font-serif text-3xl text-[#292622]">
          {SAMPLE_CHAPTERS[project.chapterIndex ?? 0]} · {project.style}
        </div>
      </div>

      <aside className="flex flex-col gap-6">
        <div className="border-t border-[#2c2c2c] pt-4">
          <div className="text-xs font-semibold text-[#978e81] uppercase tracking-wider mb-1">Art Style</div>
          <div className="font-serif text-2xl">{project.style || 'Ink & Wash'}</div>
        </div>

        <div className="border-t border-[#b6ab9c] pt-4">
          <div className="text-xs font-semibold text-[#978e81] uppercase tracking-wider mb-1">Cast</div>
          <div className="font-serif text-xl leading-snug">
            {project.characters.map((c) => c.name).join(' & ')}
          </div>
        </div>

        <div className="border-t border-[#b6ab9c] pt-4">
          <div className="text-xs font-semibold text-[#978e81] uppercase tracking-wider mb-1">Chapter</div>
          <div className="font-serif text-xl leading-snug">
            {SAMPLE_CHAPTERS[project.chapterIndex ?? 0]}
          </div>
        </div>

        <div className="flex flex-col gap-3 mt-4">
          <button
            onClick={onBackToPipeline}
            className="bg-[#2c2c2c] text-[#d8cbb8] rounded-[3px] py-4 text-xs font-semibold tracking-wider uppercase cursor-pointer"
          >
            Back to Pipeline
          </button>
          <button
            onClick={onReturnLibrary}
            className="border border-[#2c2c2c] text-[#2c2c2c] rounded-[3px] py-4 text-xs font-semibold tracking-wider uppercase cursor-pointer"
          >
            Return to Library
          </button>
        </div>
      </aside>
    </div>
  </main>
);

