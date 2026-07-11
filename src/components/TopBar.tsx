import { Link } from "@tanstack/react-router";

export function TopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-ink/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/" className="wordmark text-lg text-paper">
          Verdict
        </Link>
        <nav className="flex items-center gap-5">
          <Link
            to="/feed"
            className="text-caption hover:text-brass transition-colors"
          >
            Feed
          </Link>
          <Link
            to="/profile/$username"
            params={{ username: "you" }}
            className="text-caption hover:text-brass transition-colors"
          >
            Profile
          </Link>
          <Link
            to="/login"
            className="text-caption hover:text-brass transition-colors"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="border border-brass px-3 py-1.5 text-caption text-brass hover:bg-brass hover:text-ink transition-colors"
          >
            Get on the list
          </Link>
        </nav>
      </div>
    </header>
  );
}
