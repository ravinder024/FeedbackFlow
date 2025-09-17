import { act } from '@testing-library/react';
import '@testing-library/jest-dom';
import '../../../widget/index.tsx';

// Test helper functions
function simulateButtonClick(button: Element | null) {
  if (!button) throw new Error('Button not found');
  act(() => {
    button.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    jest.runAllTimers();
  });
}

function simulateDocumentClick(x: number, y: number) {
  act(() => {
    document.dispatchEvent(
      new MouseEvent('click', {
        bubbles: true,
        clientX: x,
        clientY: y
      })
    );
    jest.runAllTimers();
  });
}

describe('Percentage-based Coordinate System', () => {
  let originalInnerWidth: number;
  let originalInnerHeight: number;
  let config: { testGroupId: string; memberToken: string; apiUrl: string };
  let mockOpen: jest.SpyInstance;
  let container: HTMLDivElement;

  beforeAll(() => {
    jest.useFakeTimers();
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();

    // Set up container
    container = document.createElement('div');
    document.body.appendChild(container);

    // Store and set window dimensions
    originalInnerWidth = window.innerWidth;
    originalInnerHeight = window.innerHeight;
    Object.defineProperty(window, 'innerWidth', { configurable: true, value: 1000 });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: 500 });

    // Mock window.open
    mockOpen = jest.spyOn(window, 'open').mockImplementation(() => null);

    // Initialize widget
    config = {
      testGroupId: 'test-group-1',
      memberToken: 'test-token',
      apiUrl: 'http://localhost:3000'
    };

    act(() => {
      window.FeedbackFlowWidget?.init(config);
      jest.runAllTimers();
    });
  });

  afterEach(() => {
    act(() => {
      window.FeedbackFlowWidget?.destroy();
      jest.runAllTimers();
    });
    mockOpen.mockRestore();
    container.remove();

    Object.defineProperty(window, 'innerWidth', { configurable: true, value: originalInnerWidth });
    Object.defineProperty(window, 'innerHeight', { configurable: true, value: originalInnerHeight });
  });

  const toggleFeedbackMode = () => {
    const button = document.querySelector('button');
    expect(button).toBeTruthy();

    act(() => {
      // Simulate button click
      button?.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window
      }));
      jest.runAllTimers();
    });

    expect(button?.textContent).toBe('Cancel Feedback');
    expect(document.body.style.cursor).toBe('crosshair');
  };

  const clickAtCoordinates = (x: number, y: number) => {
    act(() => {
      // Simulate document click for pin placement
      document.dispatchEvent(new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
        clientX: x,
        clientY: y
      }));
      jest.runAllTimers();
    });
  };
  const verifyCoordinates = (x: number, y: number) => {
    expect(mockOpen).toHaveBeenCalled();
    const url = new URL(mockOpen.mock.calls[0][0] as string);
    
    const expectedXPercent = (x / window.innerWidth) * 100;
    const expectedYPercent = (y / window.innerHeight) * 100;
    
    expect(parseFloat(url.searchParams.get('xPercent') || '0')).toBeCloseTo(expectedXPercent, 1);
    expect(parseFloat(url.searchParams.get('yPercent') || '0')).toBeCloseTo(expectedYPercent, 1);
  };

  test('converts pixel coordinates to correct percentages', () => {
    toggleFeedbackMode();
    clickAtCoordinates(100, 200); // 10% across, 40% down (100/1000, 200/500)
    verifyCoordinates(100, 200);
    const url = new URL(mockOpen.mock.calls[0][0] as string);
    
    expect(parseFloat(url.searchParams.get('xPercent') || '0')).toBeCloseTo(10);
    expect(parseFloat(url.searchParams.get('yPercent') || '0')).toBeCloseTo(40);
  });

  test('maintains correct percentages after viewport resize', () => {
    const button = document.querySelector('button');

    // Initial click at 25% across, 30% down
    simulateButtonClick(button);
    simulateDocumentClick(250, 150); // 25% across, 30% down (250/1000, 150/500)
    verifyCoordinates(250, 150);

    // Reset feedback mode
    simulateButtonClick(button);

    // Change viewport size
    act(() => {
      Object.defineProperty(window, 'innerWidth', { configurable: true, value: 2000 });
      Object.defineProperty(window, 'innerHeight', { configurable: true, value: 1000 });
      window.dispatchEvent(new Event('resize'));
      jest.runAllTimers();
    });

    // Re-enable feedback mode and click at same percentages
    mockOpen.mockClear();
    simulateButtonClick(button);
    simulateDocumentClick(500, 300); // Same percentages: 25% across (500/2000), 30% down (300/1000)
    verifyCoordinates(500, 300);
  });

  test('handles viewport edges correctly', () => {
    const button = document.querySelector('button');
    const corners = [
      { x: 0, y: 0 },         // Top-left
      { x: 1000, y: 0 },      // Top-right
      { x: 0, y: 500 },       // Bottom-left
      { x: 1000, y: 500 }     // Bottom-right
    ];

    corners.forEach(({ x, y }) => {
      // Enable feedback mode
      simulateButtonClick(button);
      mockOpen.mockClear();

      // Click at corner
      simulateDocumentClick(x, y);
      verifyCoordinates(x, y);

      // Reset feedback mode for next test
      simulateButtonClick(button);
    });
  });
});