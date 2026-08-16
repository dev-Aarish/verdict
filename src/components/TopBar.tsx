import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { logoutFn } from "@/api/auth";
import { useUser } from "@/lib/user-context";
import { cn } from "@/lib/utils";
import { Newspaper, Search, User, LogOut, LogIn, UserPlus } from "lucide-react";

const NAV_ITEM_CLS =
  "flex flex-col items-center justify-center gap-1 py-2 text-[0.6rem] font-mono uppercase tracking-[0.14em] transition-colors";

export function TopBar() {
  const { user, setUser } = useUser();
  const location = useLocation();
  const pathname = location.pathname;

  const handleLogout = async () => {
    try {
      await logoutFn();
      setUser(null);
      window.location.href = "/";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const avatarUrl = user
    ? `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`
    : null;

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border/60 bg-ink/80 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-2.5 md:px-6 md:py-4">
          <Link to="/" className="transition-opacity hover:opacity-75" aria-label="Verdict home">
            <span className="block origin-left scale-90 md:scale-100">
              <Logo />
            </span>
          </Link>

          {/* Desktop navigation — unchanged */}
          <nav className="hidden items-center gap-5 md:flex">
            <Link to="/feed" className="text-caption hover:text-brass transition-colors">
              Feed
            </Link>

            <Link to="/search" className="text-caption hover:text-brass transition-colors">
              Search
            </Link>

            {user ? (
              <>
                <Link
                  to="/profile/$username"
                  params={{ username: user.username }}
                  className="text-caption hover:text-brass transition-colors"
                >
                  Profile
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-caption hover:text-brass transition-colors bg-transparent border-none cursor-pointer"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="text-caption hover:text-brass transition-colors">
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="border border-brass px-3 py-1.5 text-caption text-brass hover:bg-brass hover:text-ink transition-colors"
                >
                  Get on the list
                </Link>
              </>
            )}
          </nav>

          {/* Mobile — compact avatar / join shortcut (nav lives in the bottom bar) */}
          <div className="md:hidden">
            {user ? (
              <Link
                to="/profile/$username"
                params={{ username: user.username }}
                aria-label="Your profile"
                className="block h-8 w-8 overflow-hidden rounded-full ring-1 ring-brass/70 transition-opacity hover:opacity-80"
              >
                {avatarUrl && (
                  <img src={avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                )}
              </Link>
            ) : (
              <Link
                to="/signup"
                className="border border-brass px-2.5 py-1.5 text-caption text-brass transition-colors"
              >
                Join
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation — fixed, hidden on desktop */}
      <nav
        aria-label="Primary"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-ink/95 backdrop-blur-md md:hidden"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
      >
        <div className="grid grid-cols-4">
          <Link
            to="/feed"
            className={cn(NAV_ITEM_CLS, pathname.startsWith("/feed") ? "text-brass" : "text-dust hover:text-paper")}
          >
            <Newspaper className="h-5 w-5" />
            <span>Feed</span>
          </Link>
          <Link
            to="/search"
            className={cn(NAV_ITEM_CLS, pathname.startsWith("/search") ? "text-brass" : "text-dust hover:text-paper")}
          >
            <Search className="h-5 w-5" />
            <span>Search</span>
          </Link>
          {user ? (
            <>
              <Link
                to="/profile/$username"
                params={{ username: user.username }}
                className={cn(NAV_ITEM_CLS, pathname.startsWith("/profile/") ? "text-brass" : "text-dust hover:text-paper")}
              >
                <User className="h-5 w-5" />
                <span>Profile</span>
              </Link>
              <button
                onClick={handleLogout}
                className={cn(NAV_ITEM_CLS, "cursor-pointer bg-transparent border-none text-dust hover:text-marquee-red")}
              >
                <LogOut className="h-5 w-5" />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(NAV_ITEM_CLS, pathname === "/login" ? "text-brass" : "text-dust hover:text-paper")}
              >
                <LogIn className="h-5 w-5" />
                <span>Sign in</span>
              </Link>
              <Link
                to="/signup"
                className={cn(NAV_ITEM_CLS, pathname === "/signup" ? "text-brass" : "text-dust hover:text-paper")}
              >
                <UserPlus className="h-5 w-5" />
                <span>Join</span>
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
