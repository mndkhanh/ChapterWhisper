import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

/** A stand-in for a real `Response`: the api layer reads `.text()`, not `.json()`. */
function jsonResponse(status: number, body: unknown): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(body === undefined ? '' : JSON.stringify(body)),
  } as unknown as Response;
}

const USER = { id: 'u1', name: 'Evelyn Thorne', email: 'evelyn@atelier.co' };

/** Routes a mocked fetch by URL; `overrides` wins over the signed-out defaults. */
function mockFetch(overrides: Record<string, () => Response> = {}) {
  return vi.fn().mockImplementation((url: string) => {
    for (const [fragment, make] of Object.entries(overrides)) {
      if (url.includes(fragment)) return Promise.resolve(make());
    }
    if (url.includes('/api/auth/me')) return Promise.resolve(jsonResponse(401, { error: 'Not signed in' }));
    if (url.includes('/api/projects')) return Promise.resolve(jsonResponse(200, { projects: [] }));
    return Promise.resolve(jsonResponse(200, {}));
  });
}

describe('App component', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  it('renders login screen by default', async () => {
    global.fetch = mockFetch();

    render(<App />);

    expect(screen.getByText('CHAPTERWHISPER')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter the atelier/i })).toBeInTheDocument();
    // Signed out, the library must never be fetched.
    expect(await screen.findByRole('button', { name: /enter the atelier/i })).toBeInTheDocument();
  });

  it('allows logging in and viewing the library', async () => {
    global.fetch = mockFetch({
      '/api/auth/login': () => jsonResponse(200, { user: USER }),
    });

    render(<App />);

    fireEvent.change(screen.getByPlaceholderText('Evelyn Thorne'), {
      target: { value: 'Evelyn Thorne' },
    });
    fireEvent.change(screen.getByPlaceholderText('evelyn@atelier.co'), {
      target: { value: 'evelyn@atelier.co' },
    });
    fireEvent.click(screen.getByRole('button', { name: /enter the atelier/i }));

    expect(await screen.findByText('Your Library')).toBeInTheDocument();
  });

  it('lists the projects the server returns', async () => {
    const project = {
      id: 'p_1',
      title: 'The Lantern Corridor',
      bookText: '...',
      wordCount: 672,
      style: null,
      chapterIndex: null,
      statuses: ['ready', 'locked', 'locked', 'locked', 'locked'],
      characters: [],
      chapters: [],
      interactions: { ingestionId: 'int_1' },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    global.fetch = mockFetch({
      '/api/auth/me': () => jsonResponse(200, { user: USER }),
      '/api/projects': () => jsonResponse(200, { projects: [project] }),
    });

    render(<App />);

    expect(await screen.findByText('The Lantern Corridor')).toBeInTheDocument();
    expect(screen.getByText(/672 words/)).toBeInTheDocument();
    // Nothing done yet -> 0 of 5 plates.
    expect(screen.getByText('0 / 5 plates')).toBeInTheDocument();
  });
});
