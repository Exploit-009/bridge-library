import { createFileRoute } from "@tanstack/react-router";
import { SignupFlowPage } from "@/components/site/SignupFlow";
export const Route = createFileRoute("/signup_/teacher")({
  head: () => ({
    meta: [
      { title: "Teacher Sign Up — BridgeLIB" },
      { name: "description", content: "Create your BridgeLIB teacher account in four steps and manage classes and assignments." },
      { property: "og:title", content: "Teach on BridgeLIB" },
      { property: "og:description", content: "Create your BridgeLIB teacher account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: () => <SignupFlowPage initialRole="teacher" />,
});
