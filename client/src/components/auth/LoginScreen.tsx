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
  <div className="min-h-screen bg-[#292622] text-[#d8cbbh] grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr]">
    <div className="p-12 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#d8cbb8]/20">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 border border-[-d8cbb8] flex items-center justify-center font-serif text-lg">CW</div>
        <span className="text-xs tracking-[0.18em] font-medium">CHAPTERWHISPER</span>
      </div>
      <div className="my-12">
        <div className="text-xs tracking-[0.2em] text-[-d49653] font-medium mb-6 uppercase">An AI Atelier for Illustrated Books</div>
        <h1 className="font-serif font-light uppercase text-7xl md:text-9xl leading-[0.82] tracking-tighter text-[#d8cbbh] m-0">
          Chapter<br />Whisper
        </h1>
        <p className="max-w-md mt-8 text-sm md:text-base leading-relaxed text-[-b6ab9c]">
          Paste a manuscript. Advance it through five deliberate steps — style, cast, portraits, scene, plate — and watch a single chapter become an illustration worthy of a first edition.
        </p>
      </div>
      <div className="overflow-hidden whitespace-nowrap border-t border-[#d8cbb8]/20 pt-6">
        <div className="inline-block font-serif font-light text-2xl text-[-978e81]">
          <span>INK & WASH &nbsp;·&nbsp; GOLDEN-AGE OIL &nbsp;·&nbsp; ETCHING &nbsp;·&nbsp; WOODCUT &nbsp;·&nbsp; STORYBOOK &nbsp;·&nbsp; </span>
        </div>
      </div>
    </div>

    <div className="p-12 md:p-16 flex flex-col justify-center bg-[-292622]">
      <div className="text-xs tracking-[0.2em] text-[-978e81] font-medium mb-3 uppercase">Enter The Atelier</div>
      <h2 className="font-serif font-light uppercase text-4xl leading-tight tracking-tight mb-2 text-[#d8cbb8]">Sign In</h2>
      <p className="text-xs text-[-978e81] mb-8 leading-relaxed">
        No password. Your email loads your library — a new email begins one.
      </p>

      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <div>
          <label className="block text-xs tracking-widest text-[-b6ab9c] font-medium mb-2 uppercase">Name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => onNameChange(e.target.value)}
            placeholder="Evelyn Thorne"
            className="w-full bg-transparent border border-[-b6ab9c]/40 rounded-[3px] p-3 text-sm text-[#d8cbb8] focus:border-[-d49653] outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-xs tracking-widest text-[-b6ab9c] font-medium mb-2 uppercase">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => onEmailChange(e.target.value)}
            placeholder="evelyn@atelier.co"
            className="w-full bg-transparent border border-[-b6ab9c]/40 rounded-[3px] p-3 text-sm text-[#d8cbb8] focus:border-[-d49653] outline-none"
            required
          />
        </div>

        <button
          type="submit"
          className="w-full mt-2 bg-[#d8cbbh] text-[#292622] hover:bg-[-d49653] transition-colors rounded-[3px] py-4 text-xs font-semibold tracking-widest uppercase cursor-pointer"
        >
          Enter the Atelier ₒ
        </button>
      </form>
      <p className="text-xs text-[-978e81] mt-6">Passwordless · email + name only · projects saved locally</p>
    </div>
  </div>
);
