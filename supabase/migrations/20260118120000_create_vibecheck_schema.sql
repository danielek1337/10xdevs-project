-- ============================================================================
-- Migration: Create VibeCheck Core Schema
-- Created: 2026-01-18
-- Purpose: Initialize the complete database schema for VibeCheck productivity tracker
-- 
-- Tables Created:
--   - public.entries: User productivity entries with soft-delete support
--   - public.tags: Global tag catalog
--   - public.entry_tags: Many-to-many relationship between entries and tags
--
-- Features:
--   - Anti-spam: 1 entry per user per hour (UTC)
--   - Soft-delete: entries marked as deleted but not removed
--   - Row Level Security: Users can only access their own data
--   - Auto-timestamps: created_at and updated_at managed by triggers
--   - Daily Focus Score: Calculated view for productivity metrics
-- ============================================================================

-- ============================================================================
-- SECTION 1: TABLES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Table: public.entries
-- Description: Stores individual productivity log entries for users
-- Soft-delete: Uses deleted_at column to mark deleted entries
-- Anti-spam: Enforced via unique constraint on (user_id, created_hour_utc)
-- ----------------------------------------------------------------------------
create table public.entries (
  id uuid primary key default gen_random_uuid() not null,
  
  -- foreign key to auth.users
  user_id uuid not null references auth.users(id) on delete cascade,
  
  -- mood rating between 1 and 5
  mood smallint not null,
  
  -- task description with minimum 3 characters (trimmed)
  task text not null,
  
  -- optional notes/details about the entry
  notes text null,
  
  -- timestamp when entry was created (immutable after creation)
  created_at timestamptz not null default now(),
  
  -- timestamp when entry was last modified
  updated_at timestamptz not null default now(),
  
  -- soft-delete timestamp (null = active, non-null = deleted)
  deleted_at timestamptz null,
  
  -- hour bucket in utc for anti-spam validation (1 entry per user per hour)
  -- this field is automatically set by trigger before insert/update
  created_hour_utc timestamp without time zone not null,
  
  -- constraints
  constraint entries_mood_range_check check (mood between 1 and 5),
  constraint entries_task_min_length_check check (char_length(btrim(task)) >= 3),
  
  -- anti-spam: only one entry per user per hour in utc
  -- note: soft-delete does not free up the slot (by design)
  constraint entries_user_hour_unique unique (user_id, created_hour_utc)
);

-- enable row level security on entries table
alter table public.entries enable row level security;

-- add comment to table
comment on table public.entries is 'User productivity entries with soft-delete and anti-spam protection';
comment on column public.entries.created_hour_utc is 'UTC hour bucket for anti-spam validation (automatically set by trigger)';
comment on column public.entries.deleted_at is 'Soft-delete timestamp. NULL = active entry, non-NULL = deleted entry';

-- ----------------------------------------------------------------------------
-- Table: public.tags
-- Description: Global catalog of tags shared across all users
-- Validation: Tags must be lowercase, alphanumeric, 1-20 characters
-- ----------------------------------------------------------------------------
create table public.tags (
  id uuid primary key default gen_random_uuid() not null,
  
  -- tag name (lowercase, alphanumeric only, 1-20 chars)
  name varchar(20) not null,
  
  -- timestamp when tag was created
  created_at timestamptz not null default now(),
  
  -- constraints
  constraint tags_name_lowercase_check check (name = lower(name)),
  constraint tags_name_format_check check (name ~ '^[a-z0-9]{1,20}$'),
  constraint tags_name_unique unique (name)
);

-- enable row level security on tags table
alter table public.tags enable row level security;

-- add comment to table
comment on table public.tags is 'Global tag catalog (shared across all users, lowercase alphanumeric only)';
comment on column public.tags.name is 'Tag name: lowercase, alphanumeric, 1-20 characters';

-- ----------------------------------------------------------------------------
-- Table: public.entry_tags
-- Description: Many-to-many relationship between entries and tags
-- Cascade: Deleting an entry removes all associated tags
-- Restrict: Deleting a tag is prevented if still in use
-- ----------------------------------------------------------------------------
create table public.entry_tags (
  -- foreign key to entries (cascade delete when entry is deleted)
  entry_id uuid not null references public.entries(id) on delete cascade,
  
  -- foreign key to tags (restrict delete when tag is in use)
  tag_id uuid not null references public.tags(id) on delete restrict,
  
  -- timestamp when tag was associated with entry
  created_at timestamptz not null default now(),
  
  -- composite primary key ensures unique entry-tag pairs
  constraint entry_tags_pkey primary key (entry_id, tag_id)
);

-- enable row level security on entry_tags table
alter table public.entry_tags enable row level security;

-- add comment to table
comment on table public.entry_tags is 'Many-to-many relationship between entries and tags';

-- ============================================================================
-- SECTION 2: TRIGGER FUNCTIONS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Function: set_entries_updated_at()
-- Description: Automatically updates the updated_at timestamp before update
-- ----------------------------------------------------------------------------
create or replace function public.set_entries_updated_at()
returns trigger
language plpgsql
as $$
begin
  -- set updated_at to current timestamp
  new.updated_at = now();
  return new;
end;
$$;

comment on function public.set_entries_updated_at() is 'Trigger function to automatically update the updated_at timestamp';

-- ----------------------------------------------------------------------------
-- Function: set_entries_created_hour_utc()
-- Description: Sets the created_hour_utc field for anti-spam validation
-- Calculates UTC hour bucket from created_at timestamp
-- ----------------------------------------------------------------------------
create or replace function public.set_entries_created_hour_utc()
returns trigger
language plpgsql
as $$
begin
  -- calculate utc hour bucket from created_at
  -- this truncates to the hour in utc for anti-spam validation
  new.created_hour_utc = date_trunc('hour', new.created_at at time zone 'UTC');
  return new;
end;
$$;

comment on function public.set_entries_created_hour_utc() is 'Trigger function to set UTC hour bucket for anti-spam validation';

-- ============================================================================
-- SECTION 3: TRIGGERS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Trigger: set_entries_updated_at_trigger
-- Description: Calls set_entries_updated_at() before every update
-- ----------------------------------------------------------------------------
create trigger set_entries_updated_at_trigger
  before update on public.entries
  for each row
  execute function public.set_entries_updated_at();

-- ----------------------------------------------------------------------------
-- Trigger: set_entries_created_hour_utc_trigger
-- Description: Calls set_entries_created_hour_utc() before insert
-- Ensures created_hour_utc is always set correctly for anti-spam validation
-- ----------------------------------------------------------------------------
create trigger set_entries_created_hour_utc_trigger
  before insert on public.entries
  for each row
  execute function public.set_entries_created_hour_utc();

-- ============================================================================
-- SECTION 4: INDEXES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- Indexes for public.entries
-- ----------------------------------------------------------------------------

-- primary index for dashboard listing and pagination (most common query)
create index entries_user_created_at_id_desc_idx 
  on public.entries (user_id, created_at desc, id desc);

comment on index entries_user_created_at_id_desc_idx is 'Primary index for dashboard listing and pagination';

-- partial index for active entries (excludes soft-deleted)
-- this optimizes queries that filter by deleted_at is null
create index entries_user_created_at_active_desc_idx 
  on public.entries (user_id, created_at desc, id desc) 
  where deleted_at is null;

comment on index entries_user_created_at_active_desc_idx is 'Partial index for active (non-deleted) entries only';

-- index for filtering by mood
create index entries_user_mood_created_at_desc_idx 
  on public.entries (user_id, mood, created_at desc, id desc);

comment on index entries_user_mood_created_at_desc_idx is 'Index for filtering entries by mood rating';

-- ----------------------------------------------------------------------------
-- Indexes for public.entry_tags
-- ----------------------------------------------------------------------------

-- index for filtering entries by tag (reverse lookup)
-- note: the primary key already provides (entry_id, tag_id) index
create index entry_tags_tag_id_entry_id_idx 
  on public.entry_tags (tag_id, entry_id);

comment on index entry_tags_tag_id_entry_id_idx is 'Index for finding all entries with a specific tag';

-- ============================================================================
-- SECTION 5: ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- ----------------------------------------------------------------------------
-- RLS Policies for public.entries
-- Users can only access their own entries
-- ----------------------------------------------------------------------------

-- policy: authenticated users can select their own entries
create policy entries_select_own_policy
  on public.entries
  for select
  to authenticated
  using (user_id = auth.uid());

comment on policy entries_select_own_policy on public.entries is 
  'Allow authenticated users to select only their own entries';

-- policy: authenticated users can insert entries with their own user_id
create policy entries_insert_own_policy
  on public.entries
  for insert
  to authenticated
  with check (user_id = auth.uid());

comment on policy entries_insert_own_policy on public.entries is 
  'Allow authenticated users to insert entries only with their own user_id';

-- policy: authenticated users can update their own entries
create policy entries_update_own_policy
  on public.entries
  for update
  to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

comment on policy entries_update_own_policy on public.entries is 
  'Allow authenticated users to update only their own entries and prevent user_id changes';

-- policy: authenticated users can delete their own entries
-- note: application should use soft-delete (update deleted_at) instead of hard delete
create policy entries_delete_own_policy
  on public.entries
  for delete
  to authenticated
  using (user_id = auth.uid());

comment on policy entries_delete_own_policy on public.entries is 
  'Allow authenticated users to delete only their own entries (soft-delete recommended)';

-- ----------------------------------------------------------------------------
-- RLS Policies for public.tags
-- Tags are global: all authenticated users can read and create tags
-- Update and delete are not allowed (tags are immutable once created)
-- ----------------------------------------------------------------------------

-- policy: authenticated users can select all tags
create policy tags_select_all_policy
  on public.tags
  for select
  to authenticated
  using (true);

comment on policy tags_select_all_policy on public.tags is 
  'Allow all authenticated users to view all tags (global catalog)';

-- policy: authenticated users can insert new tags
-- validation is enforced by check constraints (lowercase, alphanumeric, unique)
create policy tags_insert_policy
  on public.tags
  for insert
  to authenticated
  with check (true);

comment on policy tags_insert_policy on public.tags is 
  'Allow authenticated users to create new tags (validation by constraints)';

-- note: no update or delete policies for tags
-- tags are immutable once created to maintain data integrity

-- ----------------------------------------------------------------------------
-- RLS Policies for public.entry_tags
-- Users can only manage tags for their own entries
-- Ownership is determined through the entries table
-- ----------------------------------------------------------------------------

-- policy: authenticated users can select tags for their own entries
create policy entry_tags_select_own_policy
  on public.entry_tags
  for select
  to authenticated
  using (
    exists (
      select 1 
      from public.entries e 
      where e.id = entry_tags.entry_id 
        and e.user_id = auth.uid()
    )
  );

comment on policy entry_tags_select_own_policy on public.entry_tags is 
  'Allow users to view tags only for their own entries';

-- policy: authenticated users can insert tags for their own entries
create policy entry_tags_insert_own_policy
  on public.entry_tags
  for insert
  to authenticated
  with check (
    exists (
      select 1 
      from public.entries e 
      where e.id = entry_tags.entry_id 
        and e.user_id = auth.uid()
    )
  );

comment on policy entry_tags_insert_own_policy on public.entry_tags is 
  'Allow users to add tags only to their own entries';

-- policy: authenticated users can delete tags from their own entries
create policy entry_tags_delete_own_policy
  on public.entry_tags
  for delete
  to authenticated
  using (
    exists (
      select 1 
      from public.entries e 
      where e.id = entry_tags.entry_id 
        and e.user_id = auth.uid()
    )
  );

comment on policy entry_tags_delete_own_policy on public.entry_tags is 
  'Allow users to remove tags only from their own entries';

-- note: update policy is intentionally omitted
-- updating entry_tags should be done via delete + insert pattern for simplicity

-- ============================================================================
-- SECTION 6: VIEWS
-- ============================================================================

-- ----------------------------------------------------------------------------
-- View: v_daily_focus_scores_utc
-- Description: Calculates daily focus score for each user based on:
--   - Average mood (normalized to 0-100)
--   - Entry consistency (number of entries, capped at 8)
--   - Time distribution (span in minutes, capped at 480)
-- 
-- Formula:
--   focus_score = (0.55 * mood_score) + (0.25 * consistency_score) + (0.20 * distribution_score)
-- 
-- Notes:
--   - All dates are in UTC
--   - Only active entries (deleted_at is null) are included
--   - Scores are calculated on-demand (not materialized)
-- ----------------------------------------------------------------------------
create or replace view public.v_daily_focus_scores_utc as
select
  user_id,
  date(created_at at time zone 'UTC') as day_utc,
  count(*) as entry_count,
  round(avg(mood), 2) as avg_mood,
  min(created_at) as first_entry_at,
  max(created_at) as last_entry_at,
  extract(epoch from (max(created_at) - min(created_at))) / 60 as span_minutes,
  
  -- calculate focus score components
  round(((avg(mood) - 1) / 4.0) * 100, 2) as mood_score,
  round(least(1.0, count(*) / 8.0) * 100, 2) as consistency_score,
  round(
    least(1.0, (extract(epoch from (max(created_at) - min(created_at))) / 60) / 480.0) * 100, 
    2
  ) as distribution_score,
  
  -- calculate final focus score (weighted average)
  round(
    (0.55 * ((avg(mood) - 1) / 4.0) * 100) +
    (0.25 * least(1.0, count(*) / 8.0) * 100) +
    (0.20 * least(1.0, (extract(epoch from (max(created_at) - min(created_at))) / 60) / 480.0) * 100),
    2
  ) as focus_score
from
  public.entries
where
  -- only include active (non-deleted) entries
  deleted_at is null
group by
  user_id,
  date(created_at at time zone 'UTC');

comment on view public.v_daily_focus_scores_utc is 
  'Daily focus score calculation for each user (UTC timezone, active entries only)';

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

