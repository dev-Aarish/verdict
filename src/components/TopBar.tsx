import { Link, useLocation } from "@tanstack/react-router";
import { Logo } from "@/components/Logo";
import { logoutFn } from "@/api/auth";
import { useUser } from "@/lib/user-context";
import { avatarUrlFor } from "@/lib/avatar";
import { cn } from "@/lib/utils";
import { Newspaper, Search, User, LogOut, LogIn, UserPlus } from "lucide-react";

const NAV_ITEM_CLS =
  "relative flex flex-col items-center justify-center gap-1.5 py-2.5 min-h-[52px] text-[0.68rem] font-mono uppercase tracking-[0.12em] transition-all duration-150 active:scale-95";

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

  const avatarUrl = user ? avatarUrlFor(user.username, user.avatarUrl) : null;

  const isFeedActive = pathname === "/feed" || pathname.startsWith("/feed");
  const isSearchActive = pathname === "/search" || pathname.startsWith("/search");
  const isProfileActive = user ? pathname.startsWith(`/profile/${user.username}`) : false;

  return (
    <>
      <header className="material-glass sticky top-0 z-40 border-b border-border/60 bg-ink/75">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3 md:px-6 md:py-4">
          <Link to="/" className="transition-opacity hover:opacity-80 active:scale-98" aria-label="Verdict home">
            <span className="block origin-left scale-90 md:scale-100">
              <Logo />
            </span>
          </Link>

          {/* Desktop navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            <Link
              to="/feed"
              className={cn(
                "text-caption transition-colors py-1 relative",
                isFeedActive ? "text-brass font-medium" : "text-dust hover:text-paper"
              )}
            >
              Feed
              {isFeedActive && (
                <span className="absolute bottom-0 inset-x-0 h-[1.5px] bg-brass shadow-[0_0_8px_rgba(197,165,114,0.6)]" />
              )}
            </Link>

            <Link
              to="/search"
              className={cn(
                "text-caption transition-colors py-1 relative",
                isSearchActive ? "text-brass font-medium" : "text-dust hover:text-paper"
              )}
            >
              Search
              {isSearchActive && (
                <span className="absolute bottom-0 inset-x-0 h-[1.5px] bg-brass shadow-[0_0_8px_rgba(197,165,114,0.6)]" />
              )}
            </Link>

            {user ? (
              <>
                <Link
                  to="/profile/$username"
                  params={{ username: user.username }}
                  className={cn(
                    "text-caption transition-colors py-1 relative flex items-center gap-2",
                    isProfileActive ? "text-brass font-medium" : "text-dust hover:text-paper"
                  )}
                >
                  <div className="h-5 w-5 rounded-full overflow-hidden ring-1 ring-brass/60">
                    {avatarUrl && (
                      <img src={avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                    )}
                  </div>
                  <span>Profile</span>
                  {isProfileActive && (
                    <span className="absolute bottom-0 inset-x-0 h-[1.5px] bg-brass shadow-[0_0_8px_rgba(197,165,114,0.6)]" />
                  )}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-caption text-dust hover:text-marquee-red transition-colors bg-transparent border-none cursor-pointer py-1"
                >
                  Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  className={cn(
                    "text-caption transition-colors",
                    pathname === "/login" ? "text-brass font-medium" : "text-dust hover:text-paper"
                  )}
                >
                  Sign in
                </Link>
                <Link
                  to="/signup"
                  className="border border-brass/80 px-3.5 py-1.5 text-caption text-brass hover:bg-brass hover:text-ink transition-all active:scale-95"
                >
                  Get on the list
                </Link>
              </>
            )}
          </nav>

          {/* Mobile — compact avatar / join shortcut */}
          <div className="md:hidden flex items-center gap-3">
            {user ? (
              <Link
                to="/profile/$username"
                params={{ username: user.username }}
                aria-label="Your profile"
                className="flex items-center gap-2 rounded-full border border-border/80 bg-velvet/60 px-2.5 py-1 transition-all active:scale-95"
              >
                <div className="h-6 w-6 overflow-hidden rounded-full ring-1 ring-brass/80">
                  {avatarUrl && (
                    <img src={avatarUrl} alt={user.username} className="h-full w-full object-cover" />
                  )}
                </div>
                <span className="mono text-xs text-paper/90 max-w-[80px] truncate">{user.username}</span>
              </Link>
            ) : (
              <Link
                to="/signup"
                className="border border-brass px-3 py-1 text-caption text-brass hover:bg-brass hover:text-ink transition-all active:scale-95"
              >
                Join
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Mobile bottom navigation */}
      <nav
        aria-label="Primary"
        className="material-glass fixed inset-x-0 bottom-0 z-40 border-t border-border/60 bg-ink/85 shadow-[0_-4px_20px_rgba(0,0,0,0.5)] md:hidden"
        style={{ paddingBottom: "max(0.5rem, env(safe-area-inset-bottom))" }}
      >
        <div className="grid grid-cols-4 px-1">
          <Link
            to="/feed"
            className={cn(
              NAV_ITEM_CLS,
              isFeedActive ? "text-brass font-medium" : "text-dust hover:text-paper"
            )}
          >
            <Newspaper className="h-5 w-5 transition-transform group-active:scale-90" />
            <span>Feed</span>
            {isFeedActive && (
              <span className="absolute top-0 inset-x-4 h-[2px] bg-brass rounded-full shadow-[0_0_8px_rgba(197,165,114,0.8)]" />
            )}
          </Link>
          <Link
            to="/search"
            className={cn(
              NAV_ITEM_CLS,
              isSearchActive ? "text-brass font-medium" : "text-dust hover:text-paper"
            )}
          >
            <Search className="h-5 w-5 transition-transform group-active:scale-90" />
            <span>Search</span>
            {isSearchActive && (
              <span className="absolute top-0 inset-x-4 h-[2px] bg-brass rounded-full shadow-[0_0_8px_rgba(197,165,114,0.8)]" />
            )}
          </Link>
          {user ? (
            <>
              <Link
                to="/profile/$username"
                params={{ username: user.username }}
                className={cn(
                  NAV_ITEM_CLS,
                  isProfileActive ? "text-brass font-medium" : "text-dust hover:text-paper"
                )}
              >
                <User className="h-5 w-5 transition-transform group-active:scale-90" />
                <span>Profile</span>
                {isProfileActive && (
                  <span className="absolute top-0 inset-x-4 h-[2px] bg-brass rounded-full shadow-[0_0_8px_rgba(197,165,114,0.8)]" />
                )}
              </Link>
              <button
                onClick={handleLogout}
                className={cn(
                  NAV_ITEM_CLS,
                  "cursor-pointer bg-transparent border-none text-dust hover:text-marquee-red"
                )}
              >
                <LogOut className="h-5 w-5 transition-transform group-active:scale-90" />
                <span>Sign out</span>
              </button>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className={cn(
                  NAV_ITEM_CLS,
                  pathname === "/login" ? "text-brass font-medium" : "text-dust hover:text-paper"
                )}
              >
                <LogIn className="h-5 w-5 transition-transform group-active:scale-90" />
                <span>Sign in</span>
                {pathname === "/login" && (
                  <span className="absolute top-0 inset-x-4 h-[2px] bg-brass rounded-full shadow-[0_0_8px_rgba(197,165,114,0.8)]" />
                )}
              </Link>
              <Link
                to="/signup"
                className={cn(
                  NAV_ITEM_CLS,
                  pathname === "/signup" ? "text-brass font-medium" : "text-dust hover:text-paper"
                )}
              >
                <UserPlus className="h-5 w-5 transition-transform group-active:scale-90" />
                <span>Join</span>
                {pathname === "/signup" && (
                  <span className="absolute top-0 inset-x-4 h-[2px] bg-brass rounded-full shadow-[0_0_8px_rgba(197,165,114,0.8)]" />
                )}
              </Link>
            </>
          )}
        </div>
      </nav>
    </>
  );
}
