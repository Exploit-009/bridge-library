import { createFileRoute } from "@tanstack/react-router";
import { SignupFlowPage } from "@/components/site/SignupFlow";
export const Route = createFileRoute("/signup")({
  head: () => ({
    meta: [
      { title: "Create Your Account — BridgeLIB" },
      { name: "description", content: "Sign up for BridgeLIB in four quick steps and start learning for WASSCE and beyond." },
      { property: "og:title", content: "Join BridgeLIB — Bright Students, Brighter Liberia" },
      { property: "og:description", content: "Create your free BridgeLIB student or teacher account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignupFlowPage,
});
