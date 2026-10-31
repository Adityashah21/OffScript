import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { fetchLiveProducts } from "@/data/products";

function NotFoundComponent() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center px-5 py-24">
      <p className="eyebrow text-accent">404</p>
      <h1 className="display-lg mt-4">This page went<br />off script.</h1>
      <p className="mt-4 text-muted-foreground">The page you're looking for doesn't exist or has been moved.</p>
      <Link to="/" className="btn-ink mt-8">Back to the edit</Link>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center px-5 py-24">
      <h1 className="display-md">This page didn't load.</h1>
      <p className="mt-3 text-muted-foreground">Something went wrong on our end. Try again or head back home.</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <button
          onClick={() => {
            router.invalidate();
            reset();
          }}
          className="btn-ink"
        >
          Try again
        </button>
        <a href="/" className="btn-outline">Go home</a>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "OFFSCRIPT — Curated fashion finds" },
      { name: "description", content: "Curated fashion discovery for India. Good pieces, better prices, no endless scrolling." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "theme-color", content: "#F7F5F0" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=Manrope:wght@400;500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en-IN">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    fetchLiveProducts();
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:bg-background focus:p-3">
        Skip to content
      </a>
      <SiteHeader />
      <main id="main">
        <Outlet />
      </main>
      <SiteFooter />
      <Toaster
        position="bottom-center"
        toastOptions={{ style: { borderRadius: 0, background: "var(--color-foreground)", color: "var(--color-background)", border: "none" } }}
      />
    </QueryClientProvider>
  );
}
