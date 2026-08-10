import { createFileRoute, Link } from "@tanstack/react-router";
import { TopBar } from "@/components/TopBar";
import { getFollowersListFn, followUserFn, unfollowUserFn, getFollowStatusFn } from "@/api/follows";
import { useUser } from "@/lib/user-context";
import { useState, useEffect } from "react";

export const Route = createFileRoute("/profile/$username/followers")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.username}'s Followers · Verdict` },
      { name: "description", content: `People who follow ${params.username}.` },
    ],
  }),
  component: FollowersPage,
});

function FollowersPage() {
  const { username } = Route.useParams();
  const { user } = useUser();
  const [followers, setFollowers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [followState, setFollowState] = useState<Record<string, boolean>>({});

  useEffect(() => {
    getFollowersListFn({ data: { username } })
      .then(async (res) => {
        setFollowers(res.users);
        if (user) {
          const states: Record<string, boolean> = {};
          await Promise.all(
            res.users.map(async (u: any) => {
              if (u.username === user.username) return;
              const status = await getFollowStatusFn({ data: { username: u.username } });
              states[u.username] = status.isFollowing;
            }),
          );
          setFollowState(states);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [username, user]);

  const handleFollowToggle = async (targetUsername: string) => {
    const isCurrentlyFollowing = followState[targetUsername];
    try {
      if (isCurrentlyFollowing) {
        await unfollowUserFn({ data: { username: targetUsername } });
      } else {
        await followUserFn({ data: { username: targetUsername } });
      }
      setFollowState((prev) => ({ ...prev, [targetUsername]: !isCurrentlyFollowing }));
    } catch (e) {
      console.error("Follow toggle failed", e);
    }
  };

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-2xl px-6 py-16">
        <Link
          to="/profile/$username"
          params={{ username }}
          className="text-caption text-brass/70 hover:text-brass transition-colors"
        >
          ← Back to {username}'s profile
        </Link>

        <h1 className="text-section text-paper mt-6">{username}'s Followers</h1>

        {loading ? (
          <p className="text-caption text-dust mt-10">Loading...</p>
        ) : followers.length === 0 ? (
          <p className="text-caption text-dust mt-10">No followers yet.</p>
        ) : (
          <ul className="hairline mt-8 divide-y divide-border/40">
            {followers.map((u) => (
              <li key={u.id} className="flex items-center justify-between py-4">
                <Link
                  to="/profile/$username"
                  params={{ username: u.username }}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-dust/20">
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${u.username}`}
                      alt={u.username}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <span className="text-card-title text-paper">{u.username}</span>
                </Link>
                {user && u.username !== user.username && (
                  <button
                    onClick={() => handleFollowToggle(u.username)}
                    className={`px-4 py-1.5 text-caption text-xs transition-colors cursor-pointer border ${
                      followState[u.username]
                        ? "border-dust/40 text-dust hover:border-marquee-red hover:text-marquee-red"
                        : "border-brass text-brass hover:bg-brass hover:text-ink"
                    }`}
                  >
                    {followState[u.username] ? "Following" : "Follow"}
                  </button>
                )}
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
