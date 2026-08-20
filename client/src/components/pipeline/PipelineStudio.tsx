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
  pendingStyle: string | null;
  onSelectStep: (idx: number) => void;
  onUpdateStyle: (style: string) => void;
  onCustomStyleChange: (val: string) => void;
  onApplyCustomStyle: () => void;
  onRunStep: () => void;
  onNextStep: () => void;
  onPrevStep: () => void;
  onViewResult: () => void;
}

export const PipelineStudio: React.FC<PipelineStudioProps> = ({
  project,
  stepIndex,
  customStyle,
  pendingStyle,
  onSelectStep,
  onUpdateStyle,
  onCustomStyleChange,
  onApplyCustomStyle,
  onRunStep,
  onNextStep,
  onPrevStep,
  onViewResult,
}) => {
  const statusMeta = (st: StepStatus) => {
    switch (st) {
      case 'done':
        return { word: 'DONE', color: '#d49653' };
      case 'running':
        return { word: 'WORKING', color: '#d49653' };
      case 'ready':
        return { word: 'READY', color: '#2c2c2c' };
      case 'failed':
        return { word: 'FAILED', color: '#a3402c' };
      case 'stale':
        return { word: 'STALE', color: '#b87d3a' };
      case 'locked':
      default:
        return { word: 'LOCKED', color: '#978e81' };
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
            {project.statuses[0] === 'done' && project.style ? (
              /* ── Derived / confirmed style showcase ── */
              <div className="border border-[#d49653] bg-[#d49653]/5 p-8">
                <div className="flex items-center gap-2 mb-4">
                  <span className="w-2 h-2 rounded-full bg-[#d49653]" />
                  <span className="text-[11px] tracking-[0.2em] font-semibold uppercase text-[#d49653]">
                    Art Style Established
                  </span>
                </div>
                <h3 className="font-serif font-light text-3xl md:text-4xl leading-snug text-[#2c2c2c] mb-4">
                  {project.style}
                </h3>
                <p className="text-xs text-[#615b53] leading-relaxed max-w-2xl">
                  This visual language was {pendingStyle ? 'chosen by you' : "derived from the manuscript's narrative tone, era, and genre by Gemini"}. It will be prepended to every illustration prompt across the remaining steps.
                </p>
              </div>
            ) : (
              /* ── Selection UI (only when step is not done) ── */
              <>
                <div className="border-l-2 border-[#d49653] bg-[#bfb4a3]/20 p-4 text-xs text-[#615b53] mb-8">
                  Choose a preset style below, type a custom one, or <strong>skip both and press Generate</strong> — Gemini will analyse the manuscript and derive one for you.
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-8">
                  {DEFAULT_STYLES.map((st) => {
                    const selected = (pendingStyle ?? project.style) === st.name;
                    return (
                      <div
                        key={st.id}
                        onClick={() => onUpdateStyle(st.name)}
                        className={`border p-6 cursor-pointer transition-all ${
                          selected ? 'border-[#d49653] bg-[#d49653]/10 shadow-sm' : 'border-[#b6ab9c] hover:border-[#2c2c2c] bg-[#d8cbb8]'
                        }`}
                      >
                        <div className="h-28 plate-canvas border border-[#b6ab9c] mb-4 flex items-center justify-center text-[11px] text-[#292622]/60 font-mono tracking-widest uppercase">
                          {st.name}
                        </div>
                        <div className="flex items-center justify-between">
                          <h3 className="font-serif font-light text-2xl">{st.name}</h3>
                          <span className={`text-[11px] font-semibold tracking-widest ${selected ? 'text-[#d49653]' : 'text-[#978e81]'}`}>
                            {selected ? '✓ SELECTED' : 'SELECT'}
                          </span>
                        </div>
                        <p className="text-xs text-[#615b53] mt-2 leading-relaxed">{st.desc}</p>
                      </div>
                    );
                  })}
                </div>

                <div className="border border-[#b6ab9c] p-6 bg-[#d8cbb8]">
                  <label className="block text-[11px] font-semibold uppercase tracking-[0.18em] mb-2.5 text-[#615b53]">Or Describe a Custom Art Style</label>
                  <div className="flex gap-3">
                    <input
                      type="text"
                      value={customStyle}
                      onChange={(e) => onCustomStyleChange(e.target.value)}
                      placeholder="e.g. Victorian watercolor with deep umber shadows..."
                      className="flex-1 bg-transparent border border-[#b6ab9c] rounded-[2px] px-4 py-2.5 text-sm outline-none focus:border-[#d49653] transition-colors"
                    />
                    <button
                      onClick={onApplyCustomStyle}
                      className="bg-[#2c2c2c] text-[#d8cbb8] text-[11px] uppercase px-6 py-2.5 font-semibold tracking-wider rounded-[2px] hover:bg-[#292622] transition-colors cursor-pointer"
                    >
                      Apply
                    </button>
                  </div>
                </div>
              </>
            )}
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
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {project.characters.slice(0, 2).map((c, i) => (
              <div key={c.id || i} className="border border-[#b6ab9c] bg-[#d8cbb8] p-6 shadow-sm">
                <div className="aspect-[3/4] plate-canvas border border-[#b6ab9c] flex flex-col justify-between p-6 relative overflow-hidden mb-4">
                  <div className="flex items-center justify-between z-10">
                    <span className="text-[10px] tracking-[0.2em] font-semibold text-[#292622]/60 uppercase">PLATE 0{i + 1}</span>
                    <span className="text-[10px] tracking-widest font-mono text-[#292622]/60">PORTRAIT</span>
                  </div>

                  {c.portraitUrl && project.statuses[2] === 'done' ? (
                    <img
                      src={c.portraitUrl}
                      alt={c.name}
                      className="absolute inset-0 w-full h-full object-cover"
                    />
                  ) : (
                    <div className="my-auto text-center z-10">
                      <div className="w-12 h-12 border border-[#292622]/30 rounded-full mx-auto mb-3 flex items-center justify-center font-serif text-lg text-[#292622]/60">
                        {c.name.charAt(0)}
                      </div>
                      <div className="text-[11px] tracking-widest uppercase text-[#292622]/70 font-medium">
                        {project.statuses[2] === 'running' ? 'Rendering with Gemini...' : 'Awaiting Illustration'}
                      </div>
                    </div>
                  )}

                  {project.statuses[2] === 'running' && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d49653]/15 to-transparent animate-pulse" />
                  )}

                  <div className="z-10 bg-[#d8cbb8]/90 backdrop-blur-sm -mx-6 -mb-6 p-4 border-t border-[#b6ab9c]">
                    <div className="font-serif text-2xl leading-tight text-[#2c2c2c]">{c.name}</div>
                    <div className="text-[11px] text-[#615b53] mt-0.5">{c.description}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 4: Chapter Scene Selection */}
        {stepIndex === 3 && (
          <div>
            <div className="border-l-2 border-[#d49653] bg-[#bfb4a3]/20 p-4 text-xs text-[#615b53] mb-6">
              Server-side cap: <strong>Exactly 1 main chapter scene</strong> is formulated and extracted.
            </div>

            {project.statuses[3] === 'done' && project.chapters.length > 0 ? (
              <div className="flex flex-col gap-6">
                {project.chapters.map((ch, i) => (
                  <div
                    key={ch.id || i}
                    className="border border-[#d49653] bg-[#d49653]/5 p-8 shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-[11px] tracking-[0.2em] font-semibold text-[#d49653] uppercase flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-[#d49653]" />
                        KEY SCENE FORMULATED
                      </span>
                      <span className="text-[11px] font-mono text-[#978e81] uppercase">CHAPTER 0{i + 1}</span>
                    </div>

                    <h3 className="font-serif font-light text-3xl md:text-4xl leading-tight text-[#2c2c2c] mb-4">
                      {ch.name}
                    </h3>

                    <div className="text-xs text-[#615b53] leading-relaxed mb-6 bg-[#d8cbb8] p-5 border border-[#b6ab9c]">
                      <div className="text-[10px] tracking-widest font-semibold uppercase text-[#978e81] mb-2">SCENE COMPOSITION PROMPT</div>
                      <p className="italic font-serif text-base text-[#2c2c2c]">{ch.prompt}</p>
                    </div>

                    {ch.characters && ch.characters.length > 0 && (
                      <div className="flex items-center gap-2 text-xs text-[#615b53]">
                        <span className="text-[10px] tracking-widest font-semibold uppercase text-[#978e81]">FEATURING:</span>
                        <span className="font-semibold text-[#2c2c2c]">{ch.characters.join(', ')}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="border border-[#b6ab9c] bg-[#d8cbb8] p-8 text-center">
                <div className="font-serif font-light text-3xl text-[#2c2c2c] mb-3">Formulate Chapter Scene</div>
                <p className="text-xs text-[#615b53] max-w-md mx-auto leading-relaxed mb-6">
                  Gemini will analyse the narrative climax, extract the primary chapter scene, and craft a detailed visual composition prompt referencing your generated character portraits.
                </p>
                <div className="text-[11px] text-[#978e81] uppercase tracking-widest font-mono">
                  Press &ldquo;Generate Step&rdquo; below to formulate the scene
                </div>
              </div>
            )}
          </div>
        )}

        {/* Step 5: Scene Illustration */}
        {stepIndex === 4 && (
          <div className="border border-[#b6ab9c] bg-[#d8cbb8] p-8 shadow-sm">
            <div className="aspect-[16/10] plate-canvas border border-[#b6ab9c] flex flex-col justify-between p-8 relative overflow-hidden">
              <div className="flex items-center justify-between z-10">
                <span className="text-[11px] tracking-[0.2em] font-semibold text-[#292622]/60 uppercase">MASTER COMPOSITION PLATE</span>
                <span className="text-[11px] tracking-widest font-mono text-[#292622]/60">{project.style || 'Ink & Wash'}</span>
              </div>

              {project.chapters[project.chapterIndex ?? 0]?.illustrationUrl && project.statuses[4] === 'done' ? (
                <img
                  src={project.chapters[project.chapterIndex ?? 0].illustrationUrl}
                  alt="Final Scene Illustration"
                  className="absolute inset-0 w-full h-full object-cover"
                />
              ) : (
                <div className="my-auto text-center z-10">
                  <div className="font-serif text-4xl text-[#292622]/70 mb-2">
                    {SAMPLE_CHAPTERS[project.chapterIndex ?? 0]}
                  </div>
                  <div className="text-xs tracking-widest uppercase text-[#292622]/60 font-medium">
                    {project.statuses[4] === 'running' ? 'Composing multi-character plate with Gemini 3.1 Flash Image…' : 'Awaiting Final Composition'}
                  </div>
                </div>
              )}

              {project.statuses[4] === 'running' && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#d49653]/15 to-transparent animate-pulse" />
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
        )}

        {/* Failure notice — a failed step keeps the project usable and retries alone. */}
        {project.statuses[stepIndex] === 'failed' && project.error && (
          <div className="mt-8 border-l-2 border-[#a3402c] bg-[#a3402c]/10 p-4">
            <div className="text-[10px] tracking-widest font-semibold uppercase text-[#a3402c] mb-1.5">
              Step failed · nothing was lost
            </div>
            <p className="text-xs text-[#615b53] leading-relaxed break-words">{project.error}</p>
            <p className="text-xs text-[#978e81] mt-2">Press Retry to run this step again.</p>
          </div>
        )}

        {/* Actions & Feedback Footer */}
        <div className="flex items-center gap-4 mt-10 flex-wrap">
          <button
            onClick={onRunStep}
            disabled={
              project.statuses[stepIndex] === 'running' || project.statuses[stepIndex] === 'done'
            }
            className="bg-[#2c2c2c] hover:bg-[#292622] text-[#d8cbb8] rounded-[3px] px-8 py-4 text-xs font-semibold tracking-wider uppercase cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {project.statuses[stepIndex] === 'running'
              ? 'Generating...'
              : project.statuses[stepIndex] === 'failed'
              ? 'Retry Step'
              : project.statuses[stepIndex] === 'done'
              ? '✓ Step Complete'
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


