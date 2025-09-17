import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import { DirectTestView } from '../DirectTestView';
import { SessionProvider } from 'next-auth/react';

describe('Demo Feedback Workflow', () => {
  it('renders ChatGPT-style UI and allows feedback pin placement and form submission', () => {
    const handleFeedback = jest.fn();
    render(
      <SessionProvider session={null}>
        <DirectTestView url="demo" onFeedbackClick={handleFeedback} />
      </SessionProvider>
    );
    // Feedback button should be present
    const feedbackBtn = screen.getByText(/Add Feedback/i);
    expect(feedbackBtn).toBeInTheDocument();
    // Click feedback button
    fireEvent.click(feedbackBtn);
    // Simulate mouse click for pin placement
    fireEvent.click(document);
    // Emoji select
    fireEvent.change(screen.getByLabelText(/Emoji/i), { target: { value: '😀' } });
    // Severity select
    fireEvent.change(screen.getByLabelText(/Severity/i), { target: { value: 'high' } });
    // Comment input
    fireEvent.change(screen.getByLabelText(/Comment/i), { target: { value: 'Test comment' } });
    // Submit feedback
    fireEvent.click(screen.getByText(/Submit/i));
    // Feedback handler should be called
    expect(handleFeedback).toHaveBeenCalledWith(
      expect.objectContaining({
        emoji: '😀',
        severity: 'high',
        comment: 'Test comment'
      })
    );
  });
});
