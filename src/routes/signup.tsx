import { useUser } from "@/lib/user-context";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Stamp } from "@/components/Stamp";
import { signupFn } from "@/api/auth";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Get on the list — Verdict" },
      { name: "description", content: "Create a Verdict account and let your friends judge your taste." },
    ],
  }),
  component: SignupPage,
});

function SignupPage() {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl grid-cols-1 md:grid-cols-2">
        <aside className="relative hidden flex-col justify-between border-r border-border/60 bg-velvet/40 p-10 md:flex">
          <div>
            <p className="wordmark text-brass text-sm">Verdict</p>
            <p className="text-caption mt-2">The guest list</p>
          </div>
          <div className="flex flex-col items-start gap-6">
            <Stamp size="lg" rotation={4} variant="red" label="Pending">
              New
            </Stamp>
            <p className="max-w-xs font-display text-2xl leading-tight text-paper">
              Bring your watchlist. Leave with a verdict.
            </p>
            <ul className="mono space-y-1 text-xs text-dust">
              <li>· A Taste Score, out of 100.</li>
              <li>· One-line verdicts from friends.</li>
              <li>· A share card that stamps them in.</li>
            </ul>
          </div>
          <div className="hairline pt-4 text-caption">Adm. one · Non-refundable</div>
        </aside>

        <section className="flex flex-col justify-center px-6 py-16 md:px-14">
          <div className="mx-auto w-full max-w-sm">
            <p className="text-caption">New patron</p>
            <h1 className="text-section text-paper mt-1">Get on the list</h1>
            <p className="mt-3 text-sm text-dust">
              Three fields. Then the judging begins.
            </p>

            <form
              className="mt-8 space-y-5"
              onSubmit={async (e) => {
                e.preventDefault();
                setIsSubmitting(true);
                try {
                  const result = await signupFn({
                    data: {
                      username,
                      email,
                      bio: "",
                    },
                  });
                  setUser(result.user);
                  navigate({
                    to: "/profile/$username",
                    params: { username },
                  });
                } catch (err: any) {
                  alert(err.message);
                } finally {
                  setIsSubmitting(false);
                }
              }}
            >
              <Field label="Handle" value={username} onChange={setUsername} placeholder="mira_k" />
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
                placeholder="At least 8 characters"
              />

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full border-2 border-brass bg-brass px-6 py-3 text-caption text-ink transition-colors hover:bg-transparent hover:text-brass disabled:opacity-50"
              >
                {isSubmitting ? "Entering..." : "Enter the room"}
              </button>
            </form>

            <div className="mt-6 flex items-center gap-3">
              <div className="hairline flex-1" />
              <span className="text-caption">or</span>
              <div className="hairline flex-1" />
            </div>

            <button
              type="button"
              className="mt-6 w-full border border-border/70 px-6 py-3 text-caption text-paper hover:border-brass hover:text-brass transition-colors"
            >
              Continue with Google
            </button>

            <p className="mt-8 text-caption">
              Already a member?{" "}
              <Link to="/login" className="text-brass hover:underline">
                Sign in
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
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-caption">{label}</span>
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
