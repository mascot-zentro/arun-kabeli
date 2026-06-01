import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/news/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `News — Arun Kabeli Power` },
      { property: "og:type", content: "article" },
      { property: "og:url", content: `/news/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/news/${params.slug}` }],
  }),
  component: Article,
});

function Article() {
  const { data: article } = useQuery({
    queryKey: ["news", slug],
    queryFn: async () => {
      const { data } = await supabase.from("news").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });
  const { slug } = Route.useParams();
  // article is undefined while loading, null when notFound throws
  if (!article) return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <article className="pt-32 pb-20">
        <div className="mx-auto max-w-3xl px-6">
          <Link to="/news" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-accent"><ArrowLeft className="h-4 w-4" />All news</Link>
          <p className="mt-6 font-mono text-xs uppercase tracking-widest text-accent">{article.published_at ? new Date(article.published_at).toLocaleDateString() : ""}</p>
          <h1 className="mt-3 font-display text-4xl font-bold md:text-5xl">{article.title}</h1>
          {article.cover_image_url && <img src={article.cover_image_url} alt={article.title} className="mt-8 aspect-video w-full rounded-xl object-cover" />}
          <div className="prose prose-lg mt-8 max-w-none whitespace-pre-wrap text-foreground">{article.content}</div>
        </div>
      </article>
      <SiteFooter />
    </div>
  );
}
