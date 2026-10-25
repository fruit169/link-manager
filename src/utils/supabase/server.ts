import { createServerClient } from "@supabase/ssr";
import type { cookies } from "next/headers";
import { getSupabaseEnv } from "@/utils/supabase/env";

/**
 * 서버 컴포넌트, Route Handler, Server Action에서 쓰는 Supabase 클라이언트.
 * 사용 예:
 *   const cookieStore = await cookies();
 *   const supabase = createClient(cookieStore);
 */
export const createClient = (cookieStore: Awaited<ReturnType<typeof cookies>>) => {
  const { url, key } = getSupabaseEnv();
  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // 서버 컴포넌트에서는 쿠키를 쓸 수 없다.
          // src/proxy.ts 가 세션을 갱신하므로 무시해도 된다.
        }
      },
    },
  });
};
