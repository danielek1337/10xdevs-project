/**
 * Component Tests for ExampleButton
 * 
 * This demonstrates best practices for React component testing:
 * - Using React Testing Library
 * - Testing user interactions
 * - Testing component props
 * - Using accessible queries
 */

import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithProviders } from '@/test/test-utils';
import { ExampleButton } from './ExampleButton';

describe('ExampleButton', () => {
  it('should render with default props', () => {
    // Arrange & Act
    renderWithProviders(<ExampleButton />);

    // Assert
    expect(screen.getByRole('button', { name: /increment counter/i })).toBeInTheDocument();
    expect(screen.getByText(/click me/i)).toBeInTheDocument();
    expect(screen.getByTestId('counter-display')).toHaveTextContent('Count: 0');
  });

  it('should render with custom label', () => {
    // Arrange & Act
    renderWithProviders(<ExampleButton label="Custom Label" />);

    // Assert
    expect(screen.getByText(/custom label/i)).toBeInTheDocument();
  });

  it('should render with initial count', () => {
    // Arrange & Act
    renderWithProviders(<ExampleButton initialCount={5} />);

    // Assert
    expect(screen.getByTestId('counter-display')).toHaveTextContent('Count: 5');
  });

  it('should increment counter when button is clicked', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProviders(<ExampleButton />);
    const button = screen.getByRole('button', { name: /increment counter/i });

    // Act
    await user.click(button);

    // Assert
    expect(screen.getByTestId('counter-display')).toHaveTextContent('Count: 1');
  });

  it('should increment counter multiple times', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProviders(<ExampleButton />);
    const button = screen.getByRole('button', { name: /increment counter/i });

    // Act
    await user.click(button);
    await user.click(button);
    await user.click(button);

    // Assert
    expect(screen.getByTestId('counter-display')).toHaveTextContent('Count: 3');
  });

  it('should start from initial count and increment', async () => {
    // Arrange
    const user = userEvent.setup();
    renderWithProviders(<ExampleButton initialCount={10} />);
    const button = screen.getByRole('button', { name: /increment counter/i });

    // Act
    await user.click(button);

    // Assert
    expect(screen.getByTestId('counter-display')).toHaveTextContent('Count: 11');
  });
});

