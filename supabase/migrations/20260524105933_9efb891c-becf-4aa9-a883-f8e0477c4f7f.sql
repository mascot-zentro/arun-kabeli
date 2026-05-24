ALTER TABLE public.documents
  ADD COLUMN IF NOT EXISTS show_as_popup boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS popup_sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_documents_popup ON public.documents (show_as_popup, popup_sort_order) WHERE show_as_popup = true;