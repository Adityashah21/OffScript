import { Link } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useRef } from "react";
import { getCollection, productsIn } from "@/data/collections";

export function RadarRail({ slugs }: { slugs: string[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: number) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });
  return (
    <section aria-labelledby="radar" className="pt-28">
      <div className="mx-auto flex max-w-[1600px] items-end justify-between gap-6 border-t border-foreground px-5 pt-5 md:px-10">
        <div>
          <p className="eyebrow text-accent">Collections · {slugs.length}</p>
          <h2 id="radar" className="display-lg mt-3 uppercase">Currently on<br />our radar.</h2>
        </div>
        <div className="flex gap-2">
          <button onClick={() => scroll(-1)} aria-label="Previous collections" className="group inline-flex h-12 w-12 items-center justify-center border border-foreground hover:bg-foreground hover:text-background">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </button>
          <button onClick={() => scroll(1)} aria-label="Next collections" className="group inline-flex h-12 w-12 items-center justify-center border border-foreground hover:bg-foreground hover:text-background">
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </button>
        </div>
      </div>
      <div ref={ref} className="no-scrollbar mt-10 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-px-5 px-5 pb-2 md:scroll-px-10 md:px-10">
        {slugs.map((s, i) => {
          const c = getCollection(s)!;
          return (
            <Link key={s} to="/collections/$slug" params={{ slug: s }} className="group w-[80vw] shrink-0 snap-start sm:w-[44vw] lg:w-[30vw]">
              <div className="relative aspect-[4/5] overflow-hidden bg-secondary">
                <img src={c.image} alt="" loading="lazy" className="img-zoom h-full w-full object-cover group-hover:scale-105" />
                <span className="eyebrow absolute left-3 top-3 bg-background px-2 py-1">{String(i + 1).padStart(2, "0")} / {String(slugs.length).padStart(2, "0")}</span>
              </div>
              <div className="mt-4 flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-display text-3xl leading-none">{c.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{c.description}</p>
                </div>
                <span className="eyebrow shrink-0 pt-1">{productsIn(s).length} →</span>
              </div>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
