-- 링크 보관함 스키마: 사용자별 폴더와 링크
-- 실행 방법: Supabase 대시보드 → SQL Editor → 이 파일 내용을 붙여 넣고 Run
-- 한 번만 실행한다. (다시 실행해도 안전하도록 if not exists 를 썼다)

-- ---------------------------------------------------------------- folders
create table if not exists public.folders (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  name        text not null check (char_length(trim(name)) between 1 and 30),
  -- '미분류'처럼 사용자가 이름을 바꾸거나 지울 수 없는 폴더
  is_system   boolean not null default false,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  -- 같은 사용자 안에서는 폴더 이름이 겹치지 않는다
  constraint folders_user_name_unique unique (user_id, name)
);

-- 사용자당 시스템 폴더('미분류')는 하나만
create unique index if not exists folders_one_system_per_user
  on public.folders (user_id) where is_system;

-- ------------------------------------------------------------------ links
create table if not exists public.links (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users (id) on delete cascade,
  -- 폴더가 지워지면 앱이 먼저 '미분류'로 옮기지만, 만약을 위해 null 허용
  folder_id   uuid references public.folders (id) on delete set null,
  title       text not null check (char_length(trim(title)) between 1 and 200),
  description text not null default '',
  url         text not null check (url ~* '^https?://'),
  image_url   text,
  og_url      text,
  final_url   text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists links_user_created_idx on public.links (user_id, created_at desc);
create index if not exists links_folder_idx on public.links (folder_id);

-- ------------------------------------------------------- updated_at 자동 갱신
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists folders_set_updated_at on public.folders;
create trigger folders_set_updated_at
  before update on public.folders
  for each row execute function public.set_updated_at();

drop trigger if exists links_set_updated_at on public.links;
create trigger links_set_updated_at
  before update on public.links
  for each row execute function public.set_updated_at();

-- --------------------------------------------- Row Level Security (필수)
-- 로그인한 사용자는 자기 행만 읽고 쓸 수 있다. publishable key로는 이 정책을 넘을 수 없다.
alter table public.folders enable row level security;
alter table public.links   enable row level security;

drop policy if exists "folders: own rows" on public.folders;
create policy "folders: own rows" on public.folders
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "links: own rows" on public.links;
create policy "links: own rows" on public.links
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

-- 링크의 폴더는 반드시 같은 사용자의 폴더여야 한다
create or replace function public.check_link_folder_owner()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.folder_id is not null and not exists (
    select 1 from public.folders f
    where f.id = new.folder_id and f.user_id = new.user_id
  ) then
    raise exception 'folder does not belong to the same user';
  end if;
  return new;
end;
$$;

drop trigger if exists links_check_folder_owner on public.links;
create trigger links_check_folder_owner
  before insert or update of folder_id on public.links
  for each row execute function public.check_link_folder_owner();
