-- Supabase Storage Security Policies for 'events' bucket
-- Run this in the Supabase SQL editor to secure your storage bucket

-- First, ensure the bucket is private (not public)
-- Go to Supabase Dashboard > Storage > Buckets > events > Settings
-- Uncheck "Public bucket" if it's checked

-- Policy 1: Allow signed uploads only (service_role creates signed URLs)
-- Clients upload using the signed URL, not direct Supabase access
CREATE POLICY "Allow signed uploads"
ON storage.objects FOR INSERT
TO service_role
WITH CHECK (bucket_id = 'events');

-- Policy 2: Allow signed downloads only
-- This prevents direct public access to uploaded files
CREATE POLICY "Allow signed downloads"
ON storage.objects FOR SELECT
TO service_role
USING (bucket_id = 'events');

-- Policy 3: Prevent updates (files are immutable once uploaded)
CREATE POLICY "Prevent file updates"
ON storage.objects FOR UPDATE
USING (false);

-- Policy 4: Prevent deletes via client (only service_role can delete)
CREATE POLICY "Prevent client deletes"
ON storage.objects FOR DELETE
USING (false);

-- Policy 5: Allow service_role to delete (for admin cleanup)
CREATE POLICY "Allow service_role deletes"
ON storage.objects FOR DELETE
TO service_role
USING (bucket_id = 'events');