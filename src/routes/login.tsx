import { useUser } from "@/lib/user-context";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Stamp } from "@/components/Stamp";
import { loginFn } from "@/api/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign in — Verdict" },
      { name: "description", content: "Sign in to collect verdicts on your taste in film." },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl grid-cols-1 md:grid-cols-2">
        {/* Left: marquee panel */}
        <aside className="relative hidden flex-col justify-between border-r border-border/60 bg-velvet/40 p-10 md:flex">
          <div>
            <p className="wordmark text-brass text-sm">Verdict</p>
            <p className="text-caption mt-2">Members' entrance</p>
          </div>
          <div className="flex flex-col items-start gap-6">
            <Stamp size="lg" rotation={-5} label="Now Showing">
              You
            </Stamp>
            <p className="max-w-xs font-display text-2xl leading-tight text-paper">
              "A room. A projector. A verdict about to be read."
            </p>
            <p className="text-caption">— House motto, est. 2026</p>
          </div>
          <div className="hairline pt-4 text-caption">Reel 01 · Aud. A · 20:00</div>
        </aside>

        {/* Right: form */}
        <section className="flex flex-col justify-center px-6 py-16 md:px-14">
          <div className="mx-auto w-full max-w-sm">
            <p className="text-caption">Members</p>
            <h1 className="text-section text-paper mt-1">Sign in</h1>
            <p className="mt-3 text-sm text-dust">
              Enter to collect the night's verdicts.
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                try {
                  const { user } = await loginFn({
                    data: { email, password },
                  });
                  setUser(user);
                  navigate({ to: "/profile/$username", params: { username: user.username } });
                } catch (err: any) {
                  alert(err.message);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <Field
                label="Email"
                value={email}
                onChange={setEmail}
                type="email"
                placeholder="you@screening.room"
              />
              <Field
                label="Password"
                value={password}
                onChange={setPassword}
                type="password"
                placeholder="••••••••"
                trailing={
                  <button
                    type="button"
                    className="text-caption text-dust hover:text-brass"
                  >
                    Forgot
                  </button>
                }
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full border-2 border-brass bg-brass px-6 py-3 text-caption text-ink transition-colors hover:bg-transparent hover:text-brass disabled:opacity-50"
              >
                {isSubmitting ? "Checking..." : "Take your seat"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="hairline flex-1" />
              <span className="text-caption">or</span>
              <div className="hairline flex-1" />
            </div>

            <GoogleSignInButton />

            <p className="mt-8 text-caption">
              No ticket yet?{" "}
              <Link to="/signup" className="text-brass hover:underline">
                Get on the list
              </Link>
            </p>
          </div>
        </section>
      </main>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  trailing,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  trailing?: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-caption">{label}</span>
        {trailing}
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="mt-2 w-full border-b border-border bg-transparent px-0 py-2 font-mono text-paper placeholder:text-dust/60 focus:border-brass focus:outline-none"
      />
    </label>
  );
}
