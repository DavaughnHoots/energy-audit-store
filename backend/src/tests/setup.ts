// Import Jest's extended matchers
import '@types/jest';

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.LOG_LEVEL = 'error'; // Reduce logging noise during tests

// Global test timeout
jest.setTimeout(10000); // 10 seconds

// Mock console methods to reduce noise
global.console = {
  ...console,
  // Keep error logging for debugging
  error: jest.fn(),
  // Silence info and logs in tests
  info: jest.fn(),
  log: jest.fn(),
  warn: jest.fn(),
};

// Clean up after all tests
afterAll(async () => {
  // Add any global cleanup here if needed
  jest.clearAllMocks();
});

// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});

// Add custom matchers if needed
expect.extend({
  toBeWithinRange(received: number, floor: number, ceiling: number) {
    const pass = received >= floor && received <= ceiling;
    if (pass) {
      return {
        message: () =>
          `expected ${received} not to be within range ${floor} - ${ceiling}`,
        pass: true,
      };
    } else {
      return {
        message: () =>
          `expected ${received} to be within range ${floor} - ${ceiling}`,
        pass: false,
      };
    }
  },
});

// Extend global types for custom matchers
declare global {
  namespace jest {
    interface Matchers<R> {
      toBeWithinRange(floor: number, ceiling: number): R;
    }
  }
}
