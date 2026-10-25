import type { OgResponse, OpenGraphData } from "@/lib/og/types";

export type OgClientResult =
  | { ok: true; data: OpenGraphData }
  | { ok: false; message: string };

/** 브라우저에서 서버의 /api/og 를 호출한다. 외부 페이지는 서버만 조회한다. */
export async function fetchOpenGraph(url: string): Promise<OgClientResult> {
  let response: Response;
  try {
    response = await fetch("/api/og", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url }),
    });
  } catch {
    return { ok: false, message: "서버에 연결하지 못했습니다. 네트워크를 확인해 주세요." };
  }

  let body: OgResponse | null = null;
  try {
    body = (await response.json()) as OgResponse;
  } catch {
    body = null;
  }

  if (body && body.ok) return { ok: true, data: body.data };
  const message =
    body && !body.ok ? body.error.message : "링크 정보를 가져오지 못했습니다.";
  return { ok: false, message };
}
