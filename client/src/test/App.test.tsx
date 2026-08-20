import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import App from '../App';

describe('App component', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders login screen by default', () => {
    render(<App />);
    expect(screen.getByText('CHAPTERWHISPER')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter the atelier/i })).toBeInTheDocument();
  });

  it('allows logging in and viewing the library', async () => {
    global.fetch = vi.fn().mockImplementation(() =>
      Promise.resolve({
        ok: true,
        json: () => Promise.resolve({ user: { id: 'u1', name: 'Evelyn Thorne', email: 'evelyn@atelier.co' } }),
      }) as unknown as Promise<Response>
    );

    render(<App />);
    const nameInput = screen.getByPlaceholderText('Evelyn Thorne');
    const emailInput = screen.getByPlaceholderText('evelyn@atelier.co');
    const loginButton = screen.getByRole('button', { name: /enter the atelier/i });

    fireEvent.change(nameInput, { target: { value: 'Evelyn Thorne' } });
    fireEvent.change(emailInput, { target: { value: 'evelyn@atelier.co' } });
    fireEvent.click(loginButton);

    expect(await screen.findByText('Your Library')).toBeInTheDocument();
  });
});

