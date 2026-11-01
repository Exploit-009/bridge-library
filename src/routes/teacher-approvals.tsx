import { createFileRoute } from "@tanstack/react-router";
import { TeacherApprovalsPage } from "@/components/admin/TeacherApprovals";
export const Route = createFileRoute("/teacher-approvals")({
  head: () => ({
    meta: [
      { title: "Teacher Approvals — BridgeLIB Admin" },
      { name: "description", content: "Review and approve BridgeLIB teacher account requests." },
      { property: "og:title", content: "Teacher Approvals — BridgeLIB" },
      { property: "og:description", content: "Admin review of teacher signups." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: TeacherApprovalsPage,
});
