import { createFileRoute } from '@tanstack/react-router';
import { NewsPortal } from '@/components/site/NewsPortal';
import { referenceArticles } from '@/lib/news-articles';
export const Route=createFileRoute('/news_/$slug')({head:({params})=>{const title=referenceArticles.find(a=>a.slug===params.slug)?.title??'Education Announcement';return{meta:[{title:`${title} — BridgeLIB`},{name:'description',content:'BridgeLIB education news and learning resources.'},{property:'og:title',content:`${title} — BridgeLIB`},{property:'og:description',content:'Read the BridgeLIB education update.'},{property:'og:type',content:'article'},{name:'twitter:card',content:'summary_large_image'}]};},component:NewsDetail});
function NewsDetail(){const {slug}=Route.useParams();return <NewsPortal slug={slug}/>;}