import { cookies } from "next/headers";
import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/utils/supabase/server";

/**
 * GET /auth/callback?code=...&next=/reset-password
 * Supabase가 보낸 메일 링크(비밀번호 리셋 등)가 도착하는 곳.
 * 링크의 일회용 코드를 세션으로 바꾼 뒤 next 경로로 보낸다.
 * 코드가 없거나 만료되었으면 /forgot-password 로 돌려보내 다시 요청하게 한다.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const { searchParams, origin } = request.nextUrl;
  const code = searchParams.get("code");
  const next = safeNextPath(searchParams.get("next"));

  if (code) {
    const supabase = createClient(await cookies());
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(new URL(next, origin));
    }
  }

  // 비밀번호 리셋 링크는 다시 요청하는 페이지로, 소셜 로그인은 로그인 페이지로 돌려보낸다
  const fallback = new URL(next === "/reset-password" ? "/forgot-password" : "/login", origin);
  fallback.searchParams.set("error", searchParams.get("error_code") ?? "invalid_link");
  return NextResponse.redirect(fallback);
}

/** 같은 사이트 안의 경로만 허용한다 (외부 주소로의 리다이렉트 방지) */
function safeNextPath(value: string | null): string {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  return value;
}
