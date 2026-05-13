-- Migration: Add explicit table grants for Supabase Data API
-- Required for PostgREST / supabase-js access after May 30, 2026
-- Run this in the Supabase SQL editor for existing projects before October 30, 2026

GRANT SELECT, INSERT, UPDATE ON public.user_profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.kids TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.tasks TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.rewards TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.redemptions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.completions TO authenticated;
