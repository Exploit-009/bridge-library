import { createFileRoute } from "@tanstack/react-router";
import { HelpCenterPage } from "@/components/site/HelpCenter";

export const Route = createFileRoute("/faq")({
  head: () => ({
    meta: [
      { title: "Help Center & FAQs — BridgeLIB" },
      { name: "description", content: "Answers to common questions about BridgeLIB accounts, practice and progress." },
      { property: "og:title", content: "Help Center & FAQs — BridgeLIB" },
      { property: "og:description", content: "Answers to common questions about BridgeLIB accounts, practice and progress." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HelpCenterPage,
});
