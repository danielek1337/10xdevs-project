/**
 * Example Button Component
 * Simple component for demonstration purposes
 */

import { useState } from "react";

interface ExampleButtonProps {
  initialCount?: number;
  label?: string;
}

export function ExampleButton({ initialCount = 0, label = "Click me" }: ExampleButtonProps) {
  const [count, setCount] = useState(initialCount);

  return (
    <div className="flex flex-col items-center gap-4 p-4">
      <button
        onClick={() => setCount(count + 1)}
        className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        aria-label="Increment counter"
      >
        {label}
      </button>
      <p data-testid="counter-display">Count: {count}</p>
    </div>
  );
}
