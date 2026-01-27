/**
 * Test Utilities
 *
 * Custom render functions and utilities for testing React components.
 * These utilities wrap React Testing Library functions with common providers and setup.
 */

import { render, type RenderOptions } from "@testing-library/react";
import type { ReactElement } from "react";

/**
 * Custom render function that wraps components with necessary providers
 *
 * @example
 * ```tsx
 * import { renderWithProviders } from '@/test/test-utils';
 *
 * test('renders component', () => {
 *   const { getByText } = renderWithProviders(<MyComponent />);
 *   expect(getByText('Hello')).toBeInTheDocument();
 * });
 * ```
 */
export function renderWithProviders(ui: ReactElement, options?: Omit<RenderOptions, "wrapper">) {
  // Add providers here if needed (e.g., Context providers, Router, etc.)
  // const Wrapper = ({ children }: { children: React.ReactNode }) => {
  //   return <SomeProvider>{children}</SomeProvider>;
  // };

  return render(ui, { ...options });
}

// Re-export everything from React Testing Library
export * from "@testing-library/react";
export { default as userEvent } from "@testing-library/user-event";
