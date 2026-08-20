import React from 'react';
import type { Project, StepStatus } from '../../types.js';

const META = [
  { num: '01', eyebrow: 'STEP ONE', title: 'Art Style', desc: 'Choose the visual language the whole book will inherit. Every plate that follows is rendered in it.' },
  { num: '02', eyebrow: 'STEP TWO', title: 'Characters', desc: 'Cast the story from the manuscript. Two adults, no more — a cost boundary held on the server, not a suggestion.' },
  { num: '03', eyebrow: 'STEP THREE', title: 'Character Portraits', desc: 'Render each face in the chosen style so the cast stays consistent across the scene.' },
  { num: '04', eyebrow: 'STEP FOUR', title: 'Chapter Scene', desc: 'Select the single chapter to illustrate. One scene per project.' },
  { num: '05', eyebrow: 'STEP FIVE', title: 'Illustration', desc: 'Compose the final plate — style, cast, and scene resolved into one image.' },
];

const DEFAULT_STYLES = [
  { id: 'ink', name: 'Ink & Wash', desc: 'Loose etched linework flooded with translucent grey wash — spare, literary, close to the page.' },
  { id: 'oil', name: 'Golden-Age Oil', desc: 'Warm varnished oil in the Rackham tradition — deep shadow, amber highlight, painterly grain.' },
];

const SAMPLE_CHAPTERS = [
  'I. The Letter Beneath the Door',
  'II. The Midnight Market',
  'III. The Duel in the Rafters',
];

interface PipelineStudioProps {
  project: Project;
  stepIndex: number;
  customStyle: string;
  onSelectStep: (idx: number) => void;
  onUpdateStyle: (style: string) => void;
  onCustomStyleChange: (val: string) => void;
  onApplyCustomStyle: () => void;
  onSelectChapter: (idx: number) => void;
  onRunStep: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onViewResult: () => void;
}

export const PipelineStudio: React.FC<PipelineStudioProps> = ({
  project,
  stepIndex,
  customStyle,
  onSelectStep,
  onUpdateStyle,
  onCustomStyleChange,
  onApplyCustomStyle,
  onSelectChapter,
  onRunStep,
  onNextStep,
  onPrevStep,
  onViewResult,
}) => {
  const statusMeta = (st: StepStatus) => {
    switch (st) {
      case 'done':
        return { word: 'DONE', color: 'var(--saffron)' };
      case 'running':
        return { word: 'WORKING', color: 'var(--saffron)' };
      case 'ready':
        return { word: 'READY', color: 'var(--onyx)' };
      case 'failed':
        return { word: 'FAILED', color: 'var(--danger)' };
      case 'stale':
        return { word: 'STALE', color: 'var(--warn)' };
      case 'locked':
      default:
        return { word: 'LOCKED', color: 'var(--walnut)' };
    }
  };

  return (
    <main className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 md:grid-cols-[270px_1fr] gap-14 items-start">
      {/* Vertical Stepper Rail */}
      <div className="sticky top-24">
        <div className="text-xs tracking-widest text-[#978e81] font-medium uppercase mb-1">
          {project.style || 'STYLE PENDING'}
        </div>
        <h2 className="font-serif font-light uppercase text-2xl tracking-tight mb-6">{project.title}</h2>

        <div className="flex flex-col">
          {project.statuses.map((status, idx) => {
            const sm = statusMeta(status);
            const isCurrent = idx === stepIndex;
            return (
              <div
                key={idx}
                onClick={() => {
                  if (status !== 'locked') onSelectStep(idx);
                }}
                className={`flex gap-3.5 items-start p-3.5 border-l-2 transition-colors ${
                  isCurrent
                    ? 'border-[#d49653] bg-[#d49653]/10 font-semibold'
                    : 'border-transparent opacity-80'
                } ${status === 'locked' ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-[#bfb4a3]/20'}`}
              >
                <span className="font-serif font-light text-xl leading-none text-[#2c2c2c]">{META[idx].num}</span>
                <div className="flex-1">
                  <div className="text-xs font-semibold text-[#2c2c2c]">{META[idx].title}</div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: sm.color }} />
                    <span className="text-[10px] tracking-wider font-semibold uppercase" style={{ color: sm.color }}>
                      {sm.word}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Main Step Execution Area */}
      <div className="min-h-[500px]">
        <div className="text-xs tracking-[0.2em] text-[#d49653] font-semibold uppercase mb-3">{META[stepIndex].eyebrow}</div>
        <h1 className="font-serif font-light uppercase text-5xl md:text-6xl tracking-tight mb-3">{META[stepIndex].title}</h1>
        <p className="max-w-xl text-sm leading-relaxed text-[#615b53] mb-8">{META[stepIndex].desc}</p>
        <div className="h-px bg-[#b6ab9c] mb-8" />

        {/* Step 1: Art Style */}
        {stepIndex === 0 && (
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
              {DEFAULT_STYLES.map((st) => {
                const selected = project.style === st.name;
                return (
                  <div
                    key={st.id}
                    onClick={() => onUpdateStyle(st.name)}
                    className={`border p-6 cursor-pointer transition-colors ${
                      selected ? 'border-[#d49653] bg-[#d49653]/10' : 'border-[#b6ab9c] hover:border-[#2c2c2c]'
                    }`}
                  >
                    <div className="h-28 bg-[#a7a49d] mb-4 flex items-center justify-center text-xs text-[#292622] font-mono">
                      {st.name} Preview
                    </div>
                    <div className="flex items-center justify-between">
                      <h3 className="font-serif font-light text-2xl">{st.name}</h3>
                      <span className={`text-xs font-semibold tracking-widest ${selected ? 'text-[#d49653]' : 'text-[#978e81]'}`}>
                        {selected ? '✓ SELECTED' : 'SELECT'}
                      </span>
                    </div>
                    <p className="text-xs text-[#615b53] mt-2 leading-relaxed">{st.desc}</p>
                  </div>
                );
              })}
            </div>

            <div className="border border-[#b6ab9c] p-6">
              <label className="block text-xs font-semibold uppercase tracking-wider mb-2 text-[#615b53]">Or Custom Art Style Override</label>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={customStyle}
                  onChange={(e) => onCustomStyleChange(e.target.value)}
                  placeholder="e.g. Victorian watercolor with deep umber shadows..."
                  className="flex-1 bg-transparent border border-[#b6ab9c] rounded-[3px] px-3.5 py-2 text-sm outline-none"
                />
                <button
                  onClick={onApplyCustomStyle}
                  className="bg-[#2c2c2c] text-[#d8cbb8] text-xs uppercase px-5 py-2 font-semibold rounded-[3px]"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Characters */}
        {stepIndex === 1 && (
          <div>
            <div className="border-l-2 border-[#d49653] bg-[#bfb4a3]/20 p-3.5 text-xs text-[#615b53] mb-6">
              Server-side cap: <strong>Maximum 2 adult characters</strong>. No children.
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {project.characters.slice(0, 2).map((c, i) => (
                <div key={c.id || i} className="border border-[#b6ab9c] p-6 bg-[#d8cbb8]">
                  <div className="text-[10px] tracking-widest text-[#978e81] font-semibold mb-3 uppercase">
                    CHARACTER 0{i + 1} · ADULT
                  </div>
                  <h3 className="font-serif font-light text-3xl leading-tight mb-2">{c.name}</h3>
                  <p className="text-xs text-[#615b53] leading-relaxed mb-4">{c.description}</p>
                  <div className="text-xs text-[#978e81] bg-[#bfb4a3]/30 p-3 font-mono text-[11px]">
                    {c.prompt}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Character Portraits */}
        {stepIndex === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {project.characters.slice(0, 2).map((c, i) => (
              <div key={c.id || i}>
                <div className="aspect-[3/4] bg-[#a7a49d] border border-[#b6ab9c] flex flex-col justify-end p-5 relative overflow-hidden">
                  {project.statuses[2] === 'running' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                  )}
                  <div className="text-xs font-semibold uppercase text-[#292622]">
                    {project.statuses[2] === 'done' ? 'PORTRAIT PLATE' : project.statuses[2] === 'running' ? 'RENDERING...' : 'AWAITING RENDER'}
                  </div>
                  <div className="font-serif text-2xl text-[#292622]">{c.name}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Chapter Scene Selection */}
        {stepIndex === 3 && (
          <div>
            <div className="border-l-2 border-[#d49653] bg-[#bfb4a3]/20 p-3.5 text-xs text-[#615b53] mb-6">
              Server-side cap: <strong>Exactly 1 main chapter scene</strong>.
            </div>
            <div className="flex flex-col gap-3.5">
              {SAMPLE_CHAPTERS.map((chName, i) => {
                const selected = project.chapterIndex === i;
                return (
                  <div
                    key={i}
                    onClick={() => onSelectChapter(i)}
                    className={`flex items-center gap-4 border p-5 cursor-pointer transition-colors ${
                      selected ? 'border-[#d49653] bg-[#d49653]/10' : 'border-[#b6ab9c] hover:border-[#2c2c2c]'
                    }`}
                  >
                    <span className={`w-4 h-4 rounded-full border border-[#2c2c2c] ${selected ? 'bg-[#d49653]' : 'bg-transparent'}`} />
                    <span className="font-serif font-light text-2xl">{chName}</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 5: Scene Illustration */}
        {stepIndex === 4 && (
          <div className="aspect-[16/10] bg-[#a7a49d] border border-[#b6ab9c] flex flex-col justify-end p-8 relative overflow-hidden">
            {project.statuses[4] === 'running' && (
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
            )}
            <div className="text-xs font-semibold uppercase text-[#292622]">
              {project.statuses[4] === 'done' ? 'COMPOSED FINAL PLATE' : project.statuses[4] === 'running' ? 'COMPOSING PLATE...' : 'AWAITING COMPOSITION'}
            </div>
            <div className="font-serif text-3xl text-[#292622] mt-1">
              {SAMPLE_CHAPTERS[project.chapterIndex ?? 0]}
            </div>
          </div>
        )}

        {/* Actions & Feedback Footer */}
        <div className="flex items-center gap-4 mt-10 flex-wrap">
          <button
            onClick={onRunStep}
            disabled={project.statuses[stepIndex] === 'running'}
            className="bg-[#2c2c2c] hover:bg-[#292622] text-[#d8cbb8] rounded-[3px] px-8 py-4 text-xs font-semibold tracking-wider uppercase cursor-pointer disabled:opacity-75"
          >
            {project.statuses[stepIndex] === 'running'
              ? 'Generating...'
              : project.statuses[stepIndex] === 'done'
              ? 'Regenerate Step'
              : 'Generate Step'}
          </button>

          {project.statuses[stepIndex] === 'done' && stepIndex < 4 && (
            <button
              onClick={onNextStep}
              className="bg-[#2c2c2c] text-[#d8cbb8] rounded-[3px] px-8 py-4 text-xs font-semibold tracking-wider uppercase cursor-pointer"
            >
              Next Step →
            </button>
          )}

          {project.statuses[4] === 'done' && stepIndex === 4 && (
            <button
              onClick={onViewResult}
              className="bg-[#d49653] text-[#292622] rounded-[3px] px-8 py-4 text-xs font-semibold tracking-wider uppercase cursor-pointer"
            >
              View the Plate →
            </button>
          )}

          {stepIndex > 0 && (
            <button
              onClick={onPrevStep}
              className="text-xs font-semibold tracking-wider uppercase text-[#978e81] hover:text-[#2c2c2c] px-4 py-4"
            >
              ← Back
            </button>
          )}
        </div>
      </div>
    </main>
  );
};


