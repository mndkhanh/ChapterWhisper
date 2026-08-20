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

export function App() {
  const [screen, setScreen] = useState<'login' | 'projects' | 'new' | 'pipeline' | 'result'>('login');
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');

  const [npTitle, setNpTitle] = useState('');
  const [npText, setNpText] = useState('');
  const [uploadHint, setUploadHint] = useState('accepts a single .txt manuscript');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeout = useRef<number | undefined>(undefined);

  // Must be stable: hooks below take it as a dependency, and a fresh function
  // each render would re-fire their effects in a loop.
  const showToast = useCallback((msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToast(null), 5000);
  }, []);

  // 1. Auth
  const { user, login, logout } = useAuth(showToast);

  React.useEffect(() => {
    if (user && screen === 'login') setScreen('projects');
  }, [user, screen]);

  // 2. Projects — server-backed
  const { projects, creating, activeProject, createProject, openProject, applyProject } =
    useProjects(user, showToast);

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
    setScreen('login');
  };

  const handleCreateProjectSubmit = async () => {
    const project = await createProject(npTitle, npText);
    if (project) {
      setStepIndex(0);
      setScreen('pipeline');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = (ev.target?.result as string) ?? '';
      setNpText(text);
      setUploadHint(`${file.name} · ${text.split(/\s+/).length.toLocaleString()} words loaded`);
      showToast('Manuscript file loaded');
    };
    reader.readAsText(file);
  };

  /** Opens a project and lands on the step the server says is next. */
  const handleOpenProject = async (id: string) => {
    setScreen('pipeline');
    const p = await openProject(id);
    if (!p) return;
    let idx = p.statuses.findIndex((s) => s === 'running' || s === 'failed');
    if (idx === -1) idx = p.statuses.indexOf('ready');
    if (idx === -1) idx = Math.max(0, p.statuses.lastIndexOf('done'));
    setStepIndex(idx);
  };

  const goNew = () => {
    setScreen('new');
    setNpTitle('');
    setNpText('');
    setUploadHint('accepts a single .txt manuscript');
  };

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
            onNavigateLibrary={() => setScreen('projects')}
            onNavigateNew={goNew}
            onLogout={handleLogoutClick}
          />

          {screen === 'projects' && (
            <LibraryView
              user={user}
              projects={projects}
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
              onCreate={handleCreateProjectSubmit}
            />
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
              onReturnLibrary={() => setScreen('projects')}
            />
          )}
        </div>
      )}

      <Toast message={toast} />
    </div>
  );
}

export default App;
