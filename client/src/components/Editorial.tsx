import { Link } from "@tanstack/react-router";
import { ArrowRight, ChevronRight } from "lucide-react";
import { useState, type ReactNode } from "react";
import type { Collection } from "@/data/collections";
import { cn } from "@/lib/utils";

export function Breadcrumbs({ items }: { items: { label: string; to?: string }[] }) {
  return (
    <nav aria-label="Breadcrumb" className="eyebrow flex flex-wrap items-center gap-1 text-muted-foreground">
      <Link to="/" className="hover:text-foreground">Home</Link>
      {items.map((it) => (
        <span key={it.label} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" aria-hidden />
          {it.to ? (
            <a href={it.to} className="hover:text-foreground">{it.label}</a>
          ) : (
            <span aria-current="page" className="text-foreground">{it.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}

export function EmptyState({ title, body, action }: { title: string[]; body: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-start gap-6 border-t border-foreground py-20 md:items-center md:text-center">
      <h2 className="display-lg">
        {title.map((l) => (
          <span key={l} className="block">{l}</span>
        ))}
      </h2>
      <p className="max-w-md text-muted-foreground">{body}</p>
      {action}
    </div>
  );
}

export function SectionHead({ eyebrow, title, body, right }: { eyebrow?: string; title: string[]; body?: string; right?: ReactNode }) {
  return (
    <div className="mb-10 flex flex-col gap-6 border-t border-foreground pt-5 md:flex-row md:items-end md:justify-between">
      <div>
        {eyebrow && <p className="eyebrow mb-4 text-accent">{eyebrow}</p>}
        <h2 className="display-lg">
          {title.map((l) => (
            <span key={l} className="block">{l}</span>
          ))}
        </h2>
      </div>
      <div className="flex flex-col gap-4 md:max-w-xs md:items-end md:text-right">
        {body && <p className="text-muted-foreground">{body}</p>}
        {right}
      </div>
    </div>
  );
}

export function CollectionCard({ c, count, className, label }: { c: Collection; count?: number; className?: string; label?: string }) {
  return (
    <Link to="/collections/$slug" params={{ slug: c.slug }} className={cn("group relative block overflow-hidden bg-secondary", className)}>
      <img src={c.image} alt={c.title} loading="lazy" className="img-zoom absolute inset-0 h-full w-full object-cover group-hover:scale-[1.05]" />
      <div className="scrim-bottom absolute inset-0" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-4 text-paper md:p-5">
        <div>
          {count !== undefined && <p className="eyebrow mb-2 opacity-80">{count} pieces</p>}
          <h3 className="font-display text-2xl md:text-3xl">{label ?? c.title}</h3>
        </div>
        <ArrowRight className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:translate-x-1" />
      </div>
    </Link>
  );
}

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "error" | "done">("idle");
  return (
    <form
      noValidate
      onSubmit={(e) => {
        e.preventDefault();
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return setState("error");
        setState("done");
      }}
      className="w-full max-w-md"
    >
      {state === "done" ? (
        <p role="status" className="border border-foreground p-4 text-sm">
          <strong className="eyebrow block mb-1">You're on the list (demo)</strong>
          This is a preview — your email hasn't been sent to a mailing service yet.
        </p>
      ) : (
        <>
          <label htmlFor="nl-email" className="eyebrow mb-2 block">Email address</label>
          <div className="flex">
            <input
              id="nl-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setState("idle");
              }}
              aria-invalid={state === "error"}
              aria-describedby="nl-note"
              placeholder="you@example.com"
              className="field"
            />
            <button className="btn-ink shrink-0">Join</button>
          </div>
          <p id="nl-note" className={cn("mt-2 text-xs", state === "error" ? "text-destructive" : "text-muted-foreground")}>
            {state === "error" ? "That email doesn't look right." : "No spam. Unsubscribe anytime. We never share your email."}
          </p>
        </>
      )}
    </form>
  );
}
