import '@testing-library/jest-dom';

// Mock crypto.randomUUID for Node.js environment
if (typeof global.crypto === 'undefined') {
  const crypto = require('crypto');
  global.crypto = {
    randomUUID: () => crypto.randomUUID(),
  };
} else if (!global.crypto.randomUUID) {
  const crypto = require('crypto');
  global.crypto.randomUUID = () => crypto.randomUUID();
}

// Mock next/router
jest.mock('next/router', () => ({
  useRouter() {
    return {
      route: '/',
      pathname: '',
      query: '',
      asPath: '',
      push: jest.fn(),
      replace: jest.fn(),
    };
  },
}));

// Mock window methods that might not be available in jest environment
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});