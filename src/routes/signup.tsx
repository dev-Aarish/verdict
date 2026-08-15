import { useUser } from "@/lib/user-context";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { TopBar } from "@/components/TopBar";
import { Logo } from "@/components/Logo";
import { Stamp } from "@/components/Stamp";
import { signupFn } from "@/api/auth";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Get on the list — Verdict" },
      {
        name: "description",
        content: "Create a Verdict account and let your friends judge your taste.",
      },
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
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="grid min-h-[calc(100vh-4rem)] grid-cols-1 md:grid-cols-2">
        <aside className="relative hidden flex-col items-center justify-between border-r border-border/60 bg-velvet/40 p-10 text-center md:flex">
          <div>
            <Logo variant="brass" size="sm" />
            <p className="text-caption mt-2">The guest list</p>
          </div>
          <div className="flex flex-col items-center gap-6">
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

        <section className="flex flex-col items-center justify-center px-6 py-16 md:px-14">
          <div className="mx-auto w-full max-w-sm">
            <p className="text-caption">New patron</p>
            <h1 className="text-section text-paper mt-1">Get on the list</h1>
            <p className="mt-3 text-sm text-dust">Three fields. Then the judging begins.</p>

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
                      password,
                      bio: "",
                    },
                  });
                  setUser(result.user);
                  navigate({
                    to: "/profile/$username",
                    params: { username },
                  });
                } catch (err) {
                  alert(err instanceof Error ? err.message : "Signup failed");
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
                type={showPassword ? "text" : "password"}
                placeholder="At least 8 characters"
                suffix={
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="text-dust hover:text-brass"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? EyeOffIcon : EyeIcon}
                  </button>
                }
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

            <GoogleSignInButton />

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

const EyeIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    className="size-4"
  >
    <path d="M2.036 12.322a1.012 1.012 0 0 1 0-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178Z" />
    <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
  </svg>
);

const EyeOffIcon = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={1.5}
    className="size-4"
  >
    <path d="M3.98 8.223A10.477 10.477 0 0 0 1.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.451 10.451 0 0 1 12 4.5c4.756 0 8.773 3.162 10.065 7.498a10.522 10.522 0 0 1-4.293 5.774M6.228 6.228 3 3m3.228 3.228 3.65 3.65m7.894 7.894L21 21m-3.228-3.228-3.65-3.65m0 0a3 3 0 1 0-4.243-4.243m4.242 4.242L9.88 9.88" />
  </svg>
);

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  trailing,
  suffix,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  trailing?: React.ReactNode;
  suffix?: React.ReactNode;
}) {
  return (
    <label className="block">
      <div className="flex items-center justify-between">
        <span className="text-caption">{label}</span>
        {trailing}
      </div>
      <div className="relative mt-2">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full border-b border-border bg-transparent px-0 py-2 pr-6 font-mono text-paper placeholder:text-dust/60 focus:border-brass focus:outline-none"
        />
        {suffix && <div className="absolute inset-y-0 right-0 flex items-center">{suffix}</div>}
      </div>
    </label>
  );
}
