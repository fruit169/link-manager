-- RLS 정책을 작업별로 분리하고 user_id 변경을 막는다 (2026-10-26)
-- 기존: 테이블마다 FOR ALL 정책 하나 ("folders: own rows", "links: own rows")
-- 변경: select / insert / update / delete 정책 4개씩. 모두 authenticated 역할, user_id = auth.uid() 기준
--  - 조회: 자기 user_id 행만
--  - 생성: 로그인한 사용자가 자기 user_id 로만 (anon 은 정책이 없어 불가)
--  - 수정: 자기 행만, 수정 후에도 user_id 는 자기 id 여야 함
--  - 삭제: 자기 행만
-- user_id 값 변경은 트리거로 거부한다 (RLS 가 다른 사용자 id 로의 변경은 이미 막지만, 명시적으로 고정)

create or replace function public.prevent_user_id_change()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.user_id is distinct from old.user_id then
    raise exception 'user_id cannot be changed';
  end if;
  return new;
end;
$$;

-- ---------------------------------------------------------------- folders
drop policy if exists "folders: own rows" on public.folders;

create policy "folders: select own" on public.folders
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "folders: insert own" on public.folders
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "folders: update own" on public.folders
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "folders: delete own" on public.folders
  for delete to authenticated
  using (user_id = (select auth.uid()));

drop trigger if exists folders_prevent_user_id_change on public.folders;
create trigger folders_prevent_user_id_change
  before update of user_id on public.folders
  for each row execute function public.prevent_user_id_change();

-- ------------------------------------------------------------------ links
drop policy if exists "links: own rows" on public.links;

create policy "links: select own" on public.links
  for select to authenticated
  using (user_id = (select auth.uid()));

create policy "links: insert own" on public.links
  for insert to authenticated
  with check (user_id = (select auth.uid()));

create policy "links: update own" on public.links
  for update to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "links: delete own" on public.links
  for delete to authenticated
  using (user_id = (select auth.uid()));

drop trigger if exists links_prevent_user_id_change on public.links;
create trigger links_prevent_user_id_change
  before update of user_id on public.links
  for each row execute function public.prevent_user_id_change();
