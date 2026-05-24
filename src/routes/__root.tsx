import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter, HeadContent, Scripts, Link } from "@tanstack/react-router";
import { Toaster } from "@/components/ui/sonner";
import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-muted-foreground">This page doesn't exist.</p>
        <Link to="/" className="mt-6 inline-block rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Go home</Link>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="font-display text-xl font-semibold">Something went wrong</h1>
        <p className="mt-2 text-sm text-muted-foreground">{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-6 rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:opacity-90">Retry</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Arun Kabeli Power Limited — Hydropower in Nepal" },
      { name: "description", content: "Arun Kabeli Power Limited develops sustainable run-of-river hydropower in Nepal, delivering clean renewable energy since 2011." },
      { property: "og:site_name", content: "Arun Kabeli Power Limited" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:title", content: "Arun Kabeli Power Limited — Hydropower in Nepal" },
      { name: "twitter:title", content: "Arun Kabeli Power Limited — Hydropower in Nepal" },
      { property: "og:description", content: "Arun Kabeli Power Limited develops sustainable run-of-river hydropower in Nepal, delivering clean renewable energy since 2011." },
      { name: "twitter:description", content: "Arun Kabeli Power Limited develops sustainable run-of-river hydropower in Nepal, delivering clean renewable energy since 2011." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6094aad7-428a-4726-8acb-0a01594ba993/id-preview-3bf208c8--cb1ec8c0-992f-44f9-bbbd-4a040332e38d.lovable.app-1779617807941.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/6094aad7-428a-4726-8acb-0a01594ba993/id-preview-3bf208c8--cb1ec8c0-992f-44f9-bbbd-4a040332e38d.lovable.app-1779617807941.png" },
    ],
    links: [{ rel: "stylesheet", href: appCss }, { rel: "preconnect", href: "https://fonts.googleapis.com" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Organization",
        name: "Arun Kabeli Power Limited",
        foundingDate: "2011",
        description: "Hydropower developer in Nepal focused on sustainable run-of-river projects.",
        address: { "@type": "PostalAddress", addressCountry: "NP", addressLocality: "Kathmandu" },
      }),
    }],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <Outlet />
      <Toaster richColors position="top-right" />
    </QueryClientProvider>
  );
}
