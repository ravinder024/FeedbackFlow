
import { act } from 'react-dom/test-utils';
import * as React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { FeedbackCollector } from './FeedbackCollector';

describe('FeedbackCollector', () => {
  const testRef = React.createRef<{ placePin: (x: number, y: number) => void }>();
  const defaultProps = {
    url: 'http://localhost',
    onFeedbackClick: jest.fn(),
    scale: 1,
    pan: { x: 0, y: 0 },
    viewport: { width: 800, height: 600 },
    canvasRect: { left: 0, top: 0, width: 800, height: 600 },
    containerRef: { current: document.createElement('div') },
    testRef
  };

  it('should render Add Feedback button and allow pin placement', async () => {
    render(<FeedbackCollector {...defaultProps} />);
    const addButton = screen.getByText('Add Feedback');
    expect(addButton).toBeInTheDocument();
    fireEvent.click(addButton);
    await act(async () => {
      testRef.current?.placePin(100, 100);
    });
    // Pin should appear
    expect(await screen.findByText('📍')).toBeInTheDocument();
  });

  it('should open modal when pin is clicked', async () => {
    render(<FeedbackCollector {...defaultProps} />);
    fireEvent.click(screen.getByText('Add Feedback'));
    await act(async () => {
      testRef.current?.placePin(200, 200);
    });
    const pin = await screen.findByText('📍');
    fireEvent.click(pin);
    expect(await screen.findByText('Emoji:')).toBeInTheDocument();
    expect(await screen.findByText('Severity:')).toBeInTheDocument();
    expect(await screen.findByText('Comment:')).toBeInTheDocument();
  });
});
