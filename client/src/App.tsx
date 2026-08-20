import React, { useState, useRef, useCallback } from 'react';
import { Header } from './components/layout/Header.js';
import { LoginScreen } from './components/auth/LoginScreen.js';
import { LibraryView } from './components/library/LibraryView.js';
import { NewProjectView } from './components/new-project/NewProjectView.js';
import { PipelineStudio } from './components/pipeline/PipelineStudio.js';
import { ResultView } from './components/result/ResultView.js';
import { Toast } from './components/common/Toast.js';
import { useAuth } from './hooks/useAuth.js';
import { useProjects } from './hooks/useProjects.js';
import { usePipeline } from './hooks/usePipeline.js';
import type { Project, StepStatus } from './types.js';

/** Where the open project is remembered so a refresh returns to it. */
const ACTIVE_KEY = 'cw_active_project';

/**
 * Toasts arrive from three hooks as a bare string, so failure is inferred
 * rather than flagged. Errors get the red treatment, `role="alert"`, and a
 * longer life — a 409 or an expired session must not vanish unread.
 */
const LOOKS_LIKE_ERROR = /\b(fail|failed|error|409|expired|could not|never reached|please)\b/i;

export function App() {
  const [screen, setScreen] = useState<'login' | 'projects' | 'new' | 'pipeline' | 'result'>('login');
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');

  const [npTitle, setNpTitle] = useState('');
  const [npText, setNpText] = useState('');
  const [uploadHint, setUploadHint] = useState('accepts a single .txt manuscript');
  const [opening, setOpening] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [toastIsError, setToastIsError] = useState(false);
  const toastTimeout = useRef<number | undefined>(undefined);

  // Must be stable: hooks below take it as a dependency, and a fresh function
  // each render would re-fire their effects in a loop.
  const showToast = useCallback((msg: string) => {
    const isError = LOOKS_LIKE_ERROR.test(msg);
    setToast(msg);
    setToastIsError(isError);
    window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToast(null), isError ? 12000 : 5000);
  }, []);

  const dismissToast = useCallback(() => {
    window.clearTimeout(toastTimeout.current);
    setToast(null);
  }, []);

  // 1. Auth
  const { user, loading: authLoading, login, logout } = useAuth(showToast);

  /**
   * Whether this browser has signed in before. `useAuth` needs a round trip to
   * `/api/auth/me` to know if the cookie is still good, and rendering the login
   * screen during that wait flashed it at every returning user on every
   * refresh. The cached display user is the cheap local answer to "is a session
   * plausible?", so only those visitors wait on a splash.
   */
  const [hadSession] = useState(() => {
    try {
      return Boolean(localStorage.getItem('cw_user'));
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    if (user && screen === 'login') setScreen('projects');
  }, [user, screen]);

  // 2. Projects — server-backed
  const {
    projects,
    loading: projectsLoading,
    creating,
    activeProject,
    createProject,
    openProject,
    applyProject,
  } = useProjects(user, showToast);

  // 3. Pipeline — server-backed
  const {
    stepIndex,
    setStepIndex,
    customStyle,
    setCustomStyle,
    busyStep,
    pendingStyle,
    pendingChapterIndex,
    selectStep,
    updateStyle,
    applyCustomStyle,
    runStep,
    nextStep,
    prevStep,
  } = usePipeline(activeProject, applyProject, showToast);

  /**
   * What the pipeline screen renders: the server's project, plus the two
   * selections that only exist in the browser until a step runs, plus the
   * in-flight step shown as `running`.
   *
   * The server does persist `running` before it starts the Gemini call, but it
   * does not respond until the call finishes, so this request's own tab would
   * otherwise show a stale status for the whole 10-30s wait. Other tabs read
   * the real one from the server and get their 409.
   */
  const displayProject: Project | undefined = activeProject && {
    ...activeProject,
    style: pendingStyle ?? activeProject.style,
    chapterIndex: pendingChapterIndex ?? activeProject.chapterIndex,
    statuses:
      busyStep === null
        ? activeProject.statuses
        : activeProject.statuses.map((s, i): StepStatus => (i === busyStep ? 'running' : s)),
  };

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginName.trim() || !loginEmail.trim()) {
      showToast('Please enter both name and email');
      return;
    }
    if (await login(loginName, loginEmail)) setScreen('projects');
  };

  const handleLogoutClick = async () => {
    await logout();
    forgetActive();
    restored.current = true;
    setScreen('login');
  };

  const handleCreateProjectSubmit = async () => {
    const project = await createProject(npTitle, npText);
    if (project) {
      try {
        sessionStorage.setItem(ACTIVE_KEY, project.id);
      } catch {
        /* the restore is a convenience, not state */
      }
      restored.current = true;
      setStepIndex(0);
      setScreen('pipeline');
    }
  };

  /** Shared by the file picker and the drop target. */
  const readManuscriptFile = useCallback(
    (file: File) => {
      const isText = file.type.startsWith('text/') || /\.txt$/i.test(file.name);
      if (!isText) {
        showToast(`${file.name} is not a .txt manuscript — please choose a plain text file`);
        return;
      }
      const reader = new FileReader();
      reader.onload = (ev) => {
        const text = (ev.target?.result as string) ?? '';
        const words = text.trim() ? text.trim().split(/\s+/).length : 0;
        setNpText(text);
        setUploadHint(`${file.name} · ${words.toLocaleString()} words loaded`);
        showToast('Manuscript file loaded');
      };
      reader.onerror = () => showToast(`Could not read ${file.name}`);
      reader.readAsText(file);
    },
    [showToast],
  );

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) readManuscriptFile(file);
  };

  /** Opens a project and lands on the step the server says is next. */
  const handleOpenProject = useCallback(
    async (id: string) => {
      setScreen('pipeline');
      setOpening(true);
      try {
        const p = await openProject(id);
        if (!p) {
          setScreen('projects');
          return;
        }
        // Remembered so a refresh mid-pipeline reopens here instead of dropping
        // the author back on the shelf — the server state was always resumable,
        // the screen was not.
        try {
          sessionStorage.setItem(ACTIVE_KEY, id);
        } catch {
          /* private mode — the restore is a convenience, not state */
        }
        let idx = p.statuses.findIndex((s) => s === 'running' || s === 'failed');
        if (idx === -1) idx = p.statuses.indexOf('ready');
        if (idx === -1) idx = Math.max(0, p.statuses.lastIndexOf('done'));
        setStepIndex(idx);
      } finally {
        setOpening(false);
      }
    },
    [openProject, setStepIndex],
  );

  /**
   * Restores the project that was open before a refresh. One shot per mount, so
   * navigating back to the library afterwards sticks.
   */
  const restored = useRef(false);
  React.useEffect(() => {
    if (restored.current || !user || projectsLoading || projects.length === 0) return;
    restored.current = true;
    let saved: string | null = null;
    try {
      saved = sessionStorage.getItem(ACTIVE_KEY);
    } catch {
      return;
    }
    if (saved && projects.some((p) => p.id === saved)) void handleOpenProject(saved);
  }, [user, projects, projectsLoading, handleOpenProject]);

  const forgetActive = () => {
    try {
      sessionStorage.removeItem(ACTIVE_KEY);
    } catch {
      /* nothing to forget */
    }
  };

  const goLibrary = () => {
    forgetActive();
    setScreen('projects');
  };

  const goNew = () => {
    forgetActive();
    setScreen('new');
    setNpTitle('');
    setNpText('');
    setUploadHint('accepts a single .txt manuscript');
  };

  // A returning author waits on this instead of a flash of the login screen.
  if (authLoading && hadSession && !user) {
    return (
      <div className="min-h-screen bg-[#292622] text-[#d8cbb8] flex flex-col items-center justify-center gap-6">
        <div className="w-10 h-10 border border-[#d8cbb8]/60 flex items-center justify-center font-serif text-sm tracking-widest">
          CW
        </div>
        <div className="flex items-center gap-2.5 text-[11px] tracking-[0.25em] uppercase text-[#978e81]" role="status">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d49653] animate-pulse" />
          Restoring your session
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#d8cbb8] text-[#2c2c2c] font-sans selection:bg-[#d49653] selection:text-[#292622]">
      {screen === 'login' && (
        <LoginScreen
          name={loginName}
          email={loginEmail}
          onNameChange={setLoginName}
          onEmailChange={setLoginEmail}
          onSubmit={handleLoginSubmit}
        />
      )}

      {screen !== 'login' && (
        <div>
          <Header
            screen={screen}
            user={user}
            onNavigateLibrary={goLibrary}
            onNavigateNew={goNew}
            onLogout={handleLogoutClick}
          />

          {screen === 'projects' && (
            <LibraryView
              user={user}
              projects={projects}
              loading={projectsLoading}
              onOpenProject={handleOpenProject}
              onNewProject={goNew}
            />
          )}

          {screen === 'new' && (
            <NewProjectView
              title={npTitle}
              text={npText}
              uploadHint={uploadHint}
              creating={creating}
              onTitleChange={setNpTitle}
              onTextChange={setNpText}
              onFileUpload={handleFileUpload}
              onFileDrop={readManuscriptFile}
              onCreate={handleCreateProjectSubmit}
            />
          )}

          {screen === 'pipeline' && !displayProject && (
            <main className="max-w-7xl mx-auto px-8 py-10 grid grid-cols-1 md:grid-cols-[270px_1fr] gap-14 items-start">
              <div className="flex flex-col gap-3" aria-hidden="true">
                <div className="skeleton h-7 w-3/4 mb-3 rounded-[2px]" />
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="skeleton h-12 w-full rounded-[2px]" />
                ))}
              </div>
              <div className="flex flex-col gap-4">
                <div className="skeleton h-3 w-24 rounded-[2px]" />
                <div className="skeleton h-14 w-2/3 rounded-[2px]" />
                <div className="skeleton h-4 w-full max-w-xl rounded-[2px]" />
                <div className="skeleton h-64 w-full rounded-[2px] mt-4" />
                <p className="text-[11px] tracking-[0.2em] uppercase text-[#978e81] mt-2" role="status">
                  {opening ? 'Opening the atelier…' : 'Loading the project…'}
                </p>
              </div>
            </main>
          )}

          {screen === 'pipeline' && displayProject && (
            <PipelineStudio
              project={displayProject}
              stepIndex={stepIndex}
              customStyle={customStyle}
              pendingStyle={pendingStyle}
              onSelectStep={selectStep}
              onUpdateStyle={updateStyle}
              onCustomStyleChange={setCustomStyle}
              onApplyCustomStyle={applyCustomStyle}
              onRunStep={runStep}
              onNextStep={nextStep}
              onPrevStep={prevStep}
              onViewResult={() => setScreen('result')}
            />
          )}

          {screen === 'result' && displayProject && (
            <ResultView
              project={displayProject}
              onBackToPipeline={() => setScreen('pipeline')}
              onReturnLibrary={goLibrary}
            />
          )}
        </div>
      )}

      <Toast message={toast} isError={toastIsError} onDismiss={dismissToast} />
    </div>
  );
}

export default App;
