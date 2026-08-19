import { createFileRoute } from "@tanstack/react-router";
import { ErrorScreen } from "@/components/ErrorScreen";
import { absoluteUrl } from "@/lib/site-url";

/**
 * Catch-all — any path that matches no route gets the house 404, stamped in
 * marquee-red. The attempted path is shown on the slate line and baked into
 * the OG meta so a shared broken link previews as an on-brand error card.
 */
export const Route = createFileRoute("/$")({
  head: ({ params }) => {
    const path = params._splat ? `/${params._splat}` : "/";
    const ogImage = absoluteUrl(`/og/error/404?path=${encodeURIComponent(path)}`);
    return {
      meta: [
        { title: "404 · Not in the archive · Verdict" },
        {
          name: "description",
          content: `Nothing is screening at ${path}. This reel isn't in the archive.`,
        },
        { property: "og:title", content: "404 · Not in the archive · Verdict" },
        {
          property: "og:description",
          content: `Nothing is screening at ${path}. This reel isn't in the archive.`,
        },
        { property: "og:type", content: "website" },
        { property: "og:image", content: ogImage },
        { property: "og:image:width", content: "1200" },
        { property: "og:image:height", content: "630" },
        { name: "twitter:card", content: "summary_large_image" },
        { name: "twitter:image", content: ogImage },
      ],
    };
  },
  component: CatchAllPage,
});

function CatchAllPage() {
  const { _splat } = Route.useParams();
  const path = _splat ? `/${_splat}` : "/";
  return <ErrorScreen variant="not-found" code={404} path={path} />;
}
