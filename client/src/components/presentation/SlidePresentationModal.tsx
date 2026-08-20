import React, { useState, useEffect, useCallback } from 'react';
import type { Project } from '../../types.js';

interface SlidePresentationModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
}

export const SlidePresentationModal: React.FC<SlidePresentationModalProps> = ({
  project,
  isOpen,
  onClose,
}) => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const currentChapter = project.chapters[project.chapterIndex ?? 0] || project.chapters[0];
  const totalSlides = 5;

  const nextSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.min(prev + 1, totalSlides - 1));
  }, [totalSlides]);

  const prevSlide = useCallback(() => {
    setCurrentSlide((prev) => Math.max(prev - 1, 0));
  }, []);

  // Keyboard navigation for presentation mode
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'Backspace') {
        e.preventDefault();
        prevSlide();
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, nextSlide, prevSlide, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#1f1d1a]/95 text-[#e6ded1] backdrop-blur-md flex flex-col justify-between p-6 md:p-12 animate-fade-in">
      {/* Header Bar */}
      <div className="flex items-center justify-between pb-6 border-b border-[#4a453e]">
        <div className="flex items-center gap-4">
          <span className="text-[11px] font-semibold tracking-[0.25em] text-[#d49653] uppercase">
            CHAPTER PRESENTATION
          </span>
          <span className="text-xs text-[#9c9386]">·</span>
          <span className="font-serif text-lg text-[#e6ded1] tracking-wide truncate max-w-md">
            {project.title}
          </span>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-xs font-mono tracking-widest text-[#b6ab9c]">
            SLIDE 0{currentSlide + 1} / 0{totalSlides}
          </div>
          <button
            onClick={onClose}
            className="bg-[#2c2a26] hover:bg-[#3d3a35] text-[#d8cbb8] px-4 py-2 text-xs font-semibold tracking-widest uppercase rounded-[2px] transition-all cursor-pointer"
          >
            ✕ Exit (ESC)
          </button>
        </div>
      </div>

      {/* Slide Content Arena */}
      <div className="flex-1 my-8 flex items-center justify-center overflow-hidden">
        {/* Slide 0: Title & Manuscript Excerpt */}
        {currentSlide === 0 && (
          <div className="max-w-4xl w-full text-center flex flex-col items-center justify-center p-8 bg-[#292622]/60 border border-[#4a453e] rounded-[3px]">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d49653] mb-4">
              PROLOGUE & MANUSCRIPT
            </span>
            <h2 className="font-serif text-5xl md:text-7xl font-light text-[#f0e8db] mb-6">
              {project.title}
            </h2>
            <div className="inline-block px-4 py-1.5 bg-[#d49653]/15 text-[#d49653] text-xs font-semibold tracking-widest uppercase rounded-[2px] mb-8">
              STYLE · {project.style || 'Ink & Wash'}
            </div>
            <div className="max-w-2xl text-[#b6ab9c] font-serif text-base md:text-lg leading-relaxed italic line-clamp-6 bg-[#1f1d1a]/80 p-6 border border-[#4a453e]/60 rounded-[2px]">
              &ldquo;{project.bookText.slice(0, 450)}...&rdquo;
            </div>
          </div>
        )}

        {/* Slide 1: Dramatis Personae */}
        {currentSlide === 1 && (
          <div className="max-w-5xl w-full flex flex-col p-8 bg-[#292622]/60 border border-[#4a453e] rounded-[3px]">
            <div className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d49653] mb-6 text-center">
              DRAMATIS PERSONAE · PRINCIPAL CAST
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
              {project.characters.length > 0 ? (
                project.characters.map((c) => (
                  <div key={c.id} className="flex gap-6 items-center p-6 bg-[#1f1d1a]/90 border border-[#4a453e] rounded-[2px]">
                    {c.portraitUrl ? (
                      <img src={c.portraitUrl} alt={c.name} className="w-28 h-28 object-cover rounded-[2px] border border-[#d49653]/40 shadow-md" />
                    ) : (
                      <div className="w-28 h-28 bg-[#3d3a35] flex items-center justify-center font-serif text-3xl text-[#d49653] border border-[#4a453e]">
                        {c.name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1">
                      <h3 className="font-serif text-2xl text-[#f0e8db] mb-1">{c.name}</h3>
                      <p className="text-xs text-[#b6ab9c] mb-3">{c.description || 'Adult cast member'}</p>
                      <p className="text-[11px] font-mono text-[#8a8174] bg-[#292622] p-2 rounded-[2px] line-clamp-2">
                        {c.prompt}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="col-span-2 text-center py-12 text-[#978e81] font-serif text-lg">
                  Cast portraits pending formulation in Step 02 & 03
                </div>
              )}
            </div>
          </div>
        )}

        {/* Slide 2: Key Scene Formulation */}
        {currentSlide === 2 && (
          <div className="max-w-4xl w-full text-center flex flex-col items-center justify-center p-8 bg-[#292622]/60 border border-[#4a453e] rounded-[3px]">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[#d49653] mb-4">
              ILLUSTRATED CHAPTER SCENE
            </span>
            <h2 className="font-serif text-4xl md:text-5xl font-light text-[#f0e8db] mb-6">
              {currentChapter?.name || 'Chapter Scene Formulation'}
            </h2>
            <div className="max-w-2xl text-base md:text-xl font-serif text-[#d8cbb8] italic leading-relaxed bg-[#1f1d1a]/90 p-8 border border-[#d49653]/30 rounded-[2px] mb-6 shadow-inner">
              &ldquo;{currentChapter?.prompt || 'Key dramatic scene will be formulated in Step 04.'}&rdquo;
            </div>
            {currentChapter?.characters && (
              <div className="flex items-center gap-3">
                <span className="text-xs uppercase tracking-widest text-[#978e81]">Featuring:</span>
                <div className="flex gap-2">
                  {currentChapter.characters.map((name) => (
                    <span key={name} className="px-3 py-1 bg-[#d49653]/15 text-[#d49653] font-semibold text-xs rounded-[2px]">
                      {name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Slide 3: Full Masterwork Composition Plate */}
        {currentSlide === 3 && (
          <div className="max-w-6xl w-full h-full flex flex-col items-center justify-center p-4">
            <div className="relative max-h-[75vh] aspect-[16/10] w-full border-2 border-[#d49653]/50 shadow-2xl overflow-hidden rounded-[2px] bg-black">
              {currentChapter?.illustrationUrl ? (
                <img
                  src={currentChapter.illustrationUrl}
                  alt={currentChapter.name}
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-center p-12">
                  <div className="font-serif text-3xl text-[#b6ab9c]">
                    Plate Render Pending ({project.style || 'Ink & Wash'})
                  </div>
                </div>
              )}
              <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-6 flex justify-between items-end">
                <div>
                  <div className="text-[10px] tracking-widest text-[#d49653] uppercase font-semibold mb-1 truncate max-w-md">
                    {project.title}
                  </div>
                  <div className="font-serif text-2xl text-[#f0e8db]">
                    {currentChapter?.name || project.title}
                  </div>
                </div>
                <div className="text-xs tracking-widest uppercase font-mono text-[#b6ab9c]">
                  {project.style || 'Art Style'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Slide 4: Side-by-Side Reading Spread */}
        {currentSlide === 4 && (
          <div className="max-w-6xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 items-center p-6 bg-[#292622]/60 border border-[#4a453e] rounded-[3px] max-h-[78vh] overflow-hidden">
            <div className="aspect-[4/3] border border-[#b6ab9c]/40 overflow-hidden rounded-[2px] bg-black">
              {currentChapter?.illustrationUrl ? (
                <img
                  src={currentChapter.illustrationUrl}
                  alt={currentChapter.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="flex items-center justify-center h-full text-[#978e81] font-serif">
                  Illustration Plate
                </div>
              )}
            </div>
            <div className="flex flex-col justify-between h-full max-h-[60vh] overflow-y-auto pr-3">
              <div>
                <span className="text-[10px] tracking-[0.2em] font-semibold text-[#d49653] uppercase">
                  READING EDITION
                </span>
                <h3 className="font-serif text-3xl text-[#f0e8db] mt-1 mb-4">
                  {currentChapter?.name || project.title}
                </h3>
                <p className="font-serif text-base text-[#d8cbb8] leading-relaxed whitespace-pre-line">
                  {project.bookText}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Controls & Progress */}
      <div className="flex items-center justify-between pt-6 border-t border-[#4a453e]">
        <button
          onClick={prevSlide}
          disabled={currentSlide === 0}
          className="bg-[#2c2a26] hover:bg-[#3d3a35] disabled:opacity-30 disabled:cursor-not-allowed text-[#d8cbb8] px-6 py-3 text-xs font-semibold tracking-widest uppercase rounded-[2px] transition-all cursor-pointer flex items-center gap-2"
        >
          <span>←</span>
          <span>Previous</span>
        </button>

        {/* Dot indicators */}
        <div className="flex items-center gap-3">
          {Array.from({ length: totalSlides }).map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentSlide(i)}
              className={`h-2.5 rounded-full transition-all cursor-pointer ${
                i === currentSlide ? 'w-8 bg-[#d49653]' : 'w-2.5 bg-[#4a453e] hover:bg-[#8a8174]'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          disabled={currentSlide === totalSlides - 1}
          className="bg-[#d49653] hover:bg-[#c38542] disabled:opacity-30 disabled:cursor-not-allowed text-[#292622] px-6 py-3 text-xs font-semibold tracking-widest uppercase rounded-[2px] transition-all cursor-pointer flex items-center gap-2"
        >
          <span>Next</span>
          <span>→</span>
        </button>
      </div>
    </div>
  );
};
