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
interface AuthRequestBody {
  email: string;
  password: string;
}

interface EntryRequestBody {
  mood: number;
  task: string;
  tags?: string[];
}

export const handlers = [
  // Auth: Login
  http.post(`${API_BASE}/auth/login`, async ({ request }) => {
    const body = (await request.json()) as AuthRequestBody;

    if (body.email === "test@example.com" && body.password === "Password123") {
      return HttpResponse.json({
        session: {
          access_token: "mock-access-token",
          refresh_token: "mock-refresh-token",
          expires_at: Date.now() + 3600000,
          user: {
            id: "test-user-id",
            email: "test@example.com",
          },
        },
        user: {
          id: "test-user-id",
          email: "test@example.com",
        },
      });
    }

    return HttpResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }),

  // Auth: Signup
  http.post(`${API_BASE}/auth/signup`, async ({ request }) => {
    const body = (await request.json()) as AuthRequestBody;

    if (body.email === "existing@example.com") {
      return HttpResponse.json({ error: "Email already exists" }, { status: 400 });
    }

    return HttpResponse.json({
      session: {
        access_token: "mock-access-token",
        refresh_token: "mock-refresh-token",
        expires_at: Date.now() + 3600000,
        user: {
          id: "new-user-id",
          email: body.email,
        },
      },
      user: {
        id: "new-user-id",
        email: body.email,
      },
    });
  }),

  // Auth: Forgot Password
  http.post(`${API_BASE}/auth/forgot-password`, async ({ request }) => {
    const body = (await request.json()) as { email: string };

    return HttpResponse.json({
      message: `Password reset link sent to ${body.email}`,
    });
  }),

  // Auth: Reset Password
  http.post(`${API_BASE}/auth/reset-password`, async ({ request }) => {
    const authHeader = request.headers.get("Authorization");

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return HttpResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);

    if (token === "invalid-token") {
      return HttpResponse.json({ error: "Invalid or expired token" }, { status: 401 });
    }

    return HttpResponse.json({
      message: "Password reset successful",
    });
  }),

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
    const body = (await request.json()) as EntryRequestBody;
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
