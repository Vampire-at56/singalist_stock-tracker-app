"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen flex items-center justify-center bg-black text-gray-200">
        <div className="max-w-lg space-y-4 px-6 text-center">
          <h1 className="text-2xl font-semibold">Something went wrong</h1>
          <p className="text-sm text-gray-400">
            {error?.message || "Unexpected error"}
          </p>
          <button className="yellow-btn" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}

