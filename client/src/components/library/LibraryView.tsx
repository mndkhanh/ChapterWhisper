import React, { useState } from "react";
import type { User, Project } from "../../types.js";
import { SlidePresentationModal } from "../presentation/SlidePresentationModal.js";

interface LibraryViewProps {
  user: User | null;
  projects: Project[];
  /** True while the first `GET /api/projects` is still in flight. */
  loading?: boolean;
  onOpenProject: (id: string) => void;
  onNewProject: () => void;
}

export const LibraryView: React.FC<LibraryViewProps> = ({
  user,
  projects,
  loading = false,
  onOpenProject,
  onNewProject,
}) => {
  const [presentingProject, setPresentingProject] = useState<Project | null>(
    null,
  );

  return (
    <main className="max-w-6xl mx-auto px-8 py-16">
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

      {/* Loading — the shelf is fetched, so say so rather than showing a void. */}
      {loading && projects.length === 0 && (
        <div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10"
          aria-hidden="true"
        >
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="border border-[#b6ab9c] p-6 md:p-8 min-h-[300px] flex flex-col justify-between"
            >
              <div>
                <div className="skeleton h-4 w-20 mb-6 rounded-[2px]" />
                <div className="skeleton h-8 w-4/5 mb-3 rounded-[2px]" />
                <div className="skeleton h-3 w-2/3 rounded-[2px]" />
              </div>
              <div className="skeleton h-1 w-full rounded-full" />
            </div>
          ))}
        </div>
      )}
      {loading && projects.length === 0 && (
        <p className="sr-only" role="status">
          Loading your library…
        </p>
      )}

      {/* Empty — a first-time author would otherwise see a heading and nothing. */}
      {!loading && projects.length === 0 && (
        <div className="mt-10 border border-dashed border-[#978e81] bg-[#bfb4a3]/15 px-8 py-16 text-center">
          <div className="font-serif font-light text-4xl md:text-5xl text-[#2c2c2c] mb-4">
            The shelf is empty
          </div>
          <p className="text-sm text-[#615b53] max-w-md mx-auto leading-relaxed mb-8">
            Paste a chapter or upload a{" "}
            <span className="font-mono text-xs">.txt</span> manuscript and
            ChapterWhisper will carry it through five steps — style, cast,
            portraits, scene, and the final composition plate.
          </p>
          <button
            onClick={onNewProject}
            className="bg-[#2c2c2c] hover:bg-[#292622] text-[#d8cbb8] hover:text-[#d49653] transition-all rounded-[2px] px-8 py-4 text-xs font-semibold tracking-[0.2em] uppercase cursor-pointer shadow-sm"
          >
            Commit Your First Manuscript →
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-10">
        {projects.map((p) => {
          const doneCount = p.statuses.filter((x) => x === "done").length;
          const pct = `${(doneCount / 5) * 100}%`;
          const illustrationUrl =
            p.chapters[0]?.illustrationUrl ||
            p.chapters.find((ch) => ch.illustrationUrl)?.illustrationUrl;

          return (
            <div
              key={p.id}
              onClick={() => onOpenProject(p.id)}
              className="border border-[#b6ab9c] p-6 md:p-8 flex flex-col justify-between min-h-[300px] bg-[#d8cbb8] hover:bg-[#bfb4a3]/30 hover:border-[#2c2c2c] hover:shadow-lg transition-all cursor-pointer group relative overflow-hidden"
            >
              <div>
                <div className="flex items-center justify-between text-[11px] font-semibold tracking-[0.18em] mb-4">
                  <span
                    className={`px-2 py-0.5 text-[10px] rounded-[2px] ${
                      doneCount === 5
                        ? "bg-[#d49653]/15 text-[#d49653]"
                        : doneCount > 0
                          ? "bg-[#2c2c2c]/10 text-[#2c2c2c]"
                          : "text-[#978e81]"
                    }`}
                  >
                    {doneCount === 5
                      ? "COMPLETE"
                      : doneCount > 0
                        ? `STEP 0${doneCount + 1}`
                        : "INITIAL"}
                  </span>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPresentingProject(p);
                    }}
                    className="bg-[#2c2c2c] hover:bg-[#d49653] text-[#d8cbb8] hover:text-[#292622] px-2.5 py-1 rounded-[2px] text-[10px] uppercase font-semibold tracking-wider transition-all cursor-pointer flex items-center gap-1 shadow-sm"
                    title="Present chapter slide deck"
                  >
                    <span>✦</span>
                    <span>Present Slides</span>
                  </button>
                </div>

                {/* Masterwork Illustration Plate preview for completed chapters */}
                {illustrationUrl && (
                  <div className="mb-4 aspect-[16/10] w-full overflow-hidden rounded-[2px] border border-[#b6ab9c] bg-black relative shadow-sm">
                    <img
                      src={illustrationUrl}
                      alt={p.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                      <span className="text-[10px] font-mono tracking-widest text-[#d8cbb8] uppercase truncate">
                        {p.title}
                      </span>
                    </div>
                  </div>
                )}

                <h3 className="font-serif font-light uppercase text-3xl leading-snug text-[#2c2c2c] mb-2.5 group-hover:text-[#292622]">
                  {p.title}
                </h3>
                <p className="text-xs text-[#615b53] font-light">
                  {p.wordCount.toLocaleString()} words · {p.chapters.length}{" "}
                  chapter · {p.characters.length} cast
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-[#b6ab9c]/50">
                <div className="h-1 bg-[#b6ab9c]/40 w-full relative mb-3 overflow-hidden rounded-full">
                  <div
                    className="absolute top-0 left-0 bottom-0 bg-[#d49653] transition-all duration-500"
                    style={{ width: pct }}
                  />
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

      {presentingProject && (
        <SlidePresentationModal
          project={presentingProject}
          isOpen={Boolean(presentingProject)}
          onClose={() => setPresentingProject(null)}
        />
      )}
    </main>
  );
};
