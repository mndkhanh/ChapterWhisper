import React from 'react';

interface LoginScreenProps {
  name: string;
  email: string;
  onNameChange: (val: string) => void;
  onEmailChange: (val: string) => void;
  onSubmit: (e?: React.FormEvent) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  name,
  email,
  onNameChange,
  onEmailChange,
  onSubmit,
}) => (
  <div className="min-h-screen bg-[#292622] text-[#d8cbb8] grid grid-cols-1 lg:grid-cols-[1.2fr_0.8fr]">
    {/* Left Branding Showcase */}
    <div className="p-12 md:p-20 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#d8cbb8]/15 relative overflow-hidden">
      <div className="flex items-center gap-3.5">
        <div className="w-8 h-8 border border-[#d8cbb8] flex items-center justify-center font-serif text-base tracking-widest font-light">
          CW
        </div>
        <span className="text-[11px] tracking-[0.25em] font-semibold text-[#d8cbb8]">CHAPTERWHISPER</span>
      </div>

      <div className="my-16 max-w-xl">
        <div className="text-[11px] tracking-[0.25em] text-[#d49653] font-semibold mb-6 uppercase flex items-center gap-2">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d49653]" />
          An AI Atelier for Illustrated Books
        </div>
        <h1 className="font-serif font-light uppercase text-6xl md:text-8xl lg:text-9xl leading-[0.85] tracking-tight text-[#d8cbb8] m-0">
          Chapter<br />
          <span className="italic font-normal">Whisper</span>
        </h1>
        <p className="mt-8 text-sm md:text-base leading-relaxed text-[#b6ab9c] font-light max-w-md">
          Advance your manuscript through five deliberate stages: style, cast, portraits, scene, and composition plate — rendering literary artworks worthy of a first edition.
        </p>
      </div>

      {/* Marquee Footnote */}
      <div className="overflow-hidden whitespace-nowrap border-t border-[#d8cbb8]/15 pt-6">
        <div className="animate-marquee font-serif font-light text-xl tracking-widest text-[#978e81]">
          <span>INK & WASH &nbsp;·&nbsp; GOLDEN-AGE OIL &nbsp;·&nbsp; ETCHING &nbsp;·&nbsp; WOODCUT &nbsp;·&nbsp; STORYBOOK &nbsp;·&nbsp; INK & WASH &nbsp;·&nbsp; GOLDEN-AGE OIL &nbsp;·&nbsp; </span>
          <span>INK & WASH &nbsp;·&nbsp; GOLDEN-AGE OIL &nbsp;·&nbsp; ETCHING &nbsp;·&nbsp; WOODCUT &nbsp;·&nbsp; STORYBOOK &nbsp;·&nbsp; INK & WASH &nbsp;·&nbsp; GOLDEN-AGE OIL &nbsp;·&nbsp; </span>
        </div>
      </div>
    </div>

    {/* Right Form Card */}
    <div className="p-12 md:p-20 flex flex-col justify-center bg-[#292622]/95">
      <div className="max-w-md w-full mx-auto">
        <div className="text-[11px] tracking-[0.25em] text-[#d49653] font-semibold mb-3 uppercase">Enter The Atelier</div>
        <h2 className="font-serif font-light uppercase text-4xl md:text-5xl leading-tight tracking-tight mb-3 text-[#d8cbb8]">Sign In</h2>
        <p className="text-xs text-[#978e81] mb-10 leading-relaxed">
          Passwordless. A recognized email restores your library — a new email inaugurates one.
        </p>

        <form onSubmit={onSubmit} className="flex flex-col gap-6">
          <div>
            <label className="block text-[11px] tracking-[0.2em] text-[#b6ab9c] font-semibold mb-2.5 uppercase">Author Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => onNameChange(e.target.value)}
              placeholder="Evelyn Thorne"
              className="w-full bg-[#24211e] border border-[#b6ab9c]/30 rounded-[2px] px-4 py-3.5 text-sm text-[#d8cbb8] focus:border-[#d49653] transition-colors outline-none placeholder:text-[#615b53]"
              required
            />
          </div>

          <div>
            <label className="block text-[11px] tracking-[0.2em] text-[#b6ab9c] font-semibold mb-2.5 uppercase">Email Address</label>
            <input
              type="email"
              value={email}
              onChange={(e) => onEmailChange(e.target.value)}
              placeholder="evelyn@atelier.co"
              className="w-full bg-[#24211e] border border-[#b6ab9c]/30 rounded-[2px] px-4 py-3.5 text-sm text-[#d8cbb8] focus:border-[#d49653] transition-colors outline-none placeholder:text-[#615b53]"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full mt-3 bg-[#d8cbb8] text-[#292622] hover:bg-[#d49653] hover:text-[#292622] transition-colors rounded-[2px] py-4 text-xs font-semibold tracking-[0.2em] uppercase cursor-pointer shadow-lg"
          >
            Enter the Atelier →
          </button>
        </form>

        <div className="mt-10 pt-6 border-t border-[#d8cbb8]/10 text-[11px] text-[#615b53] tracking-wide text-center">
          Single transmission · httpOnly cookie session · Zero data leak
        </div>
      </div>
    </div>
  </div>
);

