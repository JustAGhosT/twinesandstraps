import '@testing-library/jest-dom';

// Mock window.open for WhatsApp tests
global.open = jest.fn();

// Mock fetch globally
global.fetch = jest.fn();

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
