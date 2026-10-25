-- links.folder_id 추가 (2026-10-25, Supabase MCP apply_migration 으로 적용 완료)
-- 선택 열. folders.id 를 참조하며, 폴더가 삭제되면 연결된 링크의 folder_id 는 null 이 된다.

alter table public.links
  add column folder_id bigint
    references public.folders (id) on delete set null;
