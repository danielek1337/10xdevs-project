/**
 * MSW (Mock Service Worker) Setup for Node Environment
 *
 * This file sets up MSW for unit and integration tests.
 * It creates a mock server that intercepts HTTP requests during tests.
 */

import { setupServer } from "msw/node";
import { handlers } from "./msw-handlers";
import { beforeAll, afterEach, afterAll } from "vitest";

// Create MSW server with handlers
export const server = setupServer(...handlers);

// Start server before all tests
beforeAll(() => {
  server.listen({ onUnhandledRequest: "warn" });
});

// Reset handlers after each test
afterEach(() => {
  server.resetHandlers();
});

// Close server after all tests
afterAll(() => {
  server.close();
});
