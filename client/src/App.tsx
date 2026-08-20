import React, { useState, useEffect, useRef } from 'react';
import type { User, Project } from './types.js';
import { Header } from './components/layout/Header.js';
import { LoginScreen } from './components/auth/LoginScreen.js';
import { LibraryView } from './components/library/LibraryView.js';
import { NewProjectView } from './components/new-project/NewProjectView.js';
import { PipelineStudio } from './components/pipeline/PipelineStudio.js';
import { ResultView } from './components/result/ResultView.js';



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
      const STEP_NAMES = ['Art Style', 'Characters', 'Character Portraits', 'Chapter Scene', 'Illustration'];
      showToast(`${STEP_NAMES[stepIndex]} complete`);
    }, 1800);
  };

  return (
    <div className="min-h-screen bg-[#d8cbb8] text-[#2c2c2c] font-sans selection:bg-[#d49653] selection:text-[#292622]">
      {/* 1. Login Feature */}
      {screen === 'login' && (
        <LoginScreen
          name={loginName}
          email={loginEmail}
          onNameChange={setLoginName}
          onEmailChange={setLoginEmail}
          onSubmit={handleLogin}
        />
      )}

      {/* Main Studio Shell */}
      {screen !== 'login' && (
        <div>
          {/* Global Atelier Header */}
          <Header
            screen={screen}
            user={user}
            onNavigateLibrary={() => setScreen('projects')}
            onNavigateNew={() => { setScreen('new'); setNpTitle(''); setNpText(''); }}
            onLogout={handleLogout}
          />

          {/* 2. Library Feature */}
          {screen === 'projects' && (
            <LibraryView
              user={user}
              projects={projects}
              onOpenProject={openProject}
              onNewProject={() => { setScreen('new'); setNpTitle(''); setNpText(''); }}
            />
          )}

          {/* 3. New Project Feature */}
          {screen === 'new' && (
            <NewProjectView
              title={npTitle}
              text={npText}
              uploadHint={uploadHint}
              onTitleChange={setNpTitle}
              onTextChange={setNpText}
              onFileUpload={handleFileUpload}
              onCreate={handleCreateProject}
            />
          )}

          {/* 4. Pipeline Studio Feature */}
          {screen === 'pipeline' && activeProject && (
            <PipelineStudio
              project={activeProject}
              stepIndex={stepIndex}
              customStyle={customStyle}
              onSelectStep={setStepIndex}
              onUpdateStyle={(st) => updateActiveProject((p) => { p.style = st; })}
              onCustomStyleChange={setCustomStyle}
              onApplyCustomStyle={() => {
                if (customStyle.trim()) {
                  updateActiveProject((p) => { p.style = customStyle.trim(); });
                  showToast(`Custom style selected: ${customStyle.trim()}`);
                }
              }}
              onSelectChapter={(idx) => updateActiveProject((p) => { p.chapterIndex = idx; })}
              onRunStep={runCurrentStep}
              onNextStep={() => setStepIndex(stepIndex + 1)}
              onPrevStep={() => setStepIndex(stepIndex - 1)}
              onViewResult={() => setScreen('result')}
            />
          )}

          {/* 5. Result Gallery Feature */}
          {screen === 'result' && activeProject && (
            <ResultView
              project={activeProject}
              onBackToPipeline={() => setScreen('pipeline')}
              onReturnLibrary={() => setScreen('projects')}
            />
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
