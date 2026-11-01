import { createFileRoute } from "@tanstack/react-router";
import { AdminCoursesPage } from "@/components/admin/AdminPages";
export const Route = createFileRoute("/admin-dashboard_/courses")({
  head: () => ({
    meta: [
      { title: "Courses & Lessons — BridgeLIB Admin" },
      { name: "description", content: "Manage BridgeLIB Courses & Lessons." },
      { property: "og:title", content: "Courses & Lessons — BridgeLIB Admin" },
      { property: "og:description", content: "BridgeLIB administrator tools: Courses & Lessons." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCoursesPage,
});
