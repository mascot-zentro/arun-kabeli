import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Info } from "lucide-react";

export const Route = createFileRoute("/admin/pages")({ component: AdminPages });

// Friendly templates — each section is a list of fields. No JSON for the admin.
type FieldType = "text" | "textarea" | "url";
type Field = { key: string; label: string; type: FieldType; hint?: string; placeholder?: string };
type Template = { key: string; label: string; description: string; fields: Field[] };

const TEMPLATES: Template[] = [
  {
    key: "home.hero",
    label: "Home — Hero",
    description: "The big banner at the top of the home page.",
    fields: [
      { key: "eyebrow", label: "Small label above title", type: "text", placeholder: "Powering Nepal's future" },
      { key: "title", label: "Main headline", type: "text", placeholder: "Clean hydropower from the Himalayas" },
      { key: "subtitle", label: "Subtitle / short paragraph", type: "textarea" },
      { key: "cta_label", label: "Button text", type: "text", placeholder: "Explore projects" },
      { key: "cta_link", label: "Button link", type: "url", placeholder: "/projects" },
    ],
  },
  {
    key: "home.intro",
    label: "Home — Intro section",
    description: "Short company introduction below the hero.",
    fields: [
      { key: "title", label: "Section title", type: "text" },
      { key: "body", label: "Body text", type: "textarea" },
    ],
  },
  {
    key: "about.mission",
    label: "About — Mission, Vision & Values",
    description: "The three cards shown on the About page.",
    fields: [
      { key: "mission_title", label: "Mission card title", type: "text", placeholder: "Mission" },
      { key: "mission_body", label: "Mission text", type: "textarea" },
      { key: "vision_title", label: "Vision card title", type: "text", placeholder: "Vision" },
      { key: "vision_body", label: "Vision text", type: "textarea" },
      { key: "values_title", label: "Values card title", type: "text", placeholder: "Values" },
      { key: "values_body", label: "Values text", type: "textarea" },
    ],
  },
  {
    key: "about.chairman",
    label: "About — Chairman page",
    description: "Hero section on the Message from Chairman page.",
    fields: [
      { key: "hero_eyebrow", label: "Small label above title", type: "text", placeholder: "About Us" },
      { key: "hero_title", label: "Page heading", type: "text", placeholder: "Message from the Chairman" },
      { key: "intro_text", label: "Intro paragraph (optional)", type: "textarea", hint: "Shown below the heading in the hero. Leave empty to hide." },
    ],
  },
  {
    key: "about.board",
    label: "About — Board of Directors page",
    description: "Hero section on the Board of Directors page.",
    fields: [
      { key: "hero_eyebrow", label: "Small label above title", type: "text", placeholder: "About Us" },
      { key: "hero_title", label: "Page heading", type: "text", placeholder: "Board of Directors" },
      { key: "intro_text", label: "Intro paragraph (optional)", type: "textarea", hint: "Shown below the heading in the hero. Leave empty to hide." },
    ],
  },
  {
    key: "about.team",
    label: "About — Our Team page",
    description: "Hero section on the Our Team page.",
    fields: [
      { key: "hero_eyebrow", label: "Small label above title", type: "text", placeholder: "About Us" },
      { key: "hero_title", label: "Page heading", type: "text", placeholder: "Our Team" },
      { key: "intro_text", label: "Intro paragraph (optional)", type: "textarea", hint: "Shown below the heading in the hero. Leave empty to hide." },
    ],
  },
  {
    key: "about.story",
    label: "About — Our Story section",
    description: "Company history and background on the About page.",
    fields: [
      { key: "title", label: "Section title", type: "text", placeholder: "Built on the Arun & Kabeli rivers." },
      { key: "body", label: "Story (paragraphs separated by blank lines)", type: "textarea" },
    ],
  },
  {
    key: "contact.info",
    label: "Contact — Office details",
    description: "Address and contact details shown on the Contact page.",
    fields: [
      { key: "address", label: "Office address", type: "textarea" },
      { key: "phone", label: "Phone", type: "text", placeholder: "+977 ..." },
      { key: "email", label: "Email", type: "text", placeholder: "info@arunkabeli.com" },
      { key: "hours", label: "Office hours", type: "text", placeholder: "Sun–Fri, 9am – 5pm" },
    ],
  },
];

function AdminPages() {
  const qc = useQueryClient();
  const [active, setActive] = useState<string>(TEMPLATES[0].key);
  const { data: sections } = useQuery({
    queryKey: ["admin-pages"],
    queryFn: async () => (await supabase.from("page_content").select("*")).data ?? [],
  });

  const tpl = TEMPLATES.find((t) => t.key === active)!;
  const existing = sections?.find((s) => s.section_key === active);
  const initial = (existing?.content_json as Record<string, string>) ?? {};

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Page content</h1>
      <p className="text-muted-foreground">Edit the text that appears on your website pages. Pick a section, fill in the fields, then click Save.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Section picker */}
        <nav className="space-y-1">
          {TEMPLATES.map((t) => {
            const filled = sections?.some((s) => s.section_key === t.key);
            return (
              <button
                key={t.key}
                onClick={() => setActive(t.key)}
                className={`flex w-full items-start justify-between gap-2 rounded-md border px-3 py-2 text-left text-sm transition ${active === t.key ? "border-accent bg-accent/10" : "border-transparent hover:bg-secondary"}`}
              >
                <span>
                  <span className="block font-semibold">{t.label}</span>
                  <span className="block text-xs text-muted-foreground">{t.description}</span>
                </span>
                {filled && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-accent" title="Has content" />}
              </button>
            );
          })}
        </nav>

        {/* Editor */}
        <SectionEditor
          key={tpl.key}
          template={tpl}
          initial={initial}
          existingId={existing?.id}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-pages"] })}
        />
      </div>
    </div>
  );
}

function SectionEditor({ template, initial, existingId, onSaved }: { template: Template; initial: Record<string, string>; existingId?: string; onSaved: () => void }) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => setValues(initial), [template.key]); // reset on section change

  async function save() {
    setSaving(true);
    const payload = { section_key: template.key, content_json: values };
    const { error } = existingId
      ? await supabase.from("page_content").update(payload).eq("id", existingId)
      : await supabase.from("page_content").insert(payload);
    setSaving(false);
    if (error) toast.error(error.message);
    else { toast.success("Saved"); onSaved(); }
  }

  return (
    <div className="rounded-xl border bg-card p-6">
      <div className="mb-4 flex items-start gap-2 rounded-md bg-secondary/60 p-3 text-xs text-muted-foreground">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <span>Editing <strong className="text-foreground">{template.label}</strong>. Leave a field empty to hide it on the site.</span>
      </div>

      <div className="space-y-4">
        {template.fields.map((f) => (
          <label key={f.key} className="block text-sm">
            <span className="font-medium">{f.label}</span>
            {f.hint && <span className="block text-xs text-muted-foreground">{f.hint}</span>}
            {f.type === "textarea" ? (
              <textarea
                rows={5}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              />
            ) : (
              <input
                type={f.type === "url" ? "text" : "text"}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              />
            )}
          </label>
        ))}
      </div>

      <button
        onClick={save}
        disabled={saving}
        className="mt-6 inline-flex items-center gap-2 rounded-md bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
      >
        <Save className="h-4 w-4" />
        {saving ? "Saving…" : "Save changes"}
      </button>
    </div>
  );
}
