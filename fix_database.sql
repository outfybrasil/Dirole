-- SCRIPT DE CORREÇÃO DO BANCO DE DADOS (DIROLE)
-- Copie e cole este código no Editor SQL do Supabase e clique em RUN.

-- 1. Tabela de Avaliações (Reviews)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    location_id TEXT NOT NULL,
    user_id UUID NOT NULL,
    user_name TEXT,
    user_avatar TEXT,
    price NUMERIC DEFAULT 0,
    crowd NUMERIC DEFAULT 0,
    vibe NUMERIC DEFAULT 0,
    gender NUMERIC DEFAULT 0,
    comment TEXT
);

-- Habilitar segurança (RLS)
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Políticas de acesso (Quem pode ler e escrever)
DROP POLICY IF EXISTS "Public Read Access" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated Insert Access" ON public.reviews;

CREATE POLICY "Public Read Access" ON public.reviews
    FOR SELECT USING (true);

-- FIX: Casting to text to avoid UUID=TEXT errors if the table was created differently
CREATE POLICY "Authenticated Insert Access" ON public.reviews
    FOR INSERT WITH CHECK (auth.uid()::text = user_id::text);

-- 2. Tabela de Locais (Locations) - Garantir que existe e tem as colunas certas
CREATE TABLE IF NOT EXISTS public.locations (
    id TEXT PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    name TEXT,
    address TEXT,
    type TEXT,
    latitude FLOAT,
    longitude FLOAT,
    image_url TEXT,
    verified BOOLEAN DEFAULT false,
    votes_for_verification NUMERIC DEFAULT 0,
    is_official BOOLEAN DEFAULT false,
    owner_id UUID,
    official_description TEXT,
    instagram TEXT,
    whatsapp TEXT,
    stats JSONB DEFAULT '{"avgPrice": 0, "avgCrowd": 0, "avgVibe": 0, "reviewCount": 0}'::jsonb
);

ALTER TABLE public.locations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Locations" ON public.locations;
DROP POLICY IF EXISTS "Authenticated Insert Locations" ON public.locations;
DROP POLICY IF EXISTS "Owner Update Locations" ON public.locations;

CREATE POLICY "Public Read Locations" ON public.locations
    FOR SELECT USING (true);

CREATE POLICY "Authenticated Insert Locations" ON public.locations
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Owner Update Locations" ON public.locations
    FOR UPDATE USING (auth.uid()::text = owner_id::text);

-- 3. Tabela de Amizades (Friendships) - Para evitar erro no Leaderboard
CREATE TABLE IF NOT EXISTS public.friendships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT now(),
    requester_id UUID NOT NULL,
    receiver_id UUID NOT NULL,
    status TEXT DEFAULT 'pending'
);

ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own friendships" ON public.friendships;
CREATE POLICY "Users can read their own friendships" ON public.friendships
    FOR SELECT USING (auth.uid()::text = requester_id::text OR auth.uid()::text = receiver_id::text);
