-- folders 테이블을 단순 구조로 재생성 (2026-10-25, Supabase MCP apply_migration 으로 적용 완료)
-- 주의: 기존 public.folders(user_id, is_system, sort_order, RLS, 트리거 포함)를 삭제하므로
--       기존 폴더 데이터가 사라지고 앱의 폴더 저장·조회 코드는 수정이 필요하다.

drop table if exists public.folders;

create table public.folders (
  id         bigint generated always as identity primary key,
  name       text not null,
  created_at timestamptz not null default now()
);

alter table public.folders disable row level security;
