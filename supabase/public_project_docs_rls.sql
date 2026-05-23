-- Permitir lectura, inserción y actualización de proyectos al publico
CREATE POLICY "Allow public read projects" ON public.projects FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert projects" ON public.projects FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update projects" ON public.projects FOR UPDATE TO public USING (true) WITH CHECK (true);

-- Permitir lectura e inserción a project_documents al publico
CREATE POLICY "Allow public read project_documents" ON public.project_documents FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert project_documents" ON public.project_documents FOR INSERT TO public WITH CHECK (true);

-- Permitir subir documentos al storage "project-documents"
CREATE POLICY "Allow public upload project_documents" ON storage.objects FOR INSERT TO public WITH CHECK (bucket_id = 'project-documents');
CREATE POLICY "Allow public read project_documents_storage" ON storage.objects FOR SELECT TO public USING (bucket_id = 'project-documents');
