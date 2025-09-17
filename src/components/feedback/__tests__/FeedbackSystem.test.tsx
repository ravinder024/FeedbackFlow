import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbackSystem } from '../FeedbackSystem';
import { useSession } from 'next-auth/react';

// Mock next-auth
jest.mock('next-auth/react', () => ({
  useSession: jest.fn(),
}));

describe('FeedbackSystem', () => {
  const mockSession = {
    data: {
      user: {
        id: 'test-user-id',
        name: 'Test User',
        email: 'test@example.com',
        role: 'TEST_MEMBER',
      },
    },
    status: 'authenticated',
  };

  beforeEach(() => {
    (useSession as jest.Mock).mockReturnValue(mockSession);
  });

  it('renders feedback button correctly', () => {
    render(<FeedbackSystem />);
    const button = screen.getByRole('button', { name: /feedback/i });
    expect(button).toBeInTheDocument();
    expect(button).not.toHaveStyle({ opacity: 0.6 });
  });

  it('disables button during submission', async () => {
    render(<FeedbackSystem />);
    const button = screen.getByRole('button', { name: /feedback/i });
    fireEvent.click(button);

    // Fill out form
    const commentInput = screen.getByLabelText(/comment/i);
    fireEvent.change(commentInput, { target: { value: 'Test feedback' } });
    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    expect(button).toHaveStyle({ opacity: 0.6 });
  });

  it('opens feedback form on button click', () => {
    render(<FeedbackSystem />);
    const button = screen.getByRole('button', { name: /feedback/i });
    fireEvent.click(button);

    expect(screen.getByText('How do you feel about this?')).toBeInTheDocument();
    expect(screen.getByText('Severity')).toBeInTheDocument();
  });

  it('submits feedback successfully', async () => {
    const mockOnSubmit = jest.fn();
    render(<FeedbackSystem onSubmit={mockOnSubmit} />);

    // Open form
    const button = screen.getByRole('button', { name: /feedback/i });
    fireEvent.click(button);

    // Fill out form
    const commentInput = screen.getByLabelText(/comment/i);
    fireEvent.change(commentInput, { target: { value: 'Test feedback' } });

    const severitySelect = screen.getByLabelText(/severity/i);
    fireEvent.change(severitySelect, { target: { value: 'Medium' } });

    const submitButton = screen.getByRole('button', { name: /submit/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        comment: 'Test feedback',
        severity: 'Medium',
        emotion: 'neutral',
      });
    });

    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('displays feedback history', async () => {
    const mockFeedback = [
      {
        id: '1',
        content: 'Test feedback content',
        createdAt: new Date().toISOString(),
        user: {
          name: 'Test User',
        },
      },
    ];

    render(<FeedbackSystem initialFeedback={mockFeedback} />);

    await waitFor(() => {
      expect(screen.getByText('Test feedback content')).toBeInTheDocument();
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });
  });

  it('displays empty state when no feedback', async () => {
    render(<FeedbackSystem initialFeedback={[]} />);

    await waitFor(() => {
      expect(screen.getByText('No feedback has been submitted yet.')).toBeInTheDocument();
    });
  });
}); 