import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ResultView } from '../components/result/ResultView.js';
import type { Project } from '../types.js';

const completedProject: Project = {
  id: 'p_done',
  title: 'Treasure Island',
  bookText: 'Full text manuscript for Treasure Island story.',
  wordCount: 5000,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  style: 'Ink & Wash',
  chapterIndex: 0,
  statuses: ['done', 'done', 'done', 'done', 'done'],
  characters: [
    {
      id: 'c1',
      name: 'Long John Silver',
      description: 'One-legged pirate',
      prompt: 'A pirate with parrot',
      portraitUrl: '/api/projects/p_done/portraits/c1',
    },
    {
      id: 'c2',
      name: 'Jim Hawkins',
      description: 'Cabin boy',
      prompt: 'Young boy on ship',
    },
  ],
  chapters: [
    {
      id: 'ch1',
      name: 'The Skeleton Island',
      prompt: 'Treasure map on the sand',
      characters: ['Long John Silver', 'Jim Hawkins'],
      illustrationUrl: '/api/projects/p_done/illustrations/ch1',
    },
  ],
  interactions: {
    ingestionId: 'int_0',
    styleId: 'int_1',
    charactersId: 'int_2',
    portraitsId: 'int_3',
    chaptersId: 'int_4',
    illustrationId: 'int_5',
  },
};

describe('ResultView Component', () => {
  it('renders title, final plate, character cast, and scene dossier', () => {
    render(
      <ResultView
        project={completedProject}
        onBackToPipeline={() => {}}
        onReturnLibrary={() => {}}
      />,
    );

    expect(screen.getByText(/MASTERWORK EDITION · CHAPTER ILLUSTRATED/i)).toBeInTheDocument();
    expect(screen.getAllByText('Treasure Island').length).toBeGreaterThanOrEqual(2);
    expect(screen.getByText('Long John Silver')).toBeInTheDocument();
    expect(screen.getByText('Jim Hawkins')).toBeInTheDocument();
    expect(screen.getByText('The Skeleton Island')).toBeInTheDocument();
    expect(screen.getByAltText('The Skeleton Island')).toHaveAttribute('src', '/api/projects/p_done/illustrations/ch1');
  });

  it('triggers navigation actions when back and library buttons are clicked', () => {
    const onBackToPipeline = vi.fn();
    const onReturnLibrary = vi.fn();

    render(
      <ResultView
        project={completedProject}
        onBackToPipeline={onBackToPipeline}
        onReturnLibrary={onReturnLibrary}
      />,
    );

    const backBtn = screen.getByRole('button', { name: /← Back to Pipeline Studio/i });
    fireEvent.click(backBtn);
    expect(onBackToPipeline).toHaveBeenCalled();

    const libraryBtn = screen.getByRole('button', { name: /Return to Library/i });
    fireEvent.click(libraryBtn);
    expect(onReturnLibrary).toHaveBeenCalled();
  });

  it('opens chapter slide presentation deck and navigates through slides', () => {
    render(
      <ResultView
        project={completedProject}
        onBackToPipeline={() => {}}
        onReturnLibrary={() => {}}
      />,
    );

    const presentBtn = screen.getByRole('button', { name: /Present Chapter Slides/i });
    fireEvent.click(presentBtn);

    // Slide 1 should be visible
    expect(screen.getByText('CHAPTER PRESENTATION')).toBeInTheDocument();
    expect(screen.getByText('SLIDE 01 / 05')).toBeInTheDocument();
    expect(screen.getByText('PROLOGUE & MANUSCRIPT')).toBeInTheDocument();

    // Advance to Slide 2
    const nextBtn = screen.getByRole('button', { name: /Next/i });
    fireEvent.click(nextBtn);
    expect(screen.getByText('SLIDE 02 / 05')).toBeInTheDocument();
    expect(screen.getByText(/DRAMATIS PERSONAE/i)).toBeInTheDocument();

    // Close presentation
    const exitBtn = screen.getByRole('button', { name: /✕ Exit/i });
    fireEvent.click(exitBtn);
    expect(screen.queryByText('CHAPTER PRESENTATION')).not.toBeInTheDocument();
  });
});
