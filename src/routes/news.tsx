import { createFileRoute } from "@tanstack/react-router";
import { NewsPortal } from "@/components/site/NewsPortal";

export const Route = createFileRoute("/news")({
  validateSearch: (search: Record<string, unknown>): { q?: string; all?: boolean } => ({
    q: typeof search["q"] === "string" ? search["q"].slice(0, 200) : "",
    all: search["all"] === true || search["all"] === "true",
  }),
  head: () => ({
    meta: [
      { title: "Education News & Updates — BridgeLIB" },
      {
        name: "description",
        content: "BridgeLIB education announcements and upcoming events for Liberian learners.",
      },
      { property: "og:title", content: "Education News & Updates — BridgeLIB" },
      {
        property: "og:description",
        content: "Education announcements and event updates for the BridgeLIB community.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: NewsRoute,
});
function NewsRoute() {
  const { q, all } = Route.useSearch();
  return <NewsPortal query={q} all={all} />;
}
