import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import App from '../App';

describe('App component', () => {
  it('renders heading and updates status from backend', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        json: () => Promise.resolve({ status: 'ok', message: 'ChapterWhisper API is healthy' }),
      }) as unknown as Promise<Response>
    );

    render(<App />);
    expect(screen.getByText('ChapterWhisper')).toBeInTheDocument();
    await waitFor(() => {
      expect(screen.getByText('ChapterWhisper API is healthy')).toBeInTheDocument();
    });
  });
});
