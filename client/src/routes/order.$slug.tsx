import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useState } from "react";
import { getProduct, type Product } from "@/data/products";
import { inr } from "@/lib/format";
import { isCodEligible, MAX_QTY, mockOrderRef, orderTotal, validateOrder, type OrderInput } from "@/lib/order";
import { seo } from "@/lib/seo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/order/$slug")({
  validateSearch: (s: Record<string, unknown>) => ({ size: typeof s["size"] === "string" ? (s["size"] as string) : undefined }),
  loader: ({ params }) => {
    const p = getProduct(params.slug);
    if (!p) throw notFound();
    return { name: p.name };
  },
  head: ({ loaderData }) => ({
    ...seo(`Order request: ${loaderData?.name ?? "Piece"}`, "Request this piece with cash on delivery."),
    meta: [...seo(`Order request: ${loaderData?.name ?? "Piece"}`, "Request this piece with cash on delivery.").meta, { name: "robots", content: "noindex" }],
  }),
  component: OrderPage,
});

const STATES = ["Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh","Delhi","Goa","Gujarat","Haryana","Himachal Pradesh","Jammu and Kashmir","Jharkhand","Karnataka","Kerala","Ladakh","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram","Nagaland","Odisha","Puducherry","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana","Tripura","Uttar Pradesh","Uttarakhand","West Bengal"];

function OrderPage() {
  const { slug } = Route.useParams();
  const { size } = Route.useSearch();
  const p = getProduct(slug)!;
  const [done, setDone] = useState<{ ref: string; form: OrderInput } | null>(null);

  if (!isCodEligible(p)) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-24">
        <h1 className="display-md">Cash on delivery isn't available for this piece.</h1>
        <p className="mt-4 text-muted-foreground">It's sold by {p.retailer}. You can buy it directly on their site.</p>
        <Link to="/product/$slug" params={{ slug }} className="btn-ink mt-8">Back to the piece</Link>
      </div>
    );
  }
  if (done) return <OrderConfirmation product={p} orderRef={done.ref} form={done.form} />;
  return (
    <CODOrderForm
      product={p}
      initialSize={size}
      onSubmitted={(form, realRef) => {
        setDone({ ref: realRef || mockOrderRef(), form });
        window.scrollTo(0, 0);
      }}
    />
  );
}

function CODOrderForm({
  product: p,
  initialSize,
  onSubmitted,
}: {
  product: Product;
  initialSize?: string | undefined;
  onSubmitted: (f: OrderInput, ref?: string) => void;
}) {
  const [f, setF] = useState<OrderInput>({
    fullName: "", mobile: "", email: "", house: "", street: "", landmark: "", city: "", state: "", pin: "",
    size: initialSize && p.availableSizes.includes(initialSize) ? initialSize : "",
    color: p.availableColors[0] ?? "", quantity: 1, instructions: "", confirmed: false,
  });
  const [errors, setErrors] = useState<ReturnType<typeof validateOrder>>({});
  const [submitting, setSubmitting] = useState(false);
  const set = <K extends keyof OrderInput>(k: K, v: OrderInput[K]) => setF((x) => ({ ...x, [k]: v }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validateOrder(p, f);
    setErrors(errs);
    if (Object.keys(errs).length) {
      document.getElementById(`f-${Object.keys(errs)[0]}`)?.focus();
      return;
    }
    setSubmitting(true);

    try {
      const API_URL =
        import.meta.env.VITE_API_URL ||
        (typeof window !== "undefined" && window.location.hostname === "localhost"
          ? "http://localhost:5001"
          : "https://offscript-p9rk.onrender.com");

      const response = await fetch(`${API_URL}/api/orders`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productSlug: p.slug,
          fullName: f.fullName.trim(),
          mobile: f.mobile.trim(),
          email: f.email?.trim() || undefined,
          house: f.house.trim(),
          street: f.street.trim(),
          landmark: f.landmark?.trim() || undefined,
          city: f.city.trim(),
          state: f.state.trim(),
          pin: f.pin.trim(),
          size: f.size || undefined,
          color: f.color.trim(),
          quantity: Number(f.quantity) || 1,
          instructions: f.instructions?.trim() || undefined,
          confirmed: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const message =
          errorData.message ||
          (errorData.details && errorData.details[0]?.message) ||
          "Failed to place order request. Please check your information.";
        setErrors((prev) => ({ ...prev, product: message }));
        setSubmitting(false);
        return;
      }

      const result = await response.json();
      onSubmitted(f, result.ref);
    } catch (err: any) {
      console.error("Order submission network error:", err);
      setErrors((prev) => ({
        ...prev,
        product: "Connection error: Unable to submit order to the server. Please check your connection and try again.",
      }));
      setSubmitting(false);
    }
  };

  const field = (k: keyof OrderInput, label: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}, optional = false) => (
    <div>
      <label htmlFor={`f-${k}`} className="eyebrow mb-2 block">{label}{optional && <span className="ml-1 font-normal normal-case tracking-normal text-muted-foreground">(optional)</span>}</label>
      <input id={`f-${k}`} value={f[k] as string} onChange={(e) => set(k, e.target.value as never)} aria-invalid={!!errors[k]} aria-describedby={errors[k] ? `e-${k}` : undefined} className="field" {...props} />
      {errors[k] && <p id={`e-${k}`} className="mt-1 text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="mx-auto max-w-[1200px] px-5 py-10 md:px-10">
      <Link to="/product/$slug" params={{ slug: p.slug }} className="eyebrow link-underline">← Back to the piece</Link>
      <h1 className="display-lg mt-6">Order request</h1>
      <p className="mt-3 max-w-xl text-muted-foreground">Cash on delivery. No card or UPI details needed. This is a demo — your request won't be sent to a supplier.</p>

      <form noValidate onSubmit={submit} className="mt-10 grid gap-12 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-10">
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="eyebrow mb-4 text-accent">01 · Contact</legend>
            <div className="sm:col-span-2">{field("fullName", "Full name", { autoComplete: "name" })}</div>
            {field("mobile", "Mobile number", { type: "tel", inputMode: "numeric", autoComplete: "tel", placeholder: "98765 43210" })}
            {field("email", "Email", { type: "email", autoComplete: "email" }, true)}
          </fieldset>
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="eyebrow mb-4 text-accent">02 · Delivery address</legend>
            {field("house", "House / flat no.", { autoComplete: "address-line1" })}
            {field("street", "Street / locality", { autoComplete: "address-line2" })}
            <div className="sm:col-span-2">{field("landmark", "Landmark", {}, true)}</div>
            {field("city", "City", { autoComplete: "address-level2" })}
            <div>
              <label htmlFor="f-state" className="eyebrow mb-2 block">State</label>
              <select id="f-state" value={f.state} onChange={(e) => set("state", e.target.value)} aria-invalid={!!errors.state} className="field">
                <option value="">Select state</option>
                {STATES.map((s) => <option key={s}>{s}</option>)}
              </select>
              {errors.state && <p className="mt-1 text-xs text-destructive">{errors.state}</p>}
            </div>
            {field("pin", "PIN code", { inputMode: "numeric", maxLength: 6, autoComplete: "postal-code", placeholder: "400001" })}
          </fieldset>
          <fieldset className="grid gap-5 sm:grid-cols-2">
            <legend className="eyebrow mb-4 text-accent">03 · Your piece</legend>
            {p.availableSizes.length > 0 && (
              <div className="sm:col-span-2">
                <p className="eyebrow mb-2" id="f-size-label">Size</p>
                <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="f-size-label">
                  {p.availableSizes.map((s, i) => (
                    <button id={i === 0 ? "f-size" : undefined} key={s} type="button" role="radio" aria-checked={f.size === s} onClick={() => set("size", s)} className={cn("h-11 min-w-12 border px-3 text-sm", f.size === s ? "border-foreground bg-foreground text-background" : "hover:border-foreground", errors.size && "border-destructive")}>{s}</button>
                  ))}
                </div>
                {errors.size && <p className="mt-1 text-xs text-destructive">{errors.size}</p>}
              </div>
            )}
            {p.availableColors.length > 1 && (
              <div>
                <label htmlFor="f-color" className="eyebrow mb-2 block">Colour</label>
                <select id="f-color" value={f.color} onChange={(e) => set("color", e.target.value)} className="field">
                  {p.availableColors.map((c) => <option key={c}>{c}</option>)}
                </select>
              </div>
            )}
            <div>
              <label htmlFor="f-quantity" className="eyebrow mb-2 block">Quantity</label>
              <div className="flex">
                <button type="button" aria-label="Decrease quantity" onClick={() => set("quantity", Math.max(1, f.quantity - 1))} className="h-12 w-12 border">−</button>
                <input id="f-quantity" inputMode="numeric" value={f.quantity} onChange={(e) => set("quantity", Number(e.target.value) || 0)} aria-invalid={!!errors.quantity} className="field w-16 text-center" />
                <button type="button" aria-label="Increase quantity" onClick={() => set("quantity", Math.min(MAX_QTY, f.quantity + 1))} className="h-12 w-12 border">+</button>
              </div>
              {errors.quantity && <p className="mt-1 text-xs text-destructive">{errors.quantity}</p>}
            </div>
            <div className="sm:col-span-2">
              <label htmlFor="f-instructions" className="eyebrow mb-2 block">Delivery instructions <span className="font-normal normal-case tracking-normal text-muted-foreground">(optional)</span></label>
              <textarea id="f-instructions" rows={3} value={f.instructions} onChange={(e) => set("instructions", e.target.value)} className="field" />
            </div>
          </fieldset>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="bg-secondary p-5 md:p-6">
            <p className="eyebrow mb-4">Summary</p>
            <div className="flex gap-4">
              <img src={p.images[0]} alt={p.name} className="aspect-[4/5] w-20 object-cover" />
              <div className="text-sm">
                <p className="font-medium">{p.name}</p>
                <p className="text-muted-foreground">{[f.size && `Size ${f.size}`, f.color].filter(Boolean).join(" · ")}</p>
                <p className="text-muted-foreground">Qty {f.quantity}</p>
              </div>
            </div>
            <dl className="mt-6 space-y-2 border-t border-border pt-4 text-sm">
              <div className="flex justify-between"><dt>Item price</dt><dd>{inr(p.price)} × {f.quantity}</dd></div>
              <div className="flex justify-between"><dt>Shipping</dt><dd>{p.shippingCharge ? inr(p.shippingCharge) : "Free"}</dd></div>
              <div className="flex justify-between border-t border-foreground pt-3 text-base font-semibold"><dt>Pay on delivery</dt><dd>{inr(orderTotal(p, Math.max(1, f.quantity || 1)))}</dd></div>
            </dl>
            <label className="mt-6 flex cursor-pointer gap-3 text-sm">
              <input id="f-confirmed" type="checkbox" checked={f.confirmed} onChange={(e) => set("confirmed", e.target.checked)} aria-invalid={!!errors.confirmed} className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-accent)]" />
              I confirm that my contact details and delivery address are correct.
            </label>
            {errors.confirmed && <p className="mt-1 text-xs text-destructive">{errors.confirmed}</p>}
            {errors.product && <p className="mt-2 text-xs text-destructive">{errors.product}</p>}
            <button disabled={submitting} className="btn-ink mt-6 w-full">{submitting ? "Sending request…" : "Submit order request"}</button>
            <p className="mt-3 text-xs text-muted-foreground">
              We'll only use these details to process this request. See our <Link to="/legal/$slug" params={{ slug: "privacy" }} className="underline">privacy policy</Link>.
            </p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function OrderConfirmation({ product: p, orderRef, form }: { product: Product; orderRef: string; form: OrderInput }) {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 md:py-24">
      <p className="eyebrow text-accent">Order reference · {orderRef}</p>
      <h1 className="display-xl mt-4 uppercase">Your request<br />is in.</h1>
      <p className="mt-5 max-w-lg text-muted-foreground">Your order request has been received. Our team will verify your delivery details before dispatching.</p>
      <div className="mt-10 grid gap-8 border-t border-foreground pt-8 sm:grid-cols-[120px_1fr]">
        <img src={p.images[0]} alt={p.name} className="aspect-[4/5] w-full object-cover" />
        <div className="space-y-5 text-sm">
          <div>
            <p className="font-display text-2xl">{p.name}</p>
            <p className="text-muted-foreground">{[form.size && `Size ${form.size}`, form.color, `Qty ${form.quantity}`].filter(Boolean).join(" · ")}</p>
          </div>
          <div>
            <p className="eyebrow mb-1">Deliver to</p>
            <p>{form.fullName} · {form.mobile}</p>
            <p className="text-muted-foreground">{[form.house, form.street, form.landmark, form.city, form.state, form.pin].filter(Boolean).join(", ")}</p>
          </div>
          <div>
            <p className="eyebrow mb-1">Amount payable on delivery</p>
            <p className="text-2xl font-semibold">{inr(orderTotal(p, form.quantity))}</p>
          </div>
        </div>
      </div>
      <div className="mt-12 flex flex-wrap gap-3">
        <Link to="/collections/$slug" params={{ slug: "discover" }} className="btn-ink">Keep discovering</Link>
        <Link to="/product/$slug" params={{ slug: p.slug }} className="btn-outline">Back to the piece</Link>
      </div>
    </div>
  );
}
