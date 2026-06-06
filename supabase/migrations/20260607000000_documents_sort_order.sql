-- Add sort_order to documents for admin-controlled listing order
ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS sort_order INTEGER NOT NULL DEFAULT 0;

-- Backfill: assign sort_order based on upload date (oldest first = lowest number)
WITH ranked AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY uploaded_at ASC) - 1 AS rn
  FROM public.documents
)
UPDATE public.documents d
SET sort_order = r.rn
FROM ranked r
WHERE d.id = r.id;

CREATE INDEX IF NOT EXISTS idx_documents_sort_order ON public.documents (sort_order);
