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
    description: "The 'Who We Are' company teaser shown below the featured projects.",
    fields: [
      { key: "eyebrow", label: "Small label above title", type: "text", placeholder: "Who We Are" },
      { key: "title", label: "Section title", type: "text", placeholder: "Engineered for Nepal. Built to last." },
      { key: "body", label: "Body paragraph", type: "textarea", placeholder: "Since 2011 we've engineered hydropower infrastructure…" },
      { key: "cta_label", label: "Link text", type: "text", placeholder: "Learn more" },
      { key: "cta_link", label: "Link destination", type: "url", placeholder: "/about" },
    ],
  },
  {
    key: "home.stats",
    label: "Home — Stats bar",
    description: "The four key numbers shown below the hero (e.g. 55 MW, 3+ projects).",
    fields: [
      { key: "stat1_value", label: "Stat 1 — Number", type: "text", placeholder: "55" },
      { key: "stat1_suffix", label: "Stat 1 — Suffix", type: "text", placeholder: "MW" },
      { key: "stat1_label", label: "Stat 1 — Label", type: "text", placeholder: "Installed Capacity" },
      { key: "stat2_value", label: "Stat 2 — Number", type: "text", placeholder: "3" },
      { key: "stat2_suffix", label: "Stat 2 — Suffix", type: "text", placeholder: "+" },
      { key: "stat2_label", label: "Stat 2 — Label", type: "text", placeholder: "Active Projects" },
      { key: "stat3_value", label: "Stat 3 — Number", type: "text", placeholder: "14" },
      { key: "stat3_suffix", label: "Stat 3 — Suffix", type: "text", placeholder: "yrs" },
      { key: "stat3_label", label: "Stat 3 — Label", type: "text", placeholder: "In Operation" },
      { key: "stat4_value", label: "Stat 4 — Number", type: "text", placeholder: "100k" },
      { key: "stat4_suffix", label: "Stat 4 — Suffix", type: "text", placeholder: "+" },
      { key: "stat4_label", label: "Stat 4 — Label", type: "text", placeholder: "Households Served" },
    ],
  },
  {
    key: "home.capital",
    label: "Home — Capital bar",
    description: "Authorized Capital, Paid Up Capital, and Issued Capital shown as a rolling-number bar below the hero stats.",
    fields: [
      { key: "authorized_value",  label: "Authorized Capital — Amount",  type: "text", placeholder: "10,00,00,000" },
      { key: "authorized_suffix", label: "Authorized Capital — Suffix",  type: "text", placeholder: "NPR" },
      { key: "paidup_value",      label: "Paid Up Capital — Amount",     type: "text", placeholder: "7,50,00,000" },
      { key: "paidup_suffix",     label: "Paid Up Capital — Suffix",     type: "text", placeholder: "NPR" },
      { key: "issued_value",      label: "Issued Capital — Amount",      type: "text", placeholder: "7,50,00,000" },
      { key: "issued_suffix",     label: "Issued Capital — Suffix",      type: "text", placeholder: "NPR" },
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
      { key: "body", label: "Message body (paragraphs separated by blank lines)", type: "textarea" },
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
    description: "Hero section and member selection for the Our Team page.",
    fields: [
      { key: "hero_title", label: "Page heading", type: "text", placeholder: "Our Team" },
      { key: "hero_eyebrow", label: "Small label above heading", type: "text", placeholder: "About Us" },
      { key: "intro_text", label: "Intro paragraph (shown above the team grid)", type: "textarea", placeholder: "The people driving our mission…" },
      {
        key: "member_ids",
        label: "Team members to display",
        type: "team_member_picker",
        hint: "Select which members appear on the Our Team page. Leave empty to show all visible members.",
      },
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
    queryKey: ["page-content"],
    queryFn: async () => (await supabase.from("page_content").select("*")).data ?? [],
  });
  const { data: teamMembers } = useQuery({
    queryKey: ["team"],
    queryFn: async () =>
      (await supabase.from("team_members").select("id, name, role, photo_url, is_visible").order("sort_order")).data ?? [],
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
          onSaved={() => qc.invalidateQueries({ queryKey: ["page-content"] })}
        />
      </div>
    </div>
  );
}

type TeamMember = { id: string; name: string; role: string | null; photo_url: string | null; is_visible: boolean | null };

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

  // Sync values when parent passes fresh initial data (e.g. after cache loads)
  useEffect(() => {
    setValues(initial);
  // template.key is already handled by the `key` prop on SectionEditor,
  // but initial may arrive asynchronously after sections query resolves.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [template.key, JSON.stringify(initial)]);

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
        {template.fields.map((f) =>
          f.type === "team_member_picker" ? (
            // Must NOT be a <label> — clicking label text would trigger the first button inside
            <div key={f.key} className="block text-sm">
              <span className="block font-medium">{f.label}</span>
              {f.hint && <span className="block text-xs text-muted-foreground">{f.hint}</span>}
              <TeamMemberPicker
                fieldKey={f.key}
                value={values[f.key] ?? ""}
                onChange={(v) => setValues({ ...values, [f.key]: v })}
                members={teamMembers}
                multi={f.key === "member_ids"}
              />
            </div>
          ) : (
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
                  type="text"
                  placeholder={f.placeholder}
                  value={values[f.key] ?? ""}
                  onChange={(e) => setValues({ ...values, [f.key]: e.target.value })}
                  className="mt-1 w-full rounded-md border bg-background px-3 py-2"
                />
              )}
            </label>
          )
        )}
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

  // Move a selected member up or down in the order
  function moveSelected(id: string, dir: -1 | 1) {
    const arr = [...selectedIds];
    const i = arr.indexOf(id);
    if (i < 0) return;
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    onChange(arr.join(","));
  }

  const unselected = members.filter((m) => !selectedIds.includes(m.id));

  return (
    <div className="mt-3 space-y-3">
      {members.length === 0 && (
        <p className="text-xs text-muted-foreground">No team members yet. Add some in Team admin first.</p>
      )}

      {/* ── Selected members (ordered) ── */}
      {multi && selectedIds.length > 0 && (
        <div>
          <p className="mb-1.5 text-xs font-semibold text-foreground">
            Selected — drag ↑↓ buttons to reorder
          </p>
          <div className="space-y-1.5">
            {selectedIds.map((id, idx) => {
              const m = members.find((x) => x.id === id);
              if (!m) return null;
              return (
                <div key={id} className="flex items-center gap-2 rounded-lg border border-primary bg-primary/8 px-3 py-2 text-sm">
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                    {m.photo_url
                      ? <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><User className="h-3 w-3 text-muted-foreground" /></div>}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium text-primary">{m.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{m.role}</span>
                  </span>
                  {/* Order badge */}
                  <span className="shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">
                    {idx + 1}
                  </span>
                  {/* Move buttons */}
                  <div className="flex shrink-0 flex-col gap-0.5">
                    <button
                      type="button"
                      onClick={() => moveSelected(id, -1)}
                      disabled={idx === 0}
                      className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-secondary disabled:opacity-30"
                      title="Move up"
                    >▲</button>
                    <button
                      type="button"
                      onClick={() => moveSelected(id, 1)}
                      disabled={idx === selectedIds.length - 1}
                      className="flex h-5 w-5 items-center justify-center rounded text-muted-foreground hover:bg-secondary disabled:opacity-30"
                      title="Move down"
                    >▼</button>
                  </div>
                  {/* Remove */}
                  <button
                    type="button"
                    onClick={() => toggle(id)}
                    className="shrink-0 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                    title="Remove"
                  >✕</button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── Unselected members ── */}
      {(multi ? unselected : members).length > 0 && (
        <div>
          {multi && selectedIds.length > 0 && (
            <p className="mb-1.5 text-xs font-semibold text-muted-foreground">Add more</p>
          )}
          <div className="grid gap-1.5 sm:grid-cols-2">
            {(multi ? unselected : members).map((m) => {
              const selected = !multi && selectedIds.includes(m.id);
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggle(m.id)}
                  className={`flex items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition ${
                    selected ? "border-primary bg-primary/10 text-primary" : "border-border hover:border-primary/40 hover:bg-secondary"
                  }`}
                >
                  <div className="h-8 w-8 shrink-0 overflow-hidden rounded-full bg-muted">
                    {m.photo_url
                      ? <img src={m.photo_url} alt={m.name} className="h-full w-full object-cover" />
                      : <div className="flex h-full w-full items-center justify-center"><User className="h-3 w-3 text-muted-foreground" /></div>}
                  </div>
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{m.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{m.role}</span>
                    {m.is_visible === false && (
                      <span className="mt-0.5 inline-block rounded-full bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">hidden</span>
                    )}
                  </span>
                  {selected && (
                    <span className="ml-auto shrink-0 rounded-full bg-primary px-1.5 py-0.5 text-[10px] font-bold text-primary-foreground">✓</span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
