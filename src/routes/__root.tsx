import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { getCurrentUserFn } from "@/api/auth";
import { UserContext } from "@/lib/user-context";
import { ErrorScreen } from "@/components/ErrorScreen";

import type { UserSafe } from "@/lib/types";

interface MyRouterContext {
  queryClient: QueryClient;
  user?: UserSafe | null;
}

function NotFoundComponent() {
  // The attempted path, when the router landed here from a thrown notFound.
  const path = useRouter().state.location.pathname;
  return <ErrorScreen variant="not-found" code={404} path={path} />;
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <ErrorScreen
      variant="error"
      code={500}
      onRetry={() => {
        router.invalidate();
        reset();
      }}
    />
  );
}

export const Route = createRootRouteWithContext<MyRouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Verdict — Rate your friends' taste in film" },
      {
        name: "description",
        content:
          "A screening-room take on movie ratings. Get a Taste Score, collect Verdicts stamped by your friends, share the card.",
      },
      { name: "author", content: "Verdict" },
      { property: "og:title", content: "Verdict — Rate your friends' taste in film" },
      {
        property: "og:description",
        content:
          "Get a Taste Score. Collect Verdicts. Share the stamp. A screening-room take on movie-rating apps.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#14151D" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "icon", href: "/favicon-32.png", type: "image/png", sizes: "32x32" },
      { rel: "icon", href: "/favicon-16.png", type: "image/png", sizes: "16x16" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      // Self-hosted fonts — preload so they're ready before first paint (no FOUT).
      { rel: "preload", href: "/fonts/inter-latin.woff2", as: "font", type: "font/woff2", crossOrigin: "anonymous" },
      {
        rel: "preload",
        href: "/fonts/playfair-display-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      {
        rel: "preload",
        href: "/fonts/jetbrains-mono-latin.woff2",
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
    ],
  }),
  loader: async ({ context }) => {
    const { user } = await getCurrentUserFn();
    return { user };
  },
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head suppressHydrationWarning>
        <HeadContent />
      </head>
      <body suppressHydrationWarning>
        {children}
        <Toaster theme="dark" position="bottom-center" />
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const { user: initialUser } = Route.useLoaderData();
  const [user, setUser] = useState(initialUser);

  useEffect(() => {
    // Re-verify the session from the browser (sends the auth cookie) after
    // hydration. SSR can't always forward cookies to the API, so without this
    // a full page reload would silently sign the user out.
    getCurrentUserFn()
      .then(({ user: freshUser }) => {
        if (JSON.stringify(freshUser) !== JSON.stringify(initialUser)) setUser(freshUser);
      })
      .catch(() => {});
  }, [initialUser]);

  return (
    <QueryClientProvider client={queryClient}>
      <UserContext.Provider value={{ user, setUser }}>
        <Outlet context={{ queryClient, user }} />
      </UserContext.Provider>
    </QueryClientProvider>
  );
}
