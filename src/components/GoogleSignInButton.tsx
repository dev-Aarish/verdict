import { useUser } from "@/lib/user-context";
import { googleAuthFn } from "@/api/auth";
import { useNavigate } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id: string;
            callback: (response: { credential?: string; error?: string }) => void;
            cancel_on_tap_outside?: boolean;
          }) => void;
          prompt: (callback?: (moment: unknown) => void) => void;
        };
      };
    };
  }
}

let scriptPromise: Promise<void> | null = null;

function loadGoogleScript(): Promise<void> {
  if (scriptPromise) return scriptPromise;
  scriptPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[src="https://accounts.google.com/gsi/client"]');
    if (existing && window.google?.accounts?.id) {
      resolve();
      return;
    }
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = () => {
      const wait = () => {
        if (window.google?.accounts?.id) {
          resolve();
        } else {
          setTimeout(wait, 50);
        }
      };
      wait();
    };
    document.head.appendChild(script);
  });
  return scriptPromise;
}

export function GoogleSignInButton() {
  const navigate = useNavigate();
  const { setUser } = useUser();
  const [loading, setLoading] = useState(false);
  const initialized = useRef(false);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId || initialized.current) return;
    initialized.current = true;

    loadGoogleScript().then(() => {
      if (window.google?.accounts?.id && clientId) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          cancel_on_tap_outside: false,
        });
      }
    });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const handleCredentialResponse = async (response: { credential?: string; error?: string }) => {
    if (response.error || !response.credential) {
      setLoading(false);
      return;
    }
    try {
      const { user } = await googleAuthFn({ data: { credential: response.credential } });
      setUser(user);
      navigate({ to: "/profile/$username", params: { username: user.username } });
    } catch (err) {
      alert(err instanceof Error ? err.message : "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    if (!clientId) {
      alert("Google Sign-In is not configured. Set VITE_GOOGLE_CLIENT_ID in .env");
      return;
    }

    setLoading(true);

    await loadGoogleScript();

    if (!window.google?.accounts?.id) {
      alert("Google Sign-In failed to load. Please try again.");
      setLoading(false);
      return;
    }

    if (!initialized.current) {
      initialized.current = true;
      window.google!.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        cancel_on_tap_outside: false,
      });
    }

    window.google!.accounts.id.prompt();
  };

  return (
    <button
      type="button"
      disabled={loading}
      onClick={handleGoogleSignIn}
      className="mt-6 w-full border border-border/70 px-6 py-3 text-caption text-paper hover:border-brass hover:text-brass transition-colors disabled:opacity-50"
    >
      {loading ? "Connecting..." : "Continue with Google"}
    </button>
  );
}
