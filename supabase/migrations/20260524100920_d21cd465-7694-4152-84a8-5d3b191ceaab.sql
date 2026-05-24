
-- ROLES
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "users view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "admins manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-grant admin to FIRST user (bootstrap)
CREATE OR REPLACE FUNCTION public.handle_first_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  END IF;
  RETURN NEW;
END;
$$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_first_user();

-- updated_at helper
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- PROJECTS
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  location TEXT,
  capacity_mw NUMERIC,
  status TEXT DEFAULT 'planning',
  description TEXT,
  cover_photo_url TEXT,
  sort_order INT DEFAULT 0,
  is_published BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published projects" ON public.projects FOR SELECT USING (is_published = true);
CREATE POLICY "admin all projects" ON public.projects FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER tg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- PHOTOS
CREATE TABLE public.photos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  caption TEXT,
  alt_text TEXT,
  category TEXT,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  sort_order INT DEFAULT 0,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read photos" ON public.photos FOR SELECT USING (true);
CREATE POLICY "admin all photos" ON public.photos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- DOCUMENTS
CREATE TABLE public.documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  category TEXT,
  file_url TEXT NOT NULL,
  file_size_bytes BIGINT,
  is_public BOOLEAN DEFAULT true,
  uploaded_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read public documents" ON public.documents FOR SELECT USING (is_public = true);
CREATE POLICY "admin all documents" ON public.documents FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- TEAM
CREATE TABLE public.team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  role TEXT,
  department TEXT,
  bio TEXT,
  photo_url TEXT,
  sort_order INT DEFAULT 0,
  is_visible BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.team_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read visible team" ON public.team_members FOR SELECT USING (is_visible = true);
CREATE POLICY "admin all team" ON public.team_members FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- NEWS
CREATE TABLE public.news (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  cover_image_url TEXT,
  excerpt TEXT,
  content TEXT,
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.news ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read published news" ON public.news FOR SELECT USING (is_published = true);
CREATE POLICY "admin all news" ON public.news FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER tg_news_updated BEFORE UPDATE ON public.news FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- PAGE CONTENT
CREATE TABLE public.page_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key TEXT NOT NULL UNIQUE,
  content_json JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.page_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read page content" ON public.page_content FOR SELECT USING (true);
CREATE POLICY "admin all page content" ON public.page_content FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));
CREATE TRIGGER tg_page_content_updated BEFORE UPDATE ON public.page_content FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- CONTACT SUBMISSIONS
CREATE TABLE public.contact_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  is_read BOOLEAN DEFAULT false,
  submitted_at TIMESTAMPTZ DEFAULT now()
);
ALTER TABLE public.contact_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "anyone can submit" ON public.contact_submissions FOR INSERT WITH CHECK (true);
CREATE POLICY "admin read contacts" ON public.contact_submissions FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete contacts" ON public.contact_submissions FOR DELETE TO authenticated USING (public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update contacts" ON public.contact_submissions FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- JUNCTIONS
CREATE TABLE public.project_photos (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  photo_id UUID REFERENCES public.photos(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, photo_id)
);
ALTER TABLE public.project_photos ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read project_photos" ON public.project_photos FOR SELECT USING (true);
CREATE POLICY "admin all project_photos" ON public.project_photos FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE public.project_documents (
  project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
  document_id UUID REFERENCES public.documents(id) ON DELETE CASCADE,
  PRIMARY KEY (project_id, document_id)
);
ALTER TABLE public.project_documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read project_documents" ON public.project_documents FOR SELECT USING (true);
CREATE POLICY "admin all project_documents" ON public.project_documents FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- STORAGE BUCKETS
INSERT INTO storage.buckets (id, name, public) VALUES
  ('photos','photos',true),
  ('documents','documents',true),
  ('team-photos','team-photos',true),
  ('news-covers','news-covers',true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public read, admin write
CREATE POLICY "public read storage" ON storage.objects FOR SELECT USING (bucket_id IN ('photos','documents','team-photos','news-covers'));
CREATE POLICY "admin upload storage" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id IN ('photos','documents','team-photos','news-covers') AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin update storage" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id IN ('photos','documents','team-photos','news-covers') AND public.has_role(auth.uid(),'admin'));
CREATE POLICY "admin delete storage" ON storage.objects FOR DELETE TO authenticated USING (bucket_id IN ('photos','documents','team-photos','news-covers') AND public.has_role(auth.uid(),'admin'));
