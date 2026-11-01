import { createFileRoute } from "@tanstack/react-router";
import { handleStudyTools } from "@/lib/study-tools.server";
export const Route = createFileRoute("/api/study-tools")({
  server: { handlers: { POST: ({ request }) => handleStudyTools(request) } },
});
