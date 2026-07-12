import { createFileRoute, Link } from "@tanstack/react-router";
import { Stamp } from "@/components/Stamp";
import { TopBar } from "@/components/TopBar";

export const Route = createFileRoute("/profile/$username")({
  component: ProfilePage,
});

function ProfilePage() {
  const { username } = Route.useParams();

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto max-w-6xl px-6 py-12">
        <div className="flex flex-col items-center gap-6 text-center">
          <div className="relative">
            <div className="h-24 w-24 overflow-hidden rounded-full bg-dust/20 ring-2 ring-brass">
              <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`} alt={username} />
            </div>
            <Stamp size="sm" rotation={10} variant="red" label="Verified">
              OK
            </Stamp>
          </div>
          <div>
            <h1 className="text-section text-paper">{username}</h1>
            <p className="text-caption text-dust">Member since Mar 2026</p>
          </div>
        </div>
      </main>
    </div>
  );
}
