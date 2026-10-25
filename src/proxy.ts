import type { NextRequest } from "next/server";
import { updateSession } from "@/utils/supabase/middleware";

/**
 * Next.js 16 proxy (예전 이름: middleware).
 * 페이지가 렌더링되기 전에 Supabase 세션 쿠키를 갱신한다.
 */
export async function proxy(request: NextRequest) {
  return updateSession(request);
}

export const config = {
  // 정적 파일, 이미지, 썸네일은 건너뛴다
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|thumbs/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
