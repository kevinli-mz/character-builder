-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Note: JWT secret is automatically managed by Supabase, no need to set it manually

-- User Profiles Table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  display_name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id)
);

-- Add is_admin column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_profiles' AND column_name = 'is_admin'
  ) THEN
    ALTER TABLE user_profiles ADD COLUMN is_admin BOOLEAN DEFAULT FALSE;
  END IF;
END $$;

-- Categories Table (Global, managed by admins only)
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  z_index INTEGER NOT NULL DEFAULT 0,
  default_asset_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add created_by column if it doesn't exist (for existing tables)
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'categories' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE categories ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
END $$;

-- Assets Table (Global, managed by admins only)
CREATE TABLE IF NOT EXISTS assets (
  id TEXT PRIMARY KEY,
  category_id TEXT NOT NULL,
  name TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  public_url TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add foreign key and created_by column if they don't exist (for existing tables)
DO $$ 
DECLARE
  pk_constraint_name TEXT;
  pk_columns TEXT;
BEGIN
  -- Add created_by column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'assets' AND column_name = 'created_by'
  ) THEN
    ALTER TABLE assets ADD COLUMN created_by UUID REFERENCES auth.users(id);
  END IF;
  
  -- Check if categories table has a primary key and what it is
  SELECT tc.constraint_name, string_agg(kcu.column_name, ', ' ORDER BY kcu.ordinal_position)
  INTO pk_constraint_name, pk_columns
  FROM information_schema.table_constraints tc
  JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
  WHERE tc.table_name = 'categories' 
    AND tc.constraint_type = 'PRIMARY KEY'
  GROUP BY tc.constraint_name
  LIMIT 1;
  
  -- If primary key exists but is not on id alone, we need to fix it
  IF pk_constraint_name IS NOT NULL AND pk_columns != 'id' THEN
    -- Drop existing foreign keys that depend on the old primary key first
    ALTER TABLE assets DROP CONSTRAINT IF EXISTS assets_category_id_fkey;
    -- Drop the old primary key
    EXECUTE format('ALTER TABLE categories DROP CONSTRAINT %I', pk_constraint_name);
    -- Add the new primary key on id only
    ALTER TABLE categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
  ELSIF pk_constraint_name IS NULL THEN
    -- Add primary key if it doesn't exist
    ALTER TABLE categories ADD CONSTRAINT categories_pkey PRIMARY KEY (id);
  END IF;
  
  -- Add foreign key if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE table_name = 'assets' AND constraint_name = 'assets_category_id_fkey'
  ) THEN
    ALTER TABLE assets ADD CONSTRAINT assets_category_id_fkey 
      FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE;
  END IF;
END $$;

-- Characters Table (saved character configurations)
CREATE TABLE IF NOT EXISTS characters (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  character_state JSONB NOT NULL,
  name TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_assets_category_id ON assets(category_id);
CREATE INDEX IF NOT EXISTS idx_characters_user_id ON characters(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_is_admin ON user_profiles(is_admin) WHERE is_admin = TRUE;

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE characters ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Users can view own profile"
  ON user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can view admin status"
  ON user_profiles FOR SELECT
  USING (TRUE); -- Everyone can see if someone is admin (for UI purposes)

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Only admins can update admin status
CREATE POLICY "Admins can update admin status"
  ON user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policies for categories
-- Everyone can view categories (they are global/shared)
CREATE POLICY "Everyone can view categories"
  ON categories FOR SELECT
  USING (TRUE);

-- Only admins can insert/update/delete categories
CREATE POLICY "Admins can insert categories"
  ON categories FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update categories"
  ON categories FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete categories"
  ON categories FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policies for assets
-- Everyone can view assets (they are global/shared)
CREATE POLICY "Everyone can view assets"
  ON assets FOR SELECT
  USING (TRUE);

-- Only admins can insert/update/delete assets
CREATE POLICY "Admins can insert assets"
  ON assets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can update assets"
  ON assets FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

CREATE POLICY "Admins can delete assets"
  ON assets FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE user_id = auth.uid() AND is_admin = TRUE
    )
  );

-- RLS Policies for characters
CREATE POLICY "Users can view own characters"
  ON characters FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own characters"
  ON characters FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own characters"
  ON characters FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own characters"
  ON characters FOR DELETE
  USING (auth.uid() = user_id);

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers to automatically update updated_at
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_categories_updated_at
  BEFORE UPDATE ON categories
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at
  BEFORE UPDATE ON assets
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_characters_updated_at
  BEFORE UPDATE ON characters
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to automatically create user profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  has_admin BOOLEAN;
BEGIN
  -- Check if there are any admins (if not, make this user admin)
  SELECT COUNT(*) > 0 INTO has_admin 
  FROM public.user_profiles 
  WHERE is_admin = TRUE;
  
  INSERT INTO public.user_profiles (user_id, email, display_name, is_admin)
  VALUES (
    NEW.id, 
    NEW.email, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', NULL),
    NOT has_admin -- Make admin if no admins exist
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

