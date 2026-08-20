import { useEffect, useState } from 'react';

export function App() {
  const [status, setStatus] = useState<string>('Connecting to backend...');

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => setStatus(data.message || data.status))
      .catch(() => setStatus('Backend disconnected'));
  }, []);

  return (
    <div style={{ fontFamily: 'system-ui, sans-serif', padding: '3rem', textAlign: 'center' }}>
      <h1>ChapterWhisper</h1>
      <p>Backend status: <strong>{status}</strong></p>
    </div>
  );
}

export default App;
