-- Set specific user as admin by email
-- Run this in Supabase SQL Editor

-- Option 1: Set specific user as admin
UPDATE user_profiles
SET is_admin = TRUE
WHERE email = 'kevinli105@hotmail.com';

-- Option 2: If no admins exist, set the first user (oldest) as admin
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM user_profiles WHERE is_admin = TRUE) THEN
    UPDATE user_profiles
    SET is_admin = TRUE
    WHERE user_id = (
      SELECT user_id 
      FROM user_profiles 
      ORDER BY created_at ASC 
      LIMIT 1
    );
  END IF;
END $$;

-- Verify the update
SELECT user_id, email, is_admin, display_name, created_at
FROM user_profiles
ORDER BY created_at ASC;

