-- PantryPal Supabase Database Schema
-- Paste this script into your Supabase SQL Editor to set up all tables and security policies.

-- 1. SAVED RECIPES TABLE
CREATE TABLE IF NOT EXISTS public.recipes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'guest',
    title TEXT NOT NULL,
    cuisine_type TEXT,
    prep_time TEXT,
    servings TEXT,
    difficulty TEXT,
    ingredients JSONB NOT NULL DEFAULT '[]'::jsonb,
    instructions JSONB NOT NULL DEFAULT '[]'::jsonb,
    nutrition JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PROTEIN LOGS TABLE
CREATE TABLE IF NOT EXISTS public.protein_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'guest',
    item TEXT NOT NULL,
    total_protein NUMERIC NOT NULL DEFAULT 0,
    animal_protein NUMERIC DEFAULT 0,
    plant_protein NUMERIC DEFAULT 0,
    dairy_protein NUMERIC DEFAULT 0,
    total_calories NUMERIC DEFAULT 0,
    total_fiber NUMERIC DEFAULT 0,
    logged_date TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USER PREFERENCES TABLE
CREATE TABLE IF NOT EXISTS public.user_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT UNIQUE DEFAULT 'guest',
    dietary_restrictions JSONB DEFAULT '[]'::jsonb,
    favorite_cuisines JSONB DEFAULT '[]'::jsonb,
    allergies JSONB DEFAULT '[]'::jsonb,
    cooking_skill TEXT DEFAULT 'Intermediate',
    daily_protein_goal NUMERIC DEFAULT 80,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PANTRY SCAN LOGS TABLE
CREATE TABLE IF NOT EXISTS public.scan_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT DEFAULT 'guest',
    ingredients JSONB DEFAULT '[]'::jsonb,
    local_date TEXT NOT NULL,
    log_type TEXT DEFAULT 'scan',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security (RLS) & Add Public Access Policies (for single-user / public app access)
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.protein_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scan_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to recipes" ON public.recipes FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to recipes" ON public.recipes FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access to recipes" ON public.recipes FOR DELETE USING (true);

CREATE POLICY "Allow public read access to protein_logs" ON public.protein_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to protein_logs" ON public.protein_logs FOR INSERT WITH CHECK (true);
CREATE POLICY "Allow public delete access to protein_logs" ON public.protein_logs FOR DELETE USING (true);

CREATE POLICY "Allow public read access to user_preferences" ON public.user_preferences FOR SELECT USING (true);
CREATE POLICY "Allow public insert/update access to user_preferences" ON public.user_preferences FOR ALL USING (true);

CREATE POLICY "Allow public read access to scan_logs" ON public.scan_logs FOR SELECT USING (true);
CREATE POLICY "Allow public insert access to scan_logs" ON public.scan_logs FOR INSERT WITH CHECK (true);

-- 5. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_protein_logs_user_date ON public.protein_logs(user_id, logged_date);
CREATE INDEX IF NOT EXISTS idx_user_preferences_user_id ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_scan_logs_user_date ON public.scan_logs(user_id, local_date);

