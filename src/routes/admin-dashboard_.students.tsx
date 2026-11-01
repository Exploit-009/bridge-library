import { createFileRoute } from "@tanstack/react-router";
import { AdminStudentsPage } from "@/components/admin/AdminPages";
export const Route = createFileRoute("/admin-dashboard_/students")({
  head: () => ({
    meta: [
      { title: "Students & Roles — BridgeLIB Admin" },
      { name: "description", content: "Manage BridgeLIB Students & Roles." },
      { property: "og:title", content: "Students & Roles — BridgeLIB Admin" },
      { property: "og:description", content: "BridgeLIB administrator tools: Students & Roles." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminStudentsPage,
});
