import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { NewProjectView } from '../components/new-project/NewProjectView.js';

describe('NewProjectView Component', () => {
  it('renders inputs, upload area, and guidance sidebar', () => {
    render(
      <NewProjectView
        title=""
        text=""
        uploadHint="accepts a single .txt manuscript"
        onTitleChange={() => {}}
        onTextChange={() => {}}
        onFileUpload={() => {}}
        onCreate={() => {}}
      />,
    );

    expect(screen.getByText('A New Chapter')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('The Whispering Almanac')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Paste the full chapter or book text here/i)).toBeInTheDocument();
    expect(screen.getByText('Drop or select a .txt file')).toBeInTheDocument();
    expect(screen.getByText('Five Steps')).toBeInTheDocument();

    const submitBtn = screen.getByRole('button', { name: /Begin the Pipeline/i });
    expect(submitBtn).toBeDisabled();
  });

  it('updates title and manuscript text and enables submit button', () => {
    const onTitleChange = vi.fn();
    const onTextChange = vi.fn();
    const onCreate = vi.fn();

    render(
      <NewProjectView
        title="Moby Dick"
        text="Call me Ishmael."
        uploadHint="manuscript.txt loaded"
        onTitleChange={onTitleChange}
        onTextChange={onTextChange}
        onFileUpload={() => {}}
        onCreate={onCreate}
      />,
    );

    const titleInput = screen.getByPlaceholderText('The Whispering Almanac');
    fireEvent.change(titleInput, { target: { value: 'Moby Dick Edited' } });
    expect(onTitleChange).toHaveBeenCalledWith('Moby Dick Edited');

    const submitBtn = screen.getByRole('button', { name: /Begin the Pipeline/i });
    expect(submitBtn).not.toBeDisabled();
    fireEvent.click(submitBtn);
    expect(onCreate).toHaveBeenCalled();
  });

  it('displays ingesting state when creating is true', () => {
    render(
      <NewProjectView
        title="Title"
        text="Text"
        uploadHint=""
        creating={true}
        onTitleChange={() => {}}
        onTextChange={() => {}}
        onFileUpload={() => {}}
        onCreate={() => {}}
      />,
    );

    expect(screen.getByRole('button', { name: /Ingesting Manuscript…/i })).toBeDisabled();
    expect(screen.getByText(/Sending the text to Gemini once/i)).toBeInTheDocument();
  });
});
