import { decodeBytes, detectCharset, parseMetadata } from "@/lib/og/parse-html";
import type { OgErrorCode, OpenGraphData } from "@/lib/og/types";
import { allPublicIps, checkPublicHttpUrl, looksLikeIp } from "@/lib/og/validate-url";

/**
 * 주소 하나를 받아 리다이렉트를 따라가며 HTML을 내려받고 메타데이터를 뽑는다.
 * fetch와 DNS 조회를 주입받으므로 네트워크 없이 테스트할 수 있다.
 */

export const LIMITS = {
  maxRedirects: 5,
  timeoutMs: 8000,
  maxBodyBytes: 1024 * 1024, // 1 MB. <head>는 보통 앞부분에 있으므로 넘치면 잘라서 쓴다
};

export interface CollectDeps {
  fetchImpl: typeof fetch;
  /** 호스트 이름을 IP 목록으로 푼다. 실패하면 빈 배열이나 예외. */
  lookup: (hostname: string) => Promise<string[]>;
}

export type CollectOutcome =
  | { ok: true; data: OpenGraphData }
  | { ok: false; status: number; code: OgErrorCode; message: string };

const REDIRECT_STATUSES = new Set([301, 302, 303, 307, 308]);
const USER_AGENT = "Mozilla/5.0 (compatible; LinkManagerBot/1.0; +https://github.com/fruit169/link-manager)";

function fail(status: number, code: OgErrorCode, message: string): CollectOutcome {
  return { ok: false, status, code, message };
}

/** 주소 형식 + DNS 결과까지 검사한다. 리다이렉트 목적지마다 다시 호출한다. */
async function verifyTarget(raw: string, deps: CollectDeps): Promise<CollectOutcome | URL> {
  const check = checkPublicHttpUrl(raw);
  if (!check.ok) return fail(check.reason.includes("내부") ? 403 : 400, check.reason.includes("내부") ? "blocked_url" : "invalid_url", check.reason);

  const host = check.url.hostname;
  const literal = host.startsWith("[") ? host.slice(1, -1) : host;
  if (!looksLikeIp(literal)) {
    let addresses: string[];
    try {
      addresses = await deps.lookup(host);
    } catch {
      return fail(422, "fetch_failed", "주소를 찾을 수 없습니다.");
    }
    if (!allPublicIps(addresses)) {
      return fail(403, "blocked_url", "내부 주소에는 접근할 수 없습니다.");
    }
  }
  return check.url;
}

/** 응답 본문을 최대 크기까지만 읽는다. 넘치면 거기서 멈춘다. */
async function readLimited(response: Response, maxBytes: number): Promise<Uint8Array> {
  const reader = response.body?.getReader();
  if (!reader) return new Uint8Array();
  const chunks: Uint8Array[] = [];
  let total = 0;
  try {
    while (total < maxBytes) {
      const { done, value } = await reader.read();
      if (done || !value) break;
      const room = maxBytes - total;
      const chunk = value.byteLength > room ? value.subarray(0, room) : value;
      chunks.push(chunk);
      total += chunk.byteLength;
    }
  } finally {
    reader.cancel().catch(() => undefined);
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    out.set(c, offset);
    offset += c.byteLength;
  }
  return out;
}

export async function collectOpenGraph(
  inputUrl: string,
  deps: CollectDeps,
  limits = LIMITS,
): Promise<CollectOutcome> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), limits.timeoutMs);

  try {
    let current = inputUrl.trim();
    for (let hop = 0; hop <= limits.maxRedirects; hop++) {
      const target = await verifyTarget(current, deps);
      if (!(target instanceof URL)) return target;

      let response: Response;
      try {
        response = await deps.fetchImpl(target.toString(), {
          method: "GET",
          redirect: "manual",
          signal: controller.signal,
          cache: "no-store",
          headers: {
            "user-agent": USER_AGENT,
            accept: "text/html,application/xhtml+xml;q=0.9,*/*;q=0.1",
            "accept-language": "ko,en;q=0.8",
          },
        });
      } catch (err) {
        if (controller.signal.aborted) return fail(504, "timeout", "페이지 응답이 너무 늦습니다.");
        void err;
        return fail(422, "fetch_failed", "페이지를 가져오지 못했습니다.");
      }

      if (REDIRECT_STATUSES.has(response.status)) {
        const location = response.headers.get("location");
        response.body?.cancel().catch(() => undefined);
        if (!location) return fail(422, "fetch_failed", "리다이렉트 주소가 없습니다.");
        if (hop === limits.maxRedirects) {
          return fail(422, "too_many_redirects", "리다이렉트가 너무 많습니다.");
        }
        try {
          current = new URL(location, target).toString();
        } catch {
          return fail(422, "fetch_failed", "리다이렉트 주소가 올바르지 않습니다.");
        }
        continue;
      }

      if (!response.ok) {
        response.body?.cancel().catch(() => undefined);
        return fail(422, "fetch_failed", `페이지가 오류를 돌려주었습니다 (HTTP ${response.status}).`);
      }

      const contentType = response.headers.get("content-type") ?? "";
      const mime = contentType.split(";")[0].trim().toLowerCase();
      if (mime !== "text/html" && mime !== "application/xhtml+xml") {
        response.body?.cancel().catch(() => undefined);
        return fail(422, "not_html", "HTML 페이지가 아니라서 정보를 읽을 수 없습니다.");
      }

      let bytes: Uint8Array;
      try {
        bytes = await readLimited(response, limits.maxBodyBytes);
      } catch {
        if (controller.signal.aborted) return fail(504, "timeout", "페이지 응답이 너무 늦습니다.");
        return fail(422, "fetch_failed", "페이지 내용을 읽지 못했습니다.");
      }

      const finalUrl = target.toString();
      const html = decodeBytes(bytes, detectCharset(contentType, bytes));
      const meta = parseMetadata(html, finalUrl);
      return {
        ok: true,
        data: {
          title: meta.title,
          description: meta.description,
          image: meta.image,
          url: inputUrl.trim(),
          ogUrl: meta.ogUrl,
          finalUrl,
        },
      };
    }
    return fail(422, "too_many_redirects", "리다이렉트가 너무 많습니다.");
  } finally {
    clearTimeout(timer);
  }
}
