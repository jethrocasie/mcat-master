-- ============================================================
-- MCAT Master — Initial Schema
-- Run this in Supabase SQL Editor
-- ============================================================

-- Enable UUID extension (usually already enabled on Supabase)
create extension if not exists "pgcrypto";

-- ============================================================
-- PROFILES (extends auth.users)
-- ============================================================
create table if not exists profiles (
  id uuid references auth.users primary key,
  display_name text,
  exam_date date,
  xp integer default 0,
  level integer default 1,
  current_streak integer default 0,
  longest_streak integer default 0,
  last_study_date date,
  streak_freezes integer default 2,
  email_notifications boolean default true,
  study_reminder_time time default '09:00:00',
  timezone text default 'America/New_York',
  created_at timestamptz default now()
);

-- Auto-create profile on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, exam_date)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)),
    NULLIF(new.raw_user_meta_data->>'exam_date', '')::date
  )
  on conflict (id) do nothing;
  return new;
end;
$$ language plpgsql security definer;

create or replace trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- FLASHCARDS
-- ============================================================
create table if not exists flashcards (
  id uuid primary key default gen_random_uuid(),
  mcat_section text not null check (mcat_section in ('bio_biochem', 'chem_phys', 'psych_soc', 'cars')),
  topic text not null,
  subtopic text,
  question text not null,
  answer text not null,
  difficulty integer default 2 check (difficulty between 1 and 5),
  created_at timestamptz default now()
);

create index if not exists idx_flashcards_section on flashcards(mcat_section);
create index if not exists idx_flashcards_topic on flashcards(topic);

-- ============================================================
-- USER CARD PROGRESS (SM-2 state per user per card)
-- ============================================================
create table if not exists user_card_progress (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  card_id uuid references flashcards(id) on delete cascade not null,
  ease_factor float default 2.5,
  interval integer default 0,
  repetitions integer default 0,
  next_review_date date default current_date,
  times_seen integer default 0,
  times_correct integer default 0,
  last_reviewed_at timestamptz,
  unique(user_id, card_id)
);

create index if not exists idx_ucp_user_id on user_card_progress(user_id);
create index if not exists idx_ucp_next_review on user_card_progress(user_id, next_review_date);

-- ============================================================
-- QUIZ SESSIONS
-- ============================================================
create table if not exists quiz_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references profiles(id) on delete cascade not null,
  mcat_section text check (mcat_section in ('bio_biochem', 'chem_phys', 'psych_soc', 'cars')),
  total_questions integer not null,
  correct_answers integer not null,
  xp_earned integer default 0,
  duration_seconds integer,
  completed_at timestamptz default now()
);

create index if not exists idx_qs_user_id on quiz_sessions(user_id);

-- ============================================================
-- QUIZ ANSWERS
-- ============================================================
create table if not exists quiz_answers (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references quiz_sessions(id) on delete cascade not null,
  card_id uuid references flashcards(id),
  selected_answer text,
  is_correct boolean,
  time_taken_seconds integer
);

-- ============================================================
-- ACHIEVEMENTS
-- ============================================================
create table if not exists achievements (
  id text primary key,
  name text not null,
  description text not null,
  icon text not null,
  xp_reward integer default 0
);

create table if not exists user_achievements (
  user_id uuid references profiles(id) on delete cascade,
  achievement_id text references achievements(id),
  earned_at timestamptz default now(),
  primary key(user_id, achievement_id)
);

-- Seed achievements
insert into achievements (id, name, description, icon, xp_reward)
values
  ('first_card',        'First Card',        'Reviewed your first flashcard',                   '🃏', 25),
  ('streak_3',          'On Fire',            'Maintained a 3-day study streak',                 '🔥', 50),
  ('streak_7',          'Week Warrior',       'Maintained a 7-day study streak',                 '🔥', 200),
  ('streak_30',         'Unstoppable',        'Maintained a 30-day study streak',                '🏆', 500),
  ('section_master_bio','Bio Master',         'Achieved 80%+ accuracy in Bio/Biochem',           '🧬', 100),
  ('comeback_kid',      'Comeback Kid',       'Got a card right after 3 wrong attempts',         '💪', 75),
  ('speed_demon',       'Speed Demon',        'Answered 20 cards in under 5 minutes',            '⚡', 100),
  ('first_quiz',        'Quiz Taker',         'Completed your first quiz',                       '📝', 50),
  ('perfect_quiz',      'Perfectionist',      'Got 100% on a quiz',                              '🌟', 150)
on conflict (id) do nothing;

-- ============================================================
-- HELPER FUNCTION: get_due_cards
-- Returns cards due for review (existing progress + new cards)
-- ============================================================
create or replace function get_due_cards(
  p_user_id uuid,
  p_today date,
  p_section text default null,
  p_limit integer default 20
)
returns table(
  id uuid,
  mcat_section text,
  topic text,
  subtopic text,
  question text,
  answer text,
  difficulty integer,
  created_at timestamptz
)
language sql
security definer
as $$
  -- Cards already seen that are due
  select f.id, f.mcat_section, f.topic, f.subtopic, f.question, f.answer, f.difficulty, f.created_at
  from flashcards f
  join user_card_progress ucp on f.id = ucp.card_id
  where ucp.user_id = p_user_id
    and ucp.next_review_date <= p_today
    and (p_section is null or f.mcat_section = p_section)

  union all

  -- New cards (never seen)
  select f.id, f.mcat_section, f.topic, f.subtopic, f.question, f.answer, f.difficulty, f.created_at
  from flashcards f
  where not exists (
    select 1 from user_card_progress ucp
    where ucp.card_id = f.id and ucp.user_id = p_user_id
  )
  and (p_section is null or f.mcat_section = p_section)

  order by created_at
  limit p_limit;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- Profiles: users can only read/write their own
alter table profiles enable row level security;
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Flashcards: everyone can read (public content)
alter table flashcards enable row level security;
create policy "Flashcards are public" on flashcards for select using (true);

-- User card progress: own data only
alter table user_card_progress enable row level security;
create policy "Users can view own progress" on user_card_progress for select using (auth.uid() = user_id);
create policy "Users can insert own progress" on user_card_progress for insert with check (auth.uid() = user_id);
create policy "Users can update own progress" on user_card_progress for update using (auth.uid() = user_id);

-- Quiz sessions: own data only
alter table quiz_sessions enable row level security;
create policy "Users can view own quiz sessions" on quiz_sessions for select using (auth.uid() = user_id);
create policy "Users can insert own quiz sessions" on quiz_sessions for insert with check (auth.uid() = user_id);

-- Quiz answers: own data only
alter table quiz_answers enable row level security;
create policy "Users can view own quiz answers" on quiz_answers for select
  using (exists (select 1 from quiz_sessions where id = session_id and user_id = auth.uid()));
create policy "Users can insert quiz answers" on quiz_answers for insert
  with check (exists (select 1 from quiz_sessions where id = session_id and user_id = auth.uid()));

-- Achievements: everyone can read
alter table achievements enable row level security;
create policy "Achievements are public" on achievements for select using (true);

-- User achievements: own data only
alter table user_achievements enable row level security;
create policy "Users can view own achievements" on user_achievements for select using (auth.uid() = user_id);
create policy "Users can insert own achievements" on user_achievements for insert with check (auth.uid() = user_id);
