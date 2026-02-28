-- Add icon column to categories (stores e.g. "lucide:Shirt" or "hi2:UserCircleIcon")
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon TEXT;
