import { promises as dns } from "node:dns";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { collectOpenGraph } from "@/lib/og/collect";
import type { OgResponse } from "@/lib/og/types";
import { createClient } from "@/utils/supabase/server";

/**
 * POST /api/og
 * body: { "url": "https://example.com" }
 * 서버가 대신 페이지를 받아 제목·설명·썸네일·og:url·최종 주소를 돌려준다.
 * 내부 주소, 비HTML, 과다 리다이렉트, 시간 초과는 실패로 응답하며
 * 오류 메시지에는 서버 내부 정보가 들어가지 않는다.
 */

const MAX_BODY_BYTES = 4096;

async function lookupAll(hostname: string): Promise<string[]> {
  const records = await dns.lookup(hostname, { all: true, verbatim: true });
  return records.map((r) => r.address);
}

function json(body: OgResponse, status: number) {
  return NextResponse.json(body, {
    status,
    headers: { "cache-control": "no-store" },
  });
}

export async function POST(request: Request): Promise<NextResponse> {
  // 로그인한 사용자만 외부 페이지 조회를 요청할 수 있다 (남용 방지)
  const supabase = createClient(await cookies());
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) {
    return json({ ok: false, error: { code: "bad_request", message: "로그인이 필요합니다." } }, 401);
  }

  let url: unknown;
  try {
    const text = await request.text();
    if (text.length > MAX_BODY_BYTES) {
      return json({ ok: false, error: { code: "bad_request", message: "요청이 너무 큽니다." } }, 413);
    }
    url = (JSON.parse(text) as { url?: unknown })?.url;
  } catch {
    return json({ ok: false, error: { code: "bad_request", message: "요청 형식이 올바르지 않습니다." } }, 400);
  }
  if (typeof url !== "string") {
    return json({ ok: false, error: { code: "invalid_url", message: "URL을 입력해 주세요." } }, 400);
  }

  try {
    const outcome = await collectOpenGraph(url, { fetchImpl: fetch, lookup: lookupAll });
    if (outcome.ok) return json({ ok: true, data: outcome.data }, 200);
    return json({ ok: false, error: { code: outcome.code, message: outcome.message } }, outcome.status);
  } catch {
    // 예상하지 못한 오류: 상세 내용은 로그에도 남기지 않고 일반 메시지만 돌려준다
    return json({ ok: false, error: { code: "fetch_failed", message: "링크 정보를 가져오지 못했습니다." } }, 500);
  }
}

export function GET() {
  return json({ ok: false, error: { code: "bad_request", message: "POST로 요청해 주세요." } }, 405);
}
