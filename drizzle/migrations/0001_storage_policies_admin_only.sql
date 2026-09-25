-- Only admins may manage product files/assets directly.
-- Student downloads never touch these policies: entitlement is verified in a
-- server function which then mints a short-lived signed URL.
CREATE POLICY "admins manage product files" ON storage.objects FOR ALL TO authenticated
USING (bucket_id IN ('product-files','product-assets') AND public.has_role(auth.uid(),'admin'))
WITH CHECK (bucket_id IN ('product-files','product-assets') AND public.has_role(auth.uid(),'admin'));