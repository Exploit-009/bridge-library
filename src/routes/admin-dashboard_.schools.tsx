import { createFileRoute } from "@tanstack/react-router";
import { AdminSchoolsPage } from "@/components/admin/AdminPages";
export const Route = createFileRoute("/admin-dashboard_/schools")({
  head: () => ({
    meta: [
      { title: "Schools & Papers — BridgeLIB Admin" },
      { name: "description", content: "Manage BridgeLIB Schools & Papers." },
      { property: "og:title", content: "Schools & Papers — BridgeLIB Admin" },
      { property: "og:description", content: "BridgeLIB administrator tools: Schools & Papers." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminSchoolsPage,
});
