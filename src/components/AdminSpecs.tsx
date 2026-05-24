import { Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export function AdminSpecs({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <button type="button" className="inline-flex items-center gap-1 rounded-full border border-accent/40 bg-accent/10 px-2.5 py-1 text-xs font-medium text-accent hover:bg-accent/20" aria-label="Specifications">
            <Info className="h-3.5 w-3.5" />Specs
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom" align="start" className="max-w-xs">
          <ul className="space-y-1.5 text-xs">
            {items.map((i) => (
              <li key={i.label} className="flex gap-2">
                <span className="min-w-[110px] font-semibold opacity-80">{i.label}:</span>
                <span className="opacity-95">{i.value}</span>
              </li>
            ))}
          </ul>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}

export const SPECS = {
  projectCover: [
    { label: "File type", value: "JPG, PNG, WebP" },
    { label: "Max file size", value: "5 MB" },
    { label: "Recommended", value: "1600×900 px (16:9)" },
    { label: "Min dimensions", value: "1200×675 px" },
    { label: "Storage bucket", value: "photos (public)" },
  ],
  galleryPhoto: [
    { label: "File type", value: "JPG, PNG, WebP" },
    { label: "Max file size", value: "5 MB each" },
    { label: "Recommended", value: "1920×1280 px" },
    { label: "Aspect ratio", value: "3:2 or 16:9" },
    { label: "Multi-upload", value: "Yes — select multiple" },
    { label: "Storage bucket", value: "photos (public)" },
  ],
  document: [
    { label: "File type", value: "PDF, DOC, DOCX, XLSX" },
    { label: "Max file size", value: "25 MB" },
    { label: "Recommended", value: "PDF for public viewing" },
    { label: "Storage bucket", value: "documents (public)" },
  ],
  teamPhoto: [
    { label: "File type", value: "JPG, PNG, WebP" },
    { label: "Max file size", value: "2 MB" },
    { label: "Recommended", value: "800×800 px (square)" },
    { label: "Aspect ratio", value: "1:1 square" },
    { label: "Storage bucket", value: "team-photos (public)" },
  ],
  newsCover: [
    { label: "File type", value: "JPG, PNG, WebP" },
    { label: "Max file size", value: "3 MB" },
    { label: "Recommended", value: "1600×900 px (16:9)" },
    { label: "Slug format", value: "lowercase-with-dashes" },
    { label: "Content", value: "Plain text / Markdown" },
    { label: "Storage bucket", value: "news-covers (public)" },
  ],
  pageContent: [
    { label: "Format", value: "Valid JSON only" },
    { label: "Key format", value: "section.name (e.g. home.hero)" },
    { label: "Use for", value: "Reusable text blocks" },
    { label: "Validation", value: "JSON.parse on save" },
  ],
  contacts: [
    { label: "Storage", value: "contact_submissions table" },
    { label: "Export format", value: "CSV (UTF-8)" },
    { label: "Name limit", value: "1–200 chars" },
    { label: "Email limit", value: "3–320 chars" },
    { label: "Message limit", value: "1–5000 chars" },
  ],
};
