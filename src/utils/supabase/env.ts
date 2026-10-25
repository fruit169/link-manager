/**
 * Supabase 접속 정보. 두 값 모두 NEXT_PUBLIC_ 접두사라 브라우저에도 노출되는 공개 값이다.
 * (publishable key는 공개용이며, 데이터 보호는 Row Level Security로 한다.)
 */
export function getSupabaseEnv(): { url: string; key: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase 환경 변수가 없습니다. .env.local 에 NEXT_PUBLIC_SUPABASE_URL 과 NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY 를 설정해 주세요.",
    );
  }
  return { url, key };
}
