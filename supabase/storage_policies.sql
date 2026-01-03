-- Storage Policies for character-assets bucket
-- Run this in Supabase SQL Editor after creating the bucket

-- First, ensure the bucket exists (create it in Dashboard if it doesn't)
-- Then run these policies

-- Policy 1: Allow admins to upload files
CREATE POLICY "Admins can upload files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'character-assets' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND is_admin = TRUE
  )
);

-- Policy 2: Allow everyone to view files (if bucket is public)
-- If bucket is private, use the admin-only version below
CREATE POLICY "Everyone can view files"
ON storage.objects FOR SELECT
USING (bucket_id = 'character-assets');

-- Policy 3: Allow admins to update files
CREATE POLICY "Admins can update files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'character-assets' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND is_admin = TRUE
  )
);

-- Policy 4: Allow admins to delete files
CREATE POLICY "Admins can delete files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'character-assets' AND
  EXISTS (
    SELECT 1 FROM user_profiles 
    WHERE user_id = auth.uid() AND is_admin = TRUE
  )
);

-- If you want private bucket (only admins can view), use this instead of "Everyone can view files":
-- CREATE POLICY "Admins can view files"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'character-assets' AND
--   EXISTS (
--     SELECT 1 FROM user_profiles 
--     WHERE user_id = auth.uid() AND is_admin = TRUE
--   )
-- );

