import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LibraryView } from '../components/library/LibraryView.js';
import type { Project, User } from '../types.js';

const mockUser: User = { id: 'u_1', email: 'author@atelier.co', name: 'Author', createdAt: new Date().toISOString() };

const sampleProjects: Project[] = [
  {
    id: 'p_1',
    title: 'The Great Odyssey',
    bookText: 'Text 1',
    wordCount: 1200,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    style: 'Ink & Wash',
    chapterIndex: 0,
    statuses: ['done', 'done', 'ready', 'locked', 'locked'],
    characters: [{ id: 'c1', name: 'Odysseus', description: 'Hero', prompt: 'Heroic man' }],
    chapters: [{ id: 'ch1', name: 'Sailing Home', prompt: 'Ship at sea', characters: ['Odysseus'] }],
    interactions: { ingestionId: 'int_1' },
  },
  {
    id: 'p_2',
    title: 'Completed Volume',
    bookText: 'Text 2',
    wordCount: 3400,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    style: 'Golden-Age Oil',
    chapterIndex: 0,
    statuses: ['done', 'done', 'done', 'done', 'done'],
    characters: [],
    chapters: [],
    interactions: { ingestionId: 'int_2' },
  },
];

describe('LibraryView Component', () => {
  it('renders user archive header and button to begin a new chapter', () => {
    const onNewProject = vi.fn();
    render(
      <LibraryView
        user={mockUser}
        projects={[]}
        onOpenProject={() => {}}
        onNewProject={onNewProject}
      />,
    );

    expect(screen.getByText(/STUDIO ARCHIVE · author@atelier.co/i)).toBeInTheDocument();
    expect(screen.getByText('Your Library')).toBeInTheDocument();

    const newBtn = screen.getByRole('button', { name: /\+ Begin a New Chapter/i });
    fireEvent.click(newBtn);
    expect(onNewProject).toHaveBeenCalled();
  });

  it('renders project list with step badges, word count and opens project on click', () => {
    const onOpenProject = vi.fn();
    render(
      <LibraryView
        user={mockUser}
        projects={sampleProjects}
        onOpenProject={onOpenProject}
        onNewProject={() => {}}
      />,
    );

    expect(screen.getByText('The Great Odyssey')).toBeInTheDocument();
    expect(screen.getByText('STEP 03')).toBeInTheDocument();
    expect(screen.getByText('2 / 5 plates')).toBeInTheDocument();

    expect(screen.getByText('Completed Volume')).toBeInTheDocument();
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();
    expect(screen.getByText('5 / 5 plates')).toBeInTheDocument();

    fireEvent.click(screen.getByText('The Great Odyssey'));
    expect(onOpenProject).toHaveBeenCalledWith('p_1');
  });
});
