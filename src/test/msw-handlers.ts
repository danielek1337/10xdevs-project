/**
 * MSW (Mock Service Worker) Handlers
 *
 * Define mock API handlers for testing without hitting real backend.
 * These handlers intercept network requests and return mock responses.
 */

import { http, HttpResponse } from "msw";

// Base URL for API endpoints
const API_BASE = "/api";

/**
 * Mock handlers for API endpoints
 *
 * Add handlers for your API endpoints here.
 * Each handler intercepts a specific endpoint and returns mock data.
 */
export const handlers = [
  // Example: Mock GET /api/entries
  http.get(`${API_BASE}/entries`, () => {
    return HttpResponse.json({
      data: [
        {
          id: "1",
          mood: 4,
          task: "Working on tests",
          tags: ["testing", "development"],
          created_at: new Date().toISOString(),
        },
      ],
    });
  }),

  // Example: Mock POST /api/entries
  http.post(`${API_BASE}/entries`, async ({ request }) => {
    const body = await request.json();
    return HttpResponse.json(
      {
        data: {
          id: "2",
          ...body,
          created_at: new Date().toISOString(),
        },
      },
      { status: 201 }
    );
  }),

  // Example: Mock error response
  http.get(`${API_BASE}/error-test`, () => {
    return HttpResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }),

  // Add more handlers as needed for your API endpoints
];
