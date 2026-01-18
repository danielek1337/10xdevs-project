-- ============================================================================
-- Migration: Disable Row Level Security
-- Created: 2026-01-18
-- Purpose: Disable RLS on all VibeCheck tables for development/testing
-- 
-- WARNING: This removes all security policies and disables RLS.
-- Data will be accessible without authentication restrictions.
-- Only use this in development environments.
-- ============================================================================

-- Disable Row Level Security on public.entries
alter table public.entries disable row level security;

-- Disable Row Level Security on public.tags
alter table public.tags disable row level security;

-- Disable Row Level Security on public.entry_tags
alter table public.entry_tags disable row level security;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

