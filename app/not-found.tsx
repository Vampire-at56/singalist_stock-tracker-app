import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center text-gray-200">
      <div className="max-w-md text-center space-y-4 px-6">
        <h1 className="text-3xl font-semibold">Page not found</h1>
        <p className="text-gray-400">
          The page you are looking for does not exist.
        </p>
        <Link href="/" className="footer-link">
          Go to dashboard
        </Link>
      </div>
    </main>
  );
}

