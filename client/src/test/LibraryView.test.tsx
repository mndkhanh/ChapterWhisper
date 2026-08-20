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
    chapters: [
      {
        id: 'ch_vol',
        name: 'The Climax',
        prompt: 'Golden sunrise over mountains',
        characters: [],
        illustrationUrl: '/api/projects/p_2/illustrations/ch_vol',
      },
    ],
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

    expect(screen.getAllByText('Completed Volume').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('COMPLETE')).toBeInTheDocument();
    expect(screen.getByText('5 / 5 plates')).toBeInTheDocument();
    expect(screen.getByAltText('Completed Volume')).toHaveAttribute('src', '/api/projects/p_2/illustrations/ch_vol');

    fireEvent.click(screen.getByText('The Great Odyssey'));
    expect(onOpenProject).toHaveBeenCalledWith('p_1');
  });

  it('launches slide presentation modal when Present Slides button in chapter box is clicked', () => {
    const onOpenProject = vi.fn();
    render(
      <LibraryView
        user={mockUser}
        projects={sampleProjects}
        onOpenProject={onOpenProject}
        onNewProject={() => {}}
      />,
    );

    const presentBtns = screen.getAllByRole('button', { name: /Present Slides/i });
    expect(presentBtns.length).toBe(2);

    fireEvent.click(presentBtns[0]);

    // Slide deck modal should be open for The Great Odyssey without opening atelier
    expect(onOpenProject).not.toHaveBeenCalled();
    expect(screen.getByText('CHAPTER PRESENTATION')).toBeInTheDocument();
    expect(screen.getAllByText('The Great Odyssey').length).toBeGreaterThanOrEqual(2);

    // Close presentation modal
    const exitBtn = screen.getByRole('button', { name: /✕ Exit/i });
    fireEvent.click(exitBtn);
    expect(screen.queryByText('CHAPTER PRESENTATION')).not.toBeInTheDocument();
  });
});
