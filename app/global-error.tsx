"use client";

import { useEffect } from "react";

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error("[app/global-error]", error);
  }, [error]);

  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 font-sans">
        <h1 className="text-xl font-semibold">Application error</h1>
        <p className="max-w-md text-center text-sm text-neutral-600">
          A critical error prevented this page from rendering.
        </p>
        <button
          type="button"
          className="rounded-md bg-neutral-900 px-4 py-2 text-sm text-white"
          onClick={() => reset()}
        >
          Try again
        </button>
      </body>
    </html>
  );
}
