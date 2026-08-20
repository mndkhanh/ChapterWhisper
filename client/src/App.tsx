import React, { useState, useRef } from 'react';
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

export function App() {
  const [screen, setScreen] = useState<'login' | 'projects' | 'new' | 'pipeline' | 'result'>('login');
  const [loginName, setLoginName] = useState('');
  const [loginEmail, setLoginEmail] = useState('');

  const [npTitle, setNpTitle] = useState('');
  const [npText, setNpText] = useState('');
  const [uploadHint, setUploadHint] = useState('accepts a single .txt manuscript');
  const [toast, setToast] = useState<string | null>(null);
  const toastTimeout = useRef<number | undefined>(undefined);

  const showToast = (msg: string) => {
    setToast(msg);
    window.clearTimeout(toastTimeout.current);
    toastTimeout.current = window.setTimeout(() => setToast(null), 3500);
  };

  // 1. Auth Hook
  const { user, login, logout } = useAuth(showToast);

  // Switch to projects automatically once logged in
  React.useEffect(() => {
    if (user && screen === 'login') {
      setScreen('projects');
    }
  }, [user, screen]);

  // 2. Projects Hook
  const {
    projects,
    activeProject,
    setActiveId,
    createProject,
    updateActiveProject,
  } = useProjects(showToast);

  // 3. Pipeline Hook
  const {
    stepIndex,
    setStepIndex,
    customStyle,
    setCustomStyle,
    selectStep,
    updateStyle,
    applyCustomStyle,
    selectChapter,
    runStep,
    nextStep,
    prevStep,
  } = usePipeline(activeProject, updateActiveProject, showToast);

  const handleLoginSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!loginName.trim() || !loginEmail.trim()) {
      showToast('Please enter both name and email');
      return;
    }
    const success = await login(loginName, loginEmail);
    if (success) setScreen('projects');
  };

  const handleLogoutClick = async () => {
    await logout();
    setScreen('login');
  };

  const handleCreateProjectSubmit = () => {
    const id = createProject(npTitle, npText);
    if (id) {
      setStepIndex(0);
      setScreen('pipeline');
    }
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

  return (
    <div className="min-h-screen bg-[#d8cbb8] text-[#2c2c2c] font-sans selection:bg-[#d49653] selection:text-[#292622]">
      {/* 1. Login View */}
      {screen === 'login' && (
        <LoginScreen
          name={loginName}
          email={loginEmail}
          onNameChange={setLoginName}
          onEmailChange={setLoginEmail}
          onSubmit={handleLoginSubmit}
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
            onLogout={handleLogoutClick}
          />

          {/* 2. Library Dashboard View */}
          {screen === 'projects' && (
            <LibraryView
              user={user}
              projects={projects}
              onOpenProject={openProject}
              onNewProject={() => { setScreen('new'); setNpTitle(''); setNpText(''); }}
            />
          )}

          {/* 3. New Project Creation View */}
          {screen === 'new' && (
            <NewProjectView
              title={npTitle}
              text={npText}
              uploadHint={uploadHint}
              onTitleChange={setNpTitle}
              onTextChange={setNpText}
              onFileUpload={handleFileUpload}
              onCreate={handleCreateProjectSubmit}
            />
          )}

          {/* 4. Pipeline Studio View */}
          {screen === 'pipeline' && activeProject && (
            <PipelineStudio
              project={activeProject}
              stepIndex={stepIndex}
              customStyle={customStyle}
              onSelectStep={selectStep}
              onUpdateStyle={updateStyle}
              onCustomStyleChange={setCustomStyle}
              onApplyCustomStyle={applyCustomStyle}
              onSelectChapter={selectChapter}
              onRunStep={runStep}
              onNextStep={nextStep}
              onPrevStep={prevStep}
              onViewResult={() => setScreen('result')}
            />
          )}

          {/* 5. Result Gallery View */}
          {screen === 'result' && activeProject && (
            <ResultView
              project={activeProject}
              onBackToPipeline={() => setScreen('pipeline')}
              onReturnLibrary={() => setScreen('projects')}
            />
          )}
        </div>
      )}

      {/* Floating Global Toast Notification */}
      <Toast message={toast} />
    </div>
  );
}

export default App;

