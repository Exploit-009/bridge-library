import learning from "@/assets/news-learning.jpg";
import { readAnnouncements } from "./announcements";
export type NewsArticle = {
  slug: string;
  title: string;
  excerpt: string;
  content: string;
  date: string;
  image: string;
  example?: boolean;
};
export function newsArticles(text?: string): NewsArticle[] {
  return readAnnouncements(text)
    .map((article) => ({ ...article, excerpt: article.content.slice(0, 140), image: learning }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
