import { createFileRoute } from "@tanstack/react-router";
import { AdminQuizzesPage } from "@/components/admin/AdminPages";
export const Route = createFileRoute("/admin-dashboard_/quizzes")({
  head: () => ({
    meta: [
      { title: "Quizzes & Questions — BridgeLIB Admin" },
      { name: "description", content: "Manage BridgeLIB Quizzes & Questions." },
      { property: "og:title", content: "Quizzes & Questions — BridgeLIB Admin" },
      { property: "og:description", content: "BridgeLIB administrator tools: Quizzes & Questions." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminQuizzesPage,
});
