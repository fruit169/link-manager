import { createServerClient } from "@supabase/ssr";
import { type NextRequest, NextResponse } from "next/server";
import { getSupabaseEnv } from "@/utils/supabase/env";

/** 로그인 없이 열 수 있는 경로 */
const PUBLIC_PATHS = ["/login"];

/**
 * 요청마다 Supabase 세션 쿠키를 확인하고 만료가 가까우면 갱신한다.
 * 로그인하지 않은 사용자는 /login 으로, 로그인한 사용자가 /login 에 오면 / 로 보낸다.
 * src/proxy.ts 에서 호출한다. (Next.js 16은 middleware 대신 proxy 규칙을 쓴다)
 */
export const updateSession = async (request: NextRequest): Promise<NextResponse> => {
  let supabaseResponse = NextResponse.next({
    request: { headers: request.headers },
  });

  const { url, key } = getSupabaseEnv();
  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options),
        );
      },
    },
  });

  // 세션을 실제로 읽어야 갱신이 일어난다. (createServerClient 와 이 호출 사이에 다른 코드를 두지 않는다)
  const { data } = await supabase.auth.getClaims();
  const signedIn = Boolean(data?.claims);

  const { pathname } = request.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(`${p}/`));
  const isApi = pathname.startsWith("/api/");

  if (!signedIn && !isPublic && !isApi) {
    const loginUrl = request.nextUrl.clone();
    loginUrl.pathname = "/login";
    loginUrl.search = "";
    return NextResponse.redirect(loginUrl);
  }
  if (signedIn && isPublic) {
    const homeUrl = request.nextUrl.clone();
    homeUrl.pathname = "/";
    homeUrl.search = "";
    return NextResponse.redirect(homeUrl);
  }

  return supabaseResponse;
};
