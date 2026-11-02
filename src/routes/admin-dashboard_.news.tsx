import { createFileRoute } from "@tanstack/react-router";
import { AdminNewsPage } from "@/components/admin/AdminNews";

export const Route = createFileRoute("/admin-dashboard_/news")({
  head: () => ({ meta: [
    { title: "News Dashboard — BridgeLIB Admin" },
    { name: "description", content: "Publish and manage real BridgeLIB announcements." },
    { property: "og:title", content: "News Dashboard — BridgeLIB Admin" },
    { property: "og:description", content: "BridgeLIB administrator announcement publishing." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
    { name: "robots", content: "noindex" },
  ] }),
  component: AdminNewsPage,
});