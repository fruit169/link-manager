-- links 테이블을 단순 구조로 재생성 (2026-10-25, Supabase MCP apply_migration 으로 적용 완료)
-- 주의: 기존 public.links(user_id, folder_id, RLS, 트리거 포함)를 삭제하므로
--       기존 링크 데이터가 사라지고 앱의 링크 저장·조회 코드는 수정이 필요하다.

drop table if exists public.links;

create table public.links (
  id            bigint generated always as identity primary key,
  url           text not null,
  title         text,
  description   text,
  thumbnail_url text,
  created_at    timestamptz not null default now()
);

alter table public.links disable row level security;
