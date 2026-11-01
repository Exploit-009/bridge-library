import { createFileRoute } from "@tanstack/react-router";
import { StudyToolsPage } from "@/components/learning/StudyTools";
export const Route = createFileRoute("/study-tools")({
  head: () => ({
    meta: [
      { title: "AI Study Tools — BridgeLIB" },
      { name: "description", content: "Get AI explanations and practice quizzes for any lesson or WASSCE topic." },
      { property: "og:title", content: "AI Study Tools — BridgeLIB" },
      { property: "og:description", content: "Explain any topic or generate a practice quiz with BridgeLIB AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: StudyToolsPage,
});
