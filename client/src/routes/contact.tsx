import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/contact")({
  head: () => seo("Contact", "Get in touch with OFFSCRIPT — price reports, collaborations or questions."),
  component: Contact,
});

function Contact() {
  const [f, setF] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Partial<Record<"name" | "email" | "subject" | "message", string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "done">("idle");

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const er: Partial<Record<"name" | "email" | "subject" | "message", string>> = {};
    if (!f.name.trim()) er.name = "Enter your name.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) er.email = "Enter a valid email.";
    if (!f.subject.trim()) er.subject = "Add a subject.";
    if (f.message.trim().length < 10) er.message = "Tell us a little more (10+ characters).";
    setErrors(er);
    if (Object.keys(er).length) return;
    setState("sending");
    setTimeout(() => setState("done"), 600);
  };

  const input = (k: keyof typeof f, label: string, type = "text") => (
    <div>
      <label htmlFor={`c-${k}`} className="eyebrow mb-2 block">{label}</label>
      {k === "message" ? (
        <textarea id={`c-${k}`} rows={6} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-invalid={!!errors[k]} className="field" />
      ) : (
        <input id={`c-${k}`} type={type} value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} aria-invalid={!!errors[k]} className="field" />
      )}
      {errors[k] && <p className="mt-1 text-xs text-destructive">{errors[k]}</p>}
    </div>
  );

  return (
    <div className="mx-auto grid max-w-[1400px] gap-14 px-5 pt-12 md:grid-cols-2 md:px-10">
      <div>
        <p className="eyebrow text-accent">Contact</p>
        <h1 className="display-xl mt-4 uppercase">Say<br />hello.</h1>
        <p className="mt-6 max-w-sm text-muted-foreground">Spotted a wrong price? Want to collaborate? Just curious? Write to us.</p>
        <div className="mt-10 space-y-2 text-sm">
          <p className="eyebrow text-muted-foreground">Elsewhere</p>
          <a href="https://instagram.com/" target="_blank" rel="noopener noreferrer" className="link-underline block w-fit">Instagram ↗</a>
          <a href="https://pinterest.com/" target="_blank" rel="noopener noreferrer" className="link-underline block w-fit">Pinterest ↗</a>
          <a href="https://youtube.com/" target="_blank" rel="noopener noreferrer" className="link-underline block w-fit">YouTube ↗</a>
        </div>
      </div>
      {state === "done" ? (
        <div role="status" className="self-start border border-foreground p-8">
          <h2 className="display-md">Thanks, {f.name.split(" ")[0]}.</h2>
          <p className="mt-3 text-muted-foreground">This is a demo — your message hasn't been sent to a real inbox yet.</p>
          <button onClick={() => { setF({ name: "", email: "", subject: "", message: "" }); setState("idle"); }} className="btn-outline mt-6">Send another</button>
        </div>
      ) : (
        <form noValidate onSubmit={submit} className="space-y-5">
          {input("name", "Name")}
          {input("email", "Email", "email")}
          {input("subject", "Subject")}
          {input("message", "Message")}
          <button disabled={state === "sending"} className="btn-ink w-full sm:w-auto">{state === "sending" ? "Sending…" : "Send message"}</button>
        </form>
      )}
    </div>
  );
}
