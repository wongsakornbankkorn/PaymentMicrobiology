-- ============================================================================
-- Student Department Payment Tracking System
-- Complete PostgreSQL Schema for Supabase (Production Ready)
-- Microbiology Department, Faculty of Science, Prince of Songkla University
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE public.app_role AS ENUM ('STUDENT', 'ADMIN');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE public.transaction_status AS ENUM ('PENDING', 'APPROVED', 'REJECTED');
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. TABLES DEFINITION

-- ----------------------------------------------------------------------------
-- Table: profiles
-- Extends auth.users to store student/admin profile details
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id VARCHAR(20) UNIQUE,
    full_name VARCHAR(255) NOT NULL,
    cohort_year INTEGER CHECK (cohort_year > 0),
    role public.app_role NOT NULL DEFAULT 'STUDENT',
    avatar_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.profiles IS 'User profile information extending Supabase auth.users';
COMMENT ON COLUMN public.profiles.student_id IS 'Unique student identification code (e.g., 66010123)';
COMMENT ON COLUMN public.profiles.cohort_year IS 'Cohort / academic year level (e.g. 1, 2, 3, 4)';

-- ----------------------------------------------------------------------------
-- Table: fee_campaigns
-- Stores fee campaigns & payment events created by admins
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.fee_campaigns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    amount NUMERIC(10, 2) NOT NULL CHECK (amount >= 0),
    due_date TIMESTAMPTZ NOT NULL,
    target_cohort VARCHAR(50) NOT NULL DEFAULT 'ALL',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.fee_campaigns IS 'Department fee campaigns';
COMMENT ON COLUMN public.fee_campaigns.target_cohort IS 'Target cohort: "ALL", "1", "2", "3", "4" or cohort code';

-- ----------------------------------------------------------------------------
-- Table: transactions
-- Stores payment transactions, bank slip image URLs, verification status
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    campaign_id UUID NOT NULL REFERENCES public.fee_campaigns(id) ON DELETE RESTRICT,
    amount_paid NUMERIC(10, 2) NOT NULL CHECK (amount_paid > 0),
    slip_image_url TEXT NOT NULL,
    transfer_date TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    status public.transaction_status NOT NULL DEFAULT 'PENDING',
    reject_reason TEXT,
    verified_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    verified_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

COMMENT ON TABLE public.transactions IS 'Payment transactions submitted by students and verified by admins';
COMMENT ON COLUMN public.transactions.student_id IS 'FK to profiles.id';
COMMENT ON COLUMN public.transactions.campaign_id IS 'FK to fee_campaigns.id';
COMMENT ON COLUMN public.transactions.verified_by IS 'FK to profiles.id (Admin verifier)';

-- 4. PERFORMANCE INDEXES
CREATE INDEX IF NOT EXISTS idx_profiles_student_id ON public.profiles(student_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_cohort_year ON public.profiles(cohort_year);

CREATE INDEX IF NOT EXISTS idx_fee_campaigns_target_cohort ON public.fee_campaigns(target_cohort);
CREATE INDEX IF NOT EXISTS idx_fee_campaigns_due_date ON public.fee_campaigns(due_date);
CREATE INDEX IF NOT EXISTS idx_fee_campaigns_is_active ON public.fee_campaigns(is_active);

CREATE INDEX IF NOT EXISTS idx_transactions_student_id ON public.transactions(student_id);
CREATE INDEX IF NOT EXISTS idx_transactions_campaign_id ON public.transactions(campaign_id);
CREATE INDEX IF NOT EXISTS idx_transactions_status ON public.transactions(status);
CREATE INDEX IF NOT EXISTS idx_transactions_transfer_date ON public.transactions(transfer_date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_student_campaign ON public.transactions(student_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created_at ON public.transactions(created_at DESC);

-- 5. AUTOMATED TRIGGER FUNCTIONS

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_profiles_updated_at ON public.profiles;
CREATE TRIGGER set_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_fee_campaigns_updated_at ON public.fee_campaigns;
CREATE TRIGGER set_fee_campaigns_updated_at
    BEFORE UPDATE ON public.fee_campaigns
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

DROP TRIGGER IF EXISTS set_transactions_updated_at ON public.transactions;
CREATE TRIGGER set_transactions_updated_at
    BEFORE UPDATE ON public.transactions
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create public.profiles record whenever an auth.users row is inserted
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, student_id, full_name, cohort_year, role, avatar_url)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'student_id',
        COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
        (NEW.raw_user_meta_data->>'cohort_year')::INTEGER,
        COALESCE((NEW.raw_user_meta_data->>'role')::public.app_role, 'STUDENT'::public.app_role),
        NEW.raw_user_meta_data->>'avatar_url'
    )
    ON CONFLICT (id) DO UPDATE SET
        student_id = COALESCE(EXCLUDED.student_id, profiles.student_id),
        full_name = COALESCE(EXCLUDED.full_name, profiles.full_name),
        cohort_year = COALESCE(EXCLUDED.cohort_year, profiles.cohort_year);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- 6. SECURITY: ROW LEVEL SECURITY (RLS) POLICIES

-- Helper function: Check if current user has ADMIN role
-- SECURITY DEFINER with search_path = public prevents recursive RLS evaluations
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE id = auth.uid() AND role = 'ADMIN'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fee_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- ----------------------------------------------------------------------------
-- Policies for: profiles
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Profiles are viewable by owner or admin" ON public.profiles;
CREATE POLICY "Profiles are viewable by owner or admin"
    ON public.profiles
    FOR SELECT
    TO authenticated
    USING (
        auth.uid() = id OR public.is_admin()
    );

DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
    ON public.profiles
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = id)
    WITH CHECK (
        auth.uid() = id AND
        (role = (SELECT role FROM public.profiles WHERE id = auth.uid()))
    );

DROP POLICY IF EXISTS "Admins have full access to profiles" ON public.profiles;
CREATE POLICY "Admins have full access to profiles"
    ON public.profiles
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- Policies for: fee_campaigns
-- ----------------------------------------------------------------------------
DROP POLICY IF EXISTS "Fee campaigns are viewable by all authenticated users" ON public.fee_campaigns;
CREATE POLICY "Fee campaigns are viewable by all authenticated users"
    ON public.fee_campaigns
    FOR SELECT
    TO authenticated
    USING (true);

DROP POLICY IF EXISTS "Admins have full access to fee campaigns" ON public.fee_campaigns;
CREATE POLICY "Admins have full access to fee campaigns"
    ON public.fee_campaigns
    FOR ALL
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- ----------------------------------------------------------------------------
-- Policies for: transactions
-- ----------------------------------------------------------------------------

-- SELECT: Students view only their own transactions; Admins view all
DROP POLICY IF EXISTS "Transactions are viewable by owner student or admin" ON public.transactions;
CREATE POLICY "Transactions are viewable by owner student or admin"
    ON public.transactions
    FOR SELECT
    TO authenticated
    USING (
        student_id = auth.uid() OR public.is_admin()
    );

-- INSERT: Students can insert their own transactions with initial status PENDING
DROP POLICY IF EXISTS "Students can insert their own transactions" ON public.transactions;
CREATE POLICY "Students can insert their own transactions"
    ON public.transactions
    FOR INSERT
    TO authenticated
    WITH CHECK (
        student_id = auth.uid() AND
        status = 'PENDING'
    );

-- UPDATE: Only Admins can verify/update transaction status and records
DROP POLICY IF EXISTS "Admins can update transactions" ON public.transactions;
CREATE POLICY "Admins can update transactions"
    ON public.transactions
    FOR UPDATE
    TO authenticated
    USING (public.is_admin())
    WITH CHECK (public.is_admin());

-- DELETE: Only Admins can delete transactions
DROP POLICY IF EXISTS "Admins can delete transactions" ON public.transactions;
CREATE POLICY "Admins can delete transactions"
    ON public.transactions
    FOR DELETE
    TO authenticated
    USING (public.is_admin());

-- ----------------------------------------------------------------------------
-- 7. SUPABASE STORAGE BUCKET: 'slips'
-- ----------------------------------------------------------------------------
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'slips',
    'slips',
    true, -- public bucket or authenticated access
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/heic']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = 10485760;

-- Storage Policy: Students can upload slips to their own folder
DROP POLICY IF EXISTS "Students can upload slips" ON storage.objects;
CREATE POLICY "Students can upload slips"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'slips' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- Storage Policy: Anyone authenticated can view slip images
DROP POLICY IF EXISTS "Authenticated users can view slips" ON storage.objects;
CREATE POLICY "Authenticated users can view slips"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (bucket_id = 'slips');

-- Storage Policy: Admins can delete slips if necessary
DROP POLICY IF EXISTS "Admins can delete slips" ON storage.objects;
CREATE POLICY "Admins can delete slips"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (bucket_id = 'slips' AND public.is_admin());

-- ----------------------------------------------------------------------------
-- 8. INITIAL SEED DATA (Campaigns)
-- ----------------------------------------------------------------------------
INSERT INTO public.fee_campaigns (id, title, description, amount, due_date, target_cohort, is_active)
VALUES
    ('11111111-1111-1111-1111-111111111111', 'ค่าบำรุงภาควิชาจุลชีววิทยา ภาคต้น/2567', 'ค่าบำรุงส่วนกลางและอุปกรณ์แล็บสาขาวิชาจุลชีววิทยา', 500.00, timezone('utc'::text, now() + interval '30 days'), 'ALL', true),
    ('22222222-2222-2222-2222-222222222222', 'ค่าเสื้อกาวน์แล็บจุลชีววิทยา & เสื้อภาค', 'เสื้อกาวน์ปักตราสาขาสำหรับเข้าห้องปฏิบัติการปลอดเชื้อ', 450.00, timezone('utc'::text, now() + interval '15 days'), '1', true),
    ('33333333-3333-3333-3333-333333333333', 'ค่ายวิชาการและทัศนศึกษาดูงานจุลชีววิทยาประยุกต์', 'ศึกษาดูงานโรงงานอุตสาหกรรมชีวภาพและศูนย์วิจัย', 1200.00, timezone('utc'::text, now() + interval '45 days'), '3', true),
    ('44444444-4444-4444-4444-444444444444', 'ค่ากิจกรรมสัมมนาวิจัยและปัจฉิมนิเทศ ปี 4', 'ค่าจัดพิมพ์เอกสารสัมมนาและสถานที่นำเสนอผลงานวิจัย', 300.00, timezone('utc'::text, now() + interval '60 days'), '4', true)
ON CONFLICT (id) DO NOTHING;
