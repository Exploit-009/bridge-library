import { createFileRoute } from "@tanstack/react-router";
import { AdminHubPage } from "@/components/admin/AdminHub";
export const Route = createFileRoute("/admin-dashboard")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — BridgeLIB" },
      { name: "description", content: "Manage BridgeLIB courses, quizzes, certificates, students and teachers from one place." },
      { property: "og:title", content: "Admin Dashboard — BridgeLIB" },
      { property: "og:description", content: "BridgeLIB administrator overview." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminHubPage,
});
