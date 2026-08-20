import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LoginScreen } from '../components/auth/LoginScreen.js';

describe('LoginScreen Component', () => {
  it('renders branding and input fields', () => {
    render(
      <LoginScreen
        name=""
        email=""
        onNameChange={() => {}}
        onEmailChange={() => {}}
        onSubmit={() => {}}
      />,
    );

    expect(screen.getByText('CHAPTERWHISPER')).toBeInTheDocument();
    expect(screen.getByText('An AI Atelier for Illustrated Books')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Evelyn Thorne')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('evelyn@atelier.co')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /enter the atelier/i })).toBeInTheDocument();
  });

  it('triggers onNameChange and onEmailChange callbacks when typing', () => {
    const onNameChange = vi.fn();
    const onEmailChange = vi.fn();
    render(
      <LoginScreen
        name="Ada"
        email="ada@example.com"
        onNameChange={onNameChange}
        onEmailChange={onEmailChange}
        onSubmit={() => {}}
      />,
    );

    const nameInput = screen.getByPlaceholderText('Evelyn Thorne');
    fireEvent.change(nameInput, { target: { value: 'Ada Lovelace' } });
    expect(onNameChange).toHaveBeenCalledWith('Ada Lovelace');

    const emailInput = screen.getByPlaceholderText('evelyn@atelier.co');
    fireEvent.change(emailInput, { target: { value: 'ada.new@example.com' } });
    expect(onEmailChange).toHaveBeenCalledWith('ada.new@example.com');
  });

  it('calls onSubmit on form submission', () => {
    const onSubmit = vi.fn((e) => e?.preventDefault());
    render(
      <LoginScreen
        name="Ada"
        email="ada@example.com"
        onNameChange={() => {}}
        onEmailChange={() => {}}
        onSubmit={onSubmit}
      />,
    );

    const submitBtn = screen.getByRole('button', { name: /enter the atelier/i });
    fireEvent.click(submitBtn);

    expect(onSubmit).toHaveBeenCalled();
  });
});
