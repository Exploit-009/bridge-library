import { createFileRoute } from "@tanstack/react-router";
import { AdminCertificatesPage } from "@/components/admin/AdminPages";
export const Route = createFileRoute("/admin-dashboard_/certificates")({
  head: () => ({
    meta: [
      { title: "Certificates — BridgeLIB Admin" },
      { name: "description", content: "Manage BridgeLIB Certificates." },
      { property: "og:title", content: "Certificates — BridgeLIB Admin" },
      { property: "og:description", content: "BridgeLIB administrator tools: Certificates." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminCertificatesPage,
});
