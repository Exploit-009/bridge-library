import { createFileRoute } from "@tanstack/react-router";
import { AiDashboardPage } from "@/components/learning/AiDashboard";
export const Route = createFileRoute("/bridgelib-ai")({
  head: () => ({
    meta: [
      { title: "BridgeLIB AI — Your Smart Learning Assistant" },
      { name: "description", content: "Chat with BridgeLIB AI for explanations, practice quizzes, study tips and WASSCE help." },
      { property: "og:title", content: "BridgeLIB AI — Your Smart Learning Assistant" },
      { property: "og:description", content: "Ask anything, get explanations and practice quizzes with BridgeLIB AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AiDashboardPage,
});
