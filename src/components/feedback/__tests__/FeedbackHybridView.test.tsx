import { render, screen, fireEvent } from '@testing-library/react';
import { act } from 'react-dom/test-utils';
import '@testing-library/jest-dom';
import { FeedbackHybridView } from '../FeedbackHybridView';
import { useFeedbackStore } from '../store';

// Mock data
const mockPins = [
  {
    id: 'pin1',
    pageUrl: 'http://example.com/page1',
    xPercent: 25,
    yPercent: 50,
    status: 'new',
    userId: 'user1',
    createdAt: '2025-07-21T10:00:00Z',
    updatedAt: '2025-07-21T10:00:00Z'
  },
  {
    id: 'pin2',
    pageUrl: 'http://example.com/page2',
    xPercent: 75,
    yPercent: 25,
    status: 'inProgress',
    userId: 'user1',
    createdAt: '2025-07-21T11:00:00Z',
    updatedAt: '2025-07-21T11:00:00Z'
  }
];

jest.mock('../store', () => ({
  useFeedbackStore: jest.fn()
}));

describe('FeedbackHybridView', () => {
  beforeEach(() => {
    (useFeedbackStore as unknown as jest.Mock).mockReturnValue({
      pins: mockPins,
      selectedPinId: null,
      setSelectedPin: jest.fn(),
      updatePinStatus: jest.fn()
    });
  });

  test('renders both canvas and list views', () => {
    render(<FeedbackHybridView />);
    
    // Canvas should exist
    expect(screen.getByTestId('feedback-canvas')).toBeInTheDocument();
    
    // List should exist and show pins
    const list = screen.getByTestId('feedback-list');
    expect(list).toBeInTheDocument();
    expect(list).toHaveTextContent('example.com/page1');
    expect(list).toHaveTextContent('example.com/page2');
  });

  test('synchronizes pin selection between views', () => {
    const setSelectedPin = jest.fn();
    (useFeedbackStore as unknown as jest.Mock).mockReturnValue({
      pins: mockPins,
      selectedPinId: null,
      setSelectedPin,
      updatePinStatus: jest.fn()
    });

    render(<FeedbackHybridView />);

    // Click a pin in the canvas
    const pin = screen.getByTestId('pin-pin1');
    fireEvent.click(pin);
    
    // Should update selection in store
    expect(setSelectedPin).toHaveBeenCalledWith('pin1');
    
    // Update store to simulate selection
    (useFeedbackStore as unknown as jest.Mock).mockReturnValue({
      pins: mockPins,
      selectedPinId: 'pin1',
      setSelectedPin,
      updatePinStatus: jest.fn()
    });

    // Both views should show selection
    expect(pin).toHaveClass('ring-2');
    expect(screen.getByTestId('list-row-pin1')).toHaveClass('bg-blue-50');
  });

  test('updates pin status', () => {
    const updatePinStatus = jest.fn();
    (useFeedbackStore as unknown as jest.Mock).mockReturnValue({
      pins: mockPins,
      selectedPinId: null,
      setSelectedPin: jest.fn(),
      updatePinStatus
    });

    render(<FeedbackHybridView />);

    // Change status in list view
    const statusSelect = screen.getByTestId('status-select-pin1');
    fireEvent.change(statusSelect, { target: { value: 'resolved' } });

    expect(updatePinStatus).toHaveBeenCalledWith('pin1', 'resolved');
  });

  test('maintains pin positions after viewport resize', () => {
    render(<FeedbackHybridView />);

    // Get initial pin positions
    const pin1 = screen.getByTestId('pin-pin1');
    const pin2 = screen.getByTestId('pin-pin2');
    
    const pin1Style = window.getComputedStyle(pin1);
    const pin2Style = window.getComputedStyle(pin2);
    
    const originalPositions = {
      pin1: { left: pin1Style.left, top: pin1Style.top },
      pin2: { left: pin2Style.left, top: pin2Style.top }
    };

    // Trigger resize
    act(() => {
      window.dispatchEvent(new Event('resize'));
    });

    // Positions should be unchanged
    expect(pin1).toHaveStyle({
      left: originalPositions.pin1.left,
      top: originalPositions.pin1.top
    });
    
    expect(pin2).toHaveStyle({
      left: originalPositions.pin2.left,
      top: originalPositions.pin2.top
    });
  });
});
