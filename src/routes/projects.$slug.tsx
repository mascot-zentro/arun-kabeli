import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { FileText, ArrowLeft } from "lucide-react";

export const Route = createFileRoute("/projects/$slug")({
  head: ({ params }) => ({
    meta: [
      { title: `${params.slug} — Arun Kabeli Power` },
      { name: "description", content: `Project details for ${params.slug}.` },
      { property: "og:title", content: `${params.slug} — Arun Kabeli Power` },
      { property: "og:url", content: `/projects/${params.slug}` },
    ],
    links: [{ rel: "canonical", href: `/projects/${params.slug}` }],
  }),
  component: ProjectDetail,
});

function ProjectDetail() {
  const { slug } = Route.useParams();
  const { data: project, isLoading } = useQuery({
    queryKey: ["project", slug],
    queryFn: async () => {
      const { data } = await supabase.from("projects").select("*").eq("slug", slug).eq("is_published", true).maybeSingle();
      if (!data) throw notFound();
      return data;
    },
  });
  const { data: photos } = useQuery({
    queryKey: ["project-photos", project?.id],
    enabled: !!project?.id,
    queryFn: async () => (await supabase.from("project_photos").select("photos(*)").eq("project_id", project!.id)).data ?? [],
  });
  const { data: docs } = useQuery({
    queryKey: ["project-docs", project?.id],
    enabled: !!project?.id,
    queryFn: async () => (await supabase.from("project_documents").select("documents(*)").eq("project_id", project!.id)).data ?? [],
  });

  if (isLoading) return <div className="min-h-screen bg-background"><SiteHeader /><div className="pt-40 text-center">Loading...</div></div>;
  if (!project) return null;

  return (
    <div className="min-h-screen bg-background">
      <SiteHeader />
      <section className="relative pb-16 pt-32">
        <div className="absolute inset-0 -z-10 h-[500px] animated-mesh" />
        <div className="mx-auto max-w-7xl px-6 text-primary-foreground">
          <Link to="/projects" className="inline-flex items-center gap-2 text-sm text-accent hover:underline"><ArrowLeft className="h-4 w-4" />Back to projects</Link>
          <h1 className="mt-6 font-display text-5xl font-bold md:text-6xl">{project.name}</h1>
          <div className="mt-4 flex flex-wrap gap-6 font-mono text-sm">
            <span><span className="text-accent">Location:</span> {project.location}</span>
            <span><span className="text-accent">Capacity:</span> {project.capacity_mw} MW</span>
            <span><span className="text-accent">Status:</span> {project.status}</span>
          </div>
        </div>
      </section>

      {project.cover_photo_url && (
        <div className="mx-auto -mt-8 max-w-7xl px-6">
          <img src={project.cover_photo_url} alt={project.name} className="aspect-video w-full rounded-xl object-cover shadow-2xl" />
        </div>
      )}

      <section className="py-16">
        <div className="mx-auto max-w-4xl px-6">
          <div className="prose prose-lg max-w-none whitespace-pre-wrap text-foreground">{project.description}</div>
        </div>
      </section>

      {photos && photos.length > 0 && (
        <section className="bg-secondary/40 py-16">
          <div className="mx-auto max-w-7xl px-6">
            <h2 className="font-display text-3xl font-bold">Gallery</h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              {photos.map((row: any, i: number) => row.photos && (
                <img key={i} src={row.photos.url} alt={row.photos.alt_text ?? ""} className="aspect-square w-full rounded-lg object-cover" loading="lazy" />
              ))}
            </div>
          </div>
        </section>
      )}

      {docs && docs.length > 0 && (
        <section className="py-16">
          <div className="mx-auto max-w-4xl px-6">
            <h2 className="font-display text-3xl font-bold">Documents</h2>
            <ul className="mt-6 space-y-2">
              {docs.map((row: any, i: number) => row.documents && (
                <li key={i}>
                  <a href={row.documents.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 rounded-lg border bg-card p-4 hover:border-accent">
                    <FileText className="h-5 w-5 text-accent" /><span className="font-medium">{row.documents.title}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <SiteFooter />
    </div>
  );
}
