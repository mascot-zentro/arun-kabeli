import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Save, Info, User } from "lucide-react";

export const Route = createFileRoute("/admin/pages")({ component: AdminPages });

type FieldType = "text" | "textarea" | "url" | "team_member_picker";
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
    key: "about.story",
    label: "About — Our story",
    description: "Company history and background.",
    fields: [
      { key: "title", label: "Section title", type: "text", placeholder: "Our story" },
      { key: "body", label: "Story (paragraphs separated by blank lines)", type: "textarea" },
    ],
  },
  {
    key: "about.mission",
    label: "About — Mission & vision",
    description: "Two short statements shown side-by-side.",
    fields: [
      { key: "mission_title", label: "Mission title", type: "text", placeholder: "Our mission" },
      { key: "mission_body", label: "Mission text", type: "textarea" },
      { key: "vision_title", label: "Vision title", type: "text", placeholder: "Our vision" },
      { key: "vision_body", label: "Vision text", type: "textarea" },
    ],
  },
  {
    key: "about.chairman",
    label: "About — Message from Chairman",
    description: "Hero section on the Message from Chairman page.",
    fields: [
      {
        key: "team_member_id",
        label: "Chairman (from team members)",
        type: "team_member_picker",
        hint: "Select the team member to feature. Their name, role, and photo are pulled from the Team admin.",
      },
      { key: "hero_title", label: "Page heading", type: "text", placeholder: "Message from the Chairman" },
      { key: "hero_eyebrow", label: "Small label above heading", type: "text", placeholder: "About Us" },
      { key: "intro_text", label: "Pull quote (shown in blockquote)", type: "textarea", placeholder: "A word from our Chairman…" },
      { key: "body", label: "Full message / body text (paragraphs separated by blank lines)", type: "textarea" },
    ],
  },
  {
    key: "about.board",
    label: "About — Board of Directors",
    description: "Hero section on the Board of Directors page.",
    fields: [
      { key: "hero_title", label: "Page heading", type: "text", placeholder: "Board of Directors" },
      { key: "hero_eyebrow", label: "Small label above heading", type: "text", placeholder: "About Us" },
      { key: "intro", label: "Intro paragraph (shown above the board members)", type: "textarea", placeholder: "Our board brings together expertise in…" },
      {
        key: "member_ids",
        label: "Board members (from team members)",
        type: "team_member_picker",
        hint: "Select all board members. Their photo, name, and role are pulled automatically.",
      },
    ],
  },
  {
    key: "about.team",
    label: "About — Our Team",
    description: "Hero section on the Our Team page.",
    fields: [
      { key: "hero_title", label: "Page heading", type: "text", placeholder: "Our Team" },
      { key: "hero_eyebrow", label: "Small label above heading", type: "text", placeholder: "About Us" },
      { key: "intro_text", label: "Intro paragraph (shown above the team grid)", type: "textarea", placeholder: "The people driving our mission…" },
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
  const { data: teamMembers } = useQuery({
    queryKey: ["admin-team"],
    queryFn: async () =>
      (await supabase.from("team_members").select("id, name, role, photo_url").eq("is_visible", true).order("sort_order")).data ?? [],
  });

  const tpl = TEMPLATES.find((t) => t.key === active)!;
  const existing = sections?.find((s) => s.section_key === active);
  const initial = (existing?.content_json as Record<string, string>) ?? {};

  return (
    <div>
      <h1 className="font-display text-3xl font-bold">Page content</h1>
      <p className="text-muted-foreground">Edit the text that appears on your website pages. Pick a section, fill in the fields, then click Save.</p>

      <div className="mt-6 grid gap-6 lg:grid-cols-[260px_1fr]">
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

        <SectionEditor
          key={tpl.key}
          template={tpl}
          initial={initial}
          existingId={existing?.id}
          teamMembers={teamMembers ?? []}
          onSaved={() => qc.invalidateQueries({ queryKey: ["admin-pages"] })}
        />
      </div>
    </div>
  );
}

type TeamMember = { id: string; name: string; role: string | null; photo_url: string | null };

function SectionEditor({
  template, initial, existingId, teamMembers, onSaved,
}: {
  template: Template;
  initial: Record<string, string>;
  existingId?: string;
  teamMembers: TeamMember[];
  onSaved: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>(initial);
  const [saving, setSaving] = useState(false);

  useEffect(() => setValues(initial), [template.key]);

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
            {f.type === "team_member_picker" ? (
              <TeamMemberPicker
                fieldKey={f.key}
                value={values[f.key] ?? ""}
                onChange={(v) => setValues({ ...values, [f.key]: v })}
                members={teamMembers}
                multi={f.key === "member_ids"}
              />
            ) : f.type === "textarea" ? (
              <textarea
                rows={5}
                placeholder={f.placeholder}
                value={values[f.key] ?? ""}
                onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                className="mt-1 w-full rounded-md border bg-background px-3 py-2"
              />
            ) : (
              <input
                type="text"
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

function TeamMemberPicker({
  fieldKey, value, onChange, members, multi,
}: {
  fieldKey: string;
  value: string;
  onChange: (v: string) => void;
  members: TeamMember[];
  multi: boolean;
}) {
  const selectedIds = multi ? value.split(",").filter(Boolean) : [value];

  function toggle(id: string) {
    if (!multi) { onChange(value === id ? "" : id); return; }
    const next = selectedIds.includes(id)
      ? selectedIds.filter((s) => s !== id)
      : [...selectedIds, id];
    onChange(next.join(","));
  }

  return (
    <div className="mt-2 grid gap-2 sm:grid-cols-2">
      {members.length === 0 && (
        <p className="col-span-full text-xs text-muted-foreground">No team members yet. Add some in Team admin first.</p>
      )}
      {members.map((m) => {
        const selected = selectedIds.includes(m.id);
        return (
          <button
            key={m.id}
            type="button"
            onClick={() => toggle(m.id)}
            className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
              selected ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 hover:bg-secondary"
            }`}
          >
            <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full bg-muted">
              {m.photo_url
                ? <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" />
                : <div className="flex h-full w-full items-center justify-center"><User className="h-4 w-4 text-muted-foreground" /></div>}
            </div>
            <span>
              <span className="block font-medium">{m.name}</span>
              <span className="block text-xs text-muted-foreground">{m.role}</span>
            </span>
            {selected && (
              <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">✓</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
