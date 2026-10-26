-- user_id 기본값 추가 (2026-10-26, Supabase MCP apply_migration 으로 적용 완료)
-- 요청을 보낸 로그인 사용자의 id 가 자동으로 들어간다. 열은 이미 NOT NULL 이며
-- RLS(with check user_id = auth.uid()) 때문에 다른 사용자 id 로는 저장할 수 없다.
-- 같은 날 사용자 승인 아래 folders·links 의 기존 행(폴더 6개, 링크 9개)을 모두 삭제했다.
-- (데이터 삭제는 마이그레이션이 아니라 일회성 작업이라 이 파일에는 넣지 않는다)

alter table public.folders alter column user_id set default auth.uid();
alter table public.links   alter column user_id set default auth.uid();
