import exam from "@/assets/news-exam.jpg";
import education from "@/assets/news-education.jpg";
import learning from "@/assets/news-learning.jpg";
import graduates from "@/assets/news-graduates.jpg";
import { parseBlocks } from "./site-content";
export type NewsArticle = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  image: string;
  example?: boolean;
};
export const referenceArticles: NewsArticle[] = [
  {
    slug: "wassce-preparation",
    title: "WASSCE 2025/2026: Preparation Tips for Success",
    date: "2025-10-28",
    excerpt: "Get ready for your WASSCE with proven study strategies and past questions...",
    content:
      "Build a revision timetable, practise questions regularly, review your mistakes and ask teachers for help. Check official WAEC sources for current examination dates and requirements.",
    image: exam,
  },
  {
    slug: "education-initiatives-reference",
    title: "Ministry Announces New Education Initiatives",
    date: "2025-10-25",
    excerpt: "Reference example — an official announcement has not been verified.",
    content:
      "This headline is reproduced from the supplied design reference. No Ministry announcement or partnership has been verified. Check the Ministry of Education’s official channels for confirmed announcements. The accompanying building is illustrative.",
    image: education,
    example: true,
  },
  {
    slug: "bridgelib-learning",
    title: "BridgeLIB: Free Learning Platform for Liberian Students",
    date: "2025-10-22",
    excerpt: "Access past questions, video lessons and more — anytime, anywhere...",
    content:
      "Explore BridgeLIB courses, practice questions and learning resources. Your enrolled courses, completed lessons and certificates are available from your student portal. Availability and access depend on the current course and account settings.",
    image: learning,
  },
  {
    slug: "scholarship-opportunities",
    title: "Scholarship Opportunities for Liberian Students",
    date: "2025-10-20",
    excerpt: "Explore scholarship resources locally and internationally...",
    content:
      "Check eligibility, deadlines and application requirements directly with scholarship providers. Never pay an unverified intermediary. Confirmed published opportunities from BridgeLIB appear in the Scholarships & Opportunities section.",
    image: graduates,
  },
];
export function newsArticles(text?: string): NewsArticle[] {
  return [
    ...parseBlocks(text).map(([title, content], index) => ({
      slug: `announcement-${index + 1}`,
      title,
      content,
      excerpt: content.slice(0, 140),
      date: "",
      image: learning,
    })),
    ...referenceArticles,
  ];
}
