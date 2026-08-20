import React, { useState, useEffect, useRef } from 'react';
import type { User, Project, StepStatus } from './types.js';

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

export function App() {
  const [screen, setScreen] = useState<'login' | 'projects' | 'new' | 'pipeline' | 'result'>('login');
  const [user, setUser] = useState<User | null>(null);
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');

  const [projects, setProjects] = useState<Project[]>(() => {
    const saved = localStorage.getItem('cw_projects');
    if (saved) {
      try { return JSON.parse(saved); } catch {}
    }
    return [
      {
        id: 'p1',
        title: 'The Whisperwood Codex',
        bookText: 'A wizarding-school tale of alchemy and shadows...',
        wordCount: 41200,
        style: 'Ink & Wash',
        chapterIndex: 0,
        statuses: ['done', 'done', 'done', 'done', 'done'],
        characters: [
          { id: 'c1', name: 'Prof. Adelaide Crane', description: 'Elder alchemist in velvet robes', prompt: 'Portrait of Prof. Adelaide Crane' },
          { id: 'c2', name: 'Silas Vane', description: 'Curator of forbidden manuscripts', prompt: 'Portrait of Silas Vane' },
        ],
        chapters: [
          { id: 'ch1', name: 'I. The Letter Beneath the Door', prompt: 'Adelaide finding the letter', characters: ['Prof. Adelaide Crane'] },
        ],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
  });

  const [activeId, setActiveId] = useState<string | null>(null);
  const [stepIndex, setStepIndex] = useState(0);
  const [npTitle, setNpTitle] = useState('');
  const [npText, setNpText] = useState('');
  const [uploadHint, setUploadHint] = useState('accepts a single .txt manuscript');
  const [toast, setToast] = useState<string | null>(null);
  const [customStyle, setCustomStyle] = useState('');
  const toastTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    const savedUser = localStorage.getItem('cw_user');
    if (savedUser) {
      try {
        const u = JSON.parse(savedUser);
        setUser(u);
        setScreen('projects');
      } catch {}
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('cw_projects', JSON.stringify(projects));
  }, [projects]);

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToast(null), 3500);
  };

  const handleLogin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginName.trim() || !loginEmail.trim()) {
      showToast('Please enter both name and email');
      return;
    }
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: loginName.trim(), email: loginEmail.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setUser(data.user);
        localStorage.setItem('cw_user', JSON.stringify(data.user));
        setScreen('projects');
        showToast('Signed in successfully');
      } else {
        const u: User = { id: 'u_' + Date.now(), name: loginName.trim(), email: loginEmail.trim(), createdAt: new Date().toISOString() };
        setUser(u);
        localStorage.setItem('cw_user', JSON.stringify(u));
        setScreen('projects');
      }
    } catch {
      const u: User = { id: 'u_' + Date.now(), name: loginName.trim(), email: loginEmail.trim(), createdAt: new Date().toISOString() };
      setUser(u);
      localStorage.setItem('cw_user', JSON.stringify(u));
      setScreen('projects');
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('cw_user');
    setActiveId(null);
    setScreen('login');
    showToast('Signed out');
  };

  const handleCreateProject = () => {
    if (!npTitle.trim()) {
      showToast('Please provide a title');
      return;
    }
    const id = 'p' + Date.now();
    const newProj: Project = {
      id,
      title: npTitle.trim(),
      bookText: npText.trim() || 'Sample manuscript content...',
      wordCount: npText.trim() ? npText.trim().split(/\s+/).length : 5000,
      style: null,
      chapterIndex: null,
      statuses: ['ready', 'locked', 'locked', 'locked', 'locked'],
      characters: [
        { id: 'c1', name: 'Prof. Adelaide Crane', description: 'Adult · principal alchemist', prompt: 'Close-up portrait of Prof. Adelaide Crane' },
        { id: 'c2', name: 'Silas Vane', description: 'Adult · scholar of ancient seals', prompt: 'Close-up portrait of Silas Vane' },
      ],
      chapters: [
        { id: 'ch1', name: 'I. The Letter Beneath the Door', prompt: 'Scene illustrating the discovery of the seal', characters: ['Prof. Adelaide Crane', 'Silas Vane'] },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setProjects([newProj, ...projects]);
    setActiveId(id);
    setStepIndex(0);
    setScreen('pipeline');
    showToast('Manuscript project created');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = ev.target?.result as string;
        setNpText(text);
        setUploadHint(`${file.name} · ${text.split(/\s+/).length.toLocaleString()} words loaded`);
        showToast('Manuscript file loaded');
      };
      reader.readAsText(file);
    }
  };

  const activeProject = projects.find((p) => p.id === activeId) || projects[0];

  const updateActiveProject = (updater: (p: Project) => void) => {
    setProjects((prev) =>
      prev.map((p) => {
        if (p.id === activeId) {
          const clone = { ...p, statuses: [...p.statuses] };
          updater(clone);
          clone.updatedAt = new Date().toISOString();
          return clone;
        }
        return p;
      })
    );
  };

  const openProject = (id: string) => {
    setActiveId(id);
    const p = projects.find((x) => x.id === id);
    if (p) {
      let idx = p.statuses.indexOf('ready');
      if (idx === -1) idx = p.statuses.lastIndexOf('done');
      if (idx === -1) idx = 0;
      setStepIndex(idx);
    }
    setScreen('pipeline');
  };

  const runCurrentStep = () => {
    if (!activeProject) return;
    const currentStatus = activeProject.statuses[stepIndex];
    if (currentStatus === 'running') {
      showToast('409 Conflict · step is already in progress');
      return;
    }
    if (currentStatus === 'locked') {
      showToast('Complete preceding step first');
      return;
    }
    if (stepIndex === 0 && !activeProject.style) {
      showToast('Please select or specify an art style');
      return;
    }

    updateActiveProject((p) => {
      p.statuses[stepIndex] = 'running';
    });

    window.setTimeout(() => {
      updateActiveProject((p) => {
        p.statuses[stepIndex] = 'done';
        if (stepIndex < 4 && p.statuses[stepIndex + 1] === 'locked') {
          p.statuses[stepIndex + 1] = 'ready';
        }
      });
      showToast(`${META[stepIndex].title} complete`);
    }, 1800);
  };

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
    <div className="min-h-screen bg-[#d8cbb8] text-[#2c2c2c] font-sans selection:bg-[#d49653] selection:text-[#292622]">
      {/* ============ LOGIN SCREEN ============ */}
      {screen === 'login' && (
        <div className="min-h-screen bg-[#292622] text-[#d8cbb8] grid grid-cols-1 md:grid-cols-[1.15fr_0.85fr]">
          <div className="p-12 md:p-16 flex flex-col justify-between border-b md:border-b-0 md:border-r border-[#d8cbb8]/20">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 border border-[#d8cbb8] flex items-center justify-center font-serif text-lg">CW</div>
              <span className="text-xs tracking-[0.18em] font-medium">CHAPTERWHISPER</span>
            </div>
            <div className="my-12">
              <div className="text-xs tracking-[0.2em] text-[#d49653] font-medium mb-6 uppercase">An AI Atelier for Illustrated Books</div>
              <h1 className="font-serif font-light uppercase text-7xl md:text-9xl leading-[0.82] tracking-tighter text-[#d8cbb8] m-0">
                Chapter<br />Whisper
              </h1>
              <p className="max-w-md mt-8 text-sm md:text-base leading-relaxed text-[#b6ab9c]">
                Paste a manuscript. Advance it through five deliberate steps — style, cast, portraits, scene, plate — and watch a single chapter become an illustration worthy of a first edition.
              </p>
            </div>
            <div className="overflow-hidden whitespace-nowrap border-t border-[#d8cbb8]/20 pt-6">
              <div className="inline-block font-serif font-light text-2xl text-[#978e81]">
                <span>INK & WASH &nbsp;·&nbsp; GOLDEN-AGE OIL &nbsp;·&nbsp; ETCHING &nbsp;·&nbsp; WOODCUT &nbsp;·&nbsp; STORYBOOK &nbsp;·&nbsp; </span>
              </div>
            </div>
          </div>

          <div className="p-12 md:p-16 flex flex-col justify-center bg-[#292622]">
            <div className="text-xs tracking-[0.2em] text-[#978e81] font-medium mb-3 uppercase">Enter The Atelier</div>
            <h2 className="font-serif font-light uppercase text-4xl leading-tight tracking-tight mb-2 text-[#d8cbb8]">Sign In</h2>
            <p className="text-xs text-[#978e81] mb-8 leading-relaxed">
              No password. Your email loads your library — a new email begins one.
            </p>

            <form onSubmit={handleLogin} className="flex flex-col gap-5">
              <div>
                <label className="block text-xs tracking-widest text-[#b6ab9c] font-medium mb-2 uppercase">Name</label>
                <input
                  type="text"
                  value={loginName}
                  onChange={(e) => setLoginName(e.target.value)}
                  placeholder="Evelyn Thorne"
                  className="w-full bg-transparent border border-[#b6ab9c]/40 rounded-[3px] p-3 text-sm text-[#d8cbb8] focus:border-[#d49653] outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs tracking-widest text-[#b6ab9c] font-medium mb-2 uppercase">Email</label>
                <input
                  type="email"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  placeholder="evelyn@atelier.co"
                  className="w-full bg-transparent border border-[#b6ab9c]/40 rounded-[3px] p-3 text-sm text-[#d8cbb8] focus:border-[#d49653] outline-none"
                  required
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-[#d8cbb8] text-[#292622] hover:bg-[#d49653] transition-colors rounded-[3px] py-4 text-xs font-semibold tracking-widest uppercase cursor-pointer"
              >
                Enter the Atelier →
              </button>
            </form>
            <p className="text-xs text-[#978e81] mt-6">Passwordless · email + name only · projects saved locally</p>
          </div>
        </div>
      )}

      {/* ============ MAIN APPLICATION ============ */}
      {screen !== 'login' && (
        <div>
          {/* Global Header */}
          <header className="sticky top-0 z-30 flex items-center justify-between px-8 py-5 bg-[#d8cbb8]/90 backdrop-blur border-b border-[#b6ab9c]">
            <div className="flex items-center gap-9">
              <div onClick={() => setScreen('projects')} className="flex items-center gap-3 cursor-pointer">
                <div className="w-7 h-7 border border-[#2c2c2c] flex items-center justify-center font-serif text-sm font-bold">CW</div>
                <span className="text-xs tracking-widest font-semibold">CHAPTERWHISPER</span>
              </div>
              <nav className="flex gap-6">
                <button
                  onClick={() => setScreen('projects')}
                  className={`text-xs font-semibold uppercase tracking-wider ${screen === 'projects' ? 'text-[#d49653]' : 'text-[#2c2c2c]'}`}
                >
                  Library
                </button>
                <button
                  onClick={() => { setScreen('new'); setNpTitle(''); setNpText(''); }}
                  className={`text-xs font-semibold uppercase tracking-wider ${screen === 'new' ? 'text-[#d49653]' : 'text-[#2c2c2c]'}`}
                >
                  New Chapter
                </button>
              </nav>
            </div>
            <div className="flex items-center gap-6">
              <span className="text-xs tracking-wider text-[#615b53]">{user?.email || user?.name}</span>
              <button
                onClick={handleLogout}
                className="text-xs font-semibold uppercase tracking-wider text-[#978e81] hover:text-[#2c2c2c]"
              >
                Sign Out
              </button>
            </div>
          </header>

          {/* Library View */}
          {screen === 'projects' && (
            <main className="max-w-6xl mx-auto px-8 py-14">
              <div className="text-xs tracking-[0.2em] text-[#978e81] font-semibold uppercase mb-4">
                SIGNED IN · {user?.email}
              </div>
              <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-9 border-b border-[#b6ab9c]">
                <h1 className="font-serif font-light uppercase text-6xl md:text-8xl tracking-tight m-0">Your Library</h1>
                <button
                  onClick={() => { setScreen('new'); setNpTitle(''); setNpText(''); }}
                  className="self-start md:self-auto border border-[#2c2c2c] hover:bg-[#2c2c2c] hover:text-[#d8cbb8] transition-colors rounded-[3px] px-6 py-4 text-xs font-semibold tracking-wider uppercase"
                >
                  Begin a New Chapter
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-0 border-l border-[#b6ab9c] mt-8">
                {projects.map((p) => {
                  const doneCount = p.statuses.filter((x) => x === 'done').length;
                  const pct = `${(doneCount / 5) * 100}%`;
                  return (
                    <div
                      key={p.id}
                      onClick={() => openProject(p.id)}
                      className="border-r border-b border-[#b6ab9c] p-8 flex flex-col justify-between min-h-[260px] bg-[#d8cbb8] hover:bg-[#bfb4a3]/40 transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="flex items-center justify-between text-xs font-medium tracking-wider mb-6">
                          <span className="text-[#978e81] uppercase">{p.style || 'STYLE PENDING'}</span>
                          <span className={doneCount === 5 ? 'text-[#d49653]' : 'text-[#615b53]'}>
                            {doneCount === 5 ? 'COMPLETE' : doneCount > 0 ? 'IN PROGRESS' : 'NOT STARTED'}
                          </span>
                        </div>
                        <h3 className="font-serif font-light uppercase text-3xl leading-tight mb-2">{p.title}</h3>
                        <p className="text-xs text-[#615b53]">{p.wordCount.toLocaleString()} words · {p.chapters.length} chapter</p>
                      </div>

                      <div className="mt-8">
                        <div className="h-0.5 bg-[#b6ab9c] w-full relative mb-3">
                          <div className="absolute top-0 left-0 bottom-0 bg-[#d49653]" style={{ width: pct }} />
                        </div>
                        <div className="flex items-center justify-between text-xs font-medium">
                          <span className="text-[#978e81]">{doneCount} / 5 plates</span>
                          <span className="uppercase tracking-wider font-semibold">Open →</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </main>
          )}

          {/* New Project View */}
          {screen === 'new' && (
            <main className="max-w-6xl mx-auto px-8 py-14">
              <div className="text-xs tracking-[0.2em] text-[#978e81] font-semibold uppercase mb-4">Commit a Manuscript</div>
              <h1 className="font-serif font-light uppercase text-6xl md:text-8xl tracking-tight mb-10">A New Chapter</h1>

              <div className="grid grid-cols-1 lg:grid-cols-[1.4fr_0.6fr] gap-16">
                <div>
                  <div className="mb-6">
                    <label className="block text-xs tracking-wider text-[#615b53] font-semibold mb-2 uppercase">Project Title</label>
                    <input
                      type="text"
                      value={npTitle}
                      onChange={(e) => setNpTitle(e.target.value)}
                      placeholder="The Whispering Almanac"
                      className="w-full bg-transparent border border-[#b6ab9c] rounded-[3px] p-3.5 text-sm text-[#2c2c2c] focus:border-[#d49653] outline-none"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-xs tracking-wider text-[#615b53] font-semibold mb-2 uppercase">Paste the Text</label>
                    <textarea
                      value={npText}
                      onChange={(e) => setNpText(e.target.value)}
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
                    <input type="file" accept=".txt" onChange={handleFileUpload} className="hidden" />
                    <div className="font-serif font-light text-2xl mb-1">Drop or select a .txt file</div>
                    <div className="text-xs text-[#978e81]">{uploadHint}</div>
                  </label>

                  <button
                    onClick={handleCreateProject}
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
          )}

          {/* Pipeline Studio View */}
          {screen === 'pipeline' && activeProject && (
            <main className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 md:grid-cols-[270px_1fr] gap-14 items-start">
              {/* Vertical Stepper Rail */}
              <div className="sticky top-24">
                <div className="text-xs tracking-widest text-[#978e81] font-medium uppercase mb-1">
                  {activeProject.style || 'STYLE PENDING'}
                </div>
                <h2 className="font-serif font-light uppercase text-2xl tracking-tight mb-6">{activeProject.title}</h2>

                <div className="flex flex-col">
                  {activeProject.statuses.map((status, idx) => {
                    const sm = statusMeta(status);
                    const isCurrent = idx === stepIndex;
                    return (
                      <div
                        key={idx}
                        onClick={() => {
                          if (status !== 'locked') setStepIndex(idx);
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
                        const selected = activeProject.style === st.name;
                        return (
                          <div
                            key={st.id}
                            onClick={() => updateActiveProject((p) => { p.style = st.name; })}
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
                          onChange={(e) => setCustomStyle(e.target.value)}
                          placeholder="e.g. Victorian watercolor with deep umber shadows..."
                          className="flex-1 bg-transparent border border-[#b6ab9c] rounded-[3px] px-3.5 py-2 text-sm outline-none"
                        />
                        <button
                          onClick={() => {
                            if (customStyle.trim()) {
                              updateActiveProject((p) => { p.style = customStyle.trim(); });
                              showToast(`Custom style selected: ${customStyle.trim()}`);
                            }
                          }}
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
                      {activeProject.characters.slice(0, 2).map((c, i) => (
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
                    {activeProject.characters.slice(0, 2).map((c, i) => (
                      <div key={c.id || i}>
                        <div className="aspect-[3/4] bg-[#a7a49d] border border-[#b6ab9c] flex flex-col justify-end p-5 relative overflow-hidden">
                          {activeProject.statuses[2] === 'running' && (
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                          )}
                          <div className="text-xs font-semibold uppercase text-[#292622]">
                            {activeProject.statuses[2] === 'done' ? 'PORTRAIT PLATE' : activeProject.statuses[2] === 'running' ? 'RENDERING...' : 'AWAITING RENDER'}
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
                        const selected = activeProject.chapterIndex === i;
                        return (
                          <div
                            key={i}
                            onClick={() => updateActiveProject((p) => { p.chapterIndex = i; })}
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
                    {activeProject.statuses[4] === 'running' && (
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse" />
                    )}
                    <div className="text-xs font-semibold uppercase text-[#292622]">
                      {activeProject.statuses[4] === 'done' ? 'COMPOSED FINAL PLATE' : activeProject.statuses[4] === 'running' ? 'COMPOSING PLATE...' : 'AWAITING COMPOSITION'}
                    </div>
                    <div className="font-serif text-3xl text-[#292622] mt-1">
                      {SAMPLE_CHAPTERS[activeProject.chapterIndex ?? 0]}
                    </div>
                  </div>
                )}

                {/* Actions & Feedback Footer */}
                <div className="flex items-center gap-4 mt-10 flex-wrap">
                  <button
                    onClick={runCurrentStep}
                    disabled={activeProject.statuses[stepIndex] === 'running'}
                    className="bg-[#2c2c2c] hover:bg-[#292622] text-[#d8cbb8] rounded-[3px] px-8 py-4 text-xs font-semibold tracking-wider uppercase cursor-pointer disabled:opacity-75"
                  >
                    {activeProject.statuses[stepIndex] === 'running'
                      ? 'Generating...'
                      : activeProject.statuses[stepIndex] === 'done'
                      ? 'Regenerate Step'
                      : 'Generate Step'}
                  </button>

                  {activeProject.statuses[stepIndex] === 'done' && stepIndex < 4 && (
                    <button
                      onClick={() => setStepIndex(stepIndex + 1)}
                      className="bg-[#2c2c2c] text-[#d8cbb8] rounded-[3px] px-8 py-4 text-xs font-semibold tracking-wider uppercase cursor-pointer"
                    >
                      Next Step →
                    </button>
                  )}

                  {activeProject.statuses[4] === 'done' && stepIndex === 4 && (
                    <button
                      onClick={() => setScreen('result')}
                      className="bg-[#d49653] text-[#292622] rounded-[3px] px-8 py-4 text-xs font-semibold tracking-wider uppercase cursor-pointer"
                    >
                      View the Plate →
                    </button>
                  )}

                  {stepIndex > 0 && (
                    <button
                      onClick={() => setStepIndex(stepIndex - 1)}
                      className="text-xs font-semibold tracking-wider uppercase text-[#978e81] hover:text-[#2c2c2c] px-4 py-4"
                    >
                      ← Back
                    </button>
                  )}
                </div>
              </div>
            </main>
          )}

          {/* Result View */}
          {screen === 'result' && activeProject && (
            <main className="max-w-7xl mx-auto px-8 py-14">
              <div className="text-xs tracking-[0.2em] text-[#d49653] font-semibold uppercase mb-3">Chapter Illustrated</div>
              <h1 className="font-serif font-light uppercase text-6xl md:text-7xl tracking-tight mb-10">{activeProject.title}</h1>

              <div className="grid grid-cols-1 lg:grid-cols-[1.55fr_0.45fr] gap-12 items-start">
                <div className="aspect-[16/11] bg-[#a7a49d] border border-[#b6ab9c] flex flex-col justify-end p-8">
                  <div className="text-xs font-semibold uppercase text-[#292622]">FINAL COMPOSITION PLATE</div>
                  <div className="font-serif text-3xl text-[#292622]">
                    {SAMPLE_CHAPTERS[activeProject.chapterIndex ?? 0]} · {activeProject.style}
                  </div>
                </div>

                <aside className="flex flex-col gap-6">
                  <div className="border-t border-[#2c2c2c] pt-4">
                    <div className="text-xs font-semibold text-[#978e81] uppercase tracking-wider mb-1">Art Style</div>
                    <div className="font-serif text-2xl">{activeProject.style || 'Ink & Wash'}</div>
                  </div>

                  <div className="border-t border-[#b6ab9c] pt-4">
                    <div className="text-xs font-semibold text-[#978e81] uppercase tracking-wider mb-1">Cast</div>
                    <div className="font-serif text-xl leading-snug">
                      {activeProject.characters.map((c) => c.name).join(' & ')}
                    </div>
                  </div>

                  <div className="border-t border-[#b6ab9c] pt-4">
                    <div className="text-xs font-semibold text-[#978e81] uppercase tracking-wider mb-1">Chapter</div>
                    <div className="font-serif text-xl leading-snug">
                      {SAMPLE_CHAPTERS[activeProject.chapterIndex ?? 0]}
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 mt-4">
                    <button
                      onClick={() => setScreen('pipeline')}
                      className="bg-[#2c2c2c] text-[#d8cbb8] rounded-[3px] py-4 text-xs font-semibold tracking-wider uppercase"
                    >
                      Back to Pipeline
                    </button>
                    <button
                      onClick={() => setScreen('projects')}
                      className="border border-[#2c2c2c] text-[#2c2c2c] rounded-[3px] py-4 text-xs font-semibold tracking-wider uppercase"
                    >
                      Return to Library
                    </button>
                  </div>
                </aside>
              </div>
            </main>
          )}
        </div>
      )}

      {/* Floating Toast Notification */}
      {toast && (
        <div className="fixed bottom-7 left-1/2 -translate-x-1/2 z-50 bg-[#292622] text-[#d8cbb8] border border-[#d49653] rounded-[3px] px-6 py-3.5 text-xs tracking-wider shadow-lg">
          {toast}
        </div>
      )}
    </div>
  );
}

export default App;
