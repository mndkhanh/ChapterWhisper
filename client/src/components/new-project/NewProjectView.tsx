import React from 'react';

const META = [
  { num: '01', title: 'Art Style', desc: 'Choose the visual language the whole book will inherit.' },
  { num: '02', title: 'Characters', desc: 'Cast the story from the manuscript. Max 2 adults.' },
  { num: '03', title: 'Character Portraits', desc: 'Render each face in the chosen style.' },
  { num: '04', title: 'Chapter Scene', desc: 'Select the single chapter to illustrate.' },
  { num: '05', title: 'Illustration', desc: 'Compose the final plate.' },
];

interface NewProjectViewProps {
  title: string;
  text: string;
  uploadHint: string;
  onTitleChange: (val: string) => void;
  onTextChange: (val: string) => void;
  onFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onCreate: () => void;
}

export const NewProjectView: React.FC<NewProjectViewProps> = ({
  title,
  text,
  uploadHint,
  onTitleChange,
  onTextChange,
  onFileUpload,
  onCreate,
}) => (
  <main className="max-w-6xl mx-auto px-8 py-14">
    <div className="text-xs tracking-[0.2em] text-[#978e81] font-semibold uppercase mb-4">Commit a Manuscript</div>
    <h1 className="font-serif font-light uppercase text-6xl md:text-8xl tracking-tight mb-10">A New Chapter</h1>

    <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-16">
      <div>
        <div className="mb-6">
          <label className="block text-xs tracking-wider text-[#615b53] font-semibold mb-2 uppercase">Project Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => onTitleChange(e.target.value)}
            placeholder="The Whispering Almanac"
            className="w-full bg-transparent border border-[#b6ab9c] rounded-[3px] p-3.5 text-sm text-[#2c2c2c] focus:border-[#d49653] outline-none"
          />
        </div>

        <div className="mb-6">
          <label className="block text-xs tracking-wider text-[#615b53] font-semibold mb-2 uppercase">Paste the Text</label>
          <textarea
            value={text}
            onChange={(e) => onTextChange(e.target.value)}
            placeholder="Paste the full chapter or book text here..."
            className="w-full h-56 bg-transparent border border-[#b6ab9c] rounded-[3px] p-4 text-sm leading-relaxed text-[#2c2c2c] focus:border-[#d49653] outline-none resize-y"
          />
        </div>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-1 h-px bg-[#b6ab9c]" />
          <span className="text-xs tracking-widest text-[#978e81] font-semibold">OR</span>
          <div className="flex-1 h-px bg-[#b6ab9c]" />
        </div>

        <label className="block border border-dashed border-[#978e81] hover:border-[#d49653] transition-colors rounded-[3px] p-8 text-center cursor-pointer bg-[#bfb4a3]/20">
          <input type="file" accept=".txt" onChange={onFileUpload} className="hidden" />
          <div className="font-serif font-light text-2xl mb-1">Drop or select a .txt file</div>
          <div className="text-xs text-[#978e81]">{uploadHint}</div>
        </label>

        <button
          onClick={onCreate}
          className="mt-8 bg-[#2c2c2c] hover:bg-[#292622] text-[#d8cbb8] rounded-[3px] px-8 py-4 text-xs font-semibold tracking-widest uppercase cursor-pointer"
        >
          Begin the Pipeline →
        </button>
      </div>

      <aside className="border-l border-[#b6ab9c] pl-8 flex flex-col gap-6">
        <div className="text-xs tracking-wider text-[#978e81] font-semibold uppercase">Five Steps</div>
        <div className="divide-y divide-[#b6ab9c]">
          {META.map((m) => (
            <div key={m.num} className="py-3.5 flex gap-4">
              <span className="font-serif font-light text-2xl text-[#d49653] leading-none">{m.num}</span>
              <div>
                <div className="text-xs font-semibold">{m.title}</div>
                <div className="text-xs text-[#615b53] mt-1 leading-relaxed">{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-[#978e81] leading-relaxed">
          The manuscript is sent once, then reused across every step. Bounded by server caps: max 2 adult characters and 1 chapter illustration.
        </p>
      </aside>
    </div>
  </main>
);