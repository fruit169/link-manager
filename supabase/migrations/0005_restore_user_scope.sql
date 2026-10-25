-- 2026-10-25 Supabase MCP apply_migration 으로 적용 (시험 실행 22문장 통과 후 승인)
-- 사용자 소유 범위 복원 (추가만: 기존 테이블·열·데이터·int8 id 유지)
-- 전제: folders, links 행 0개 → NOT NULL 열을 백필 없이 추가 가능

-- 1) 사용자 소유 열
alter table public.folders add column user_id uuid references auth.users (id) on delete cascade;
alter table public.links   add column user_id uuid references auth.users (id) on delete cascade;
alter table public.folders alter column user_id set not null;
alter table public.links   alter column user_id set not null;

-- 2) 코드가 쓰는 나머지 열
alter table public.folders add column is_system  boolean     not null default false;
alter table public.folders add column sort_order integer     not null default 0;
alter table public.folders add column updated_at timestamptz not null default now();
alter table public.links   add column og_url     text;
alter table public.links   add column final_url  text;
alter table public.links   add column updated_at timestamptz not null default now();
alter table public.links   alter column description set default '';

-- 3) 제약·인덱스
alter table public.folders add constraint folders_user_name_unique unique (user_id, name);
create unique index folders_one_system_per_user on public.folders (user_id) where is_system;
create index links_user_created_idx on public.links (user_id, created_at desc);
create index links_folder_idx       on public.links (folder_id);

-- 4) 트리거 재연결 (함수 set_updated_at, check_link_folder_owner 는 이미 존재)
create trigger folders_set_updated_at before update on public.folders
  for each row execute function public.set_updated_at();
create trigger links_set_updated_at before update on public.links
  for each row execute function public.set_updated_at();
create trigger links_check_folder_owner before insert or update of folder_id on public.links
  for each row execute function public.check_link_folder_owner();

-- 5) RLS: 로그인한 사용자는 자기 행만. anon 은 정책이 없어 접근 불가.
alter table public.folders enable row level security;
alter table public.links   enable row level security;
create policy "folders: own rows" on public.folders for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
create policy "links: own rows" on public.links for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
