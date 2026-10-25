import { describe, expect, it } from "vitest";
import { collectOpenGraph, type CollectDeps } from "@/lib/og/collect";
import {
  decodeEntities,
  detectCharset,
  parseMetadata,
  resolveHttpUrl,
  toPlainText,
} from "@/lib/og/parse-html";
import { checkPublicHttpUrl, isPublicIp } from "@/lib/og/validate-url";

describe("checkPublicHttpUrl", () => {
  it("http/https 공개 주소만 허용한다", () => {
    expect(checkPublicHttpUrl("https://example.com/page")).toMatchObject({ ok: true });
    expect(checkPublicHttpUrl("  http://example.com  ")).toMatchObject({ ok: true });
    expect(checkPublicHttpUrl("ftp://example.com")).toMatchObject({ ok: false });
    expect(checkPublicHttpUrl("javascript:alert(1)")).toMatchObject({ ok: false });
    expect(checkPublicHttpUrl("file:///etc/passwd")).toMatchObject({ ok: false });
    expect(checkPublicHttpUrl("not a url")).toMatchObject({ ok: false });
    expect(checkPublicHttpUrl("")).toMatchObject({ ok: false });
  });

  it("사용자 이름·비밀번호가 든 주소는 거부한다", () => {
    expect(checkPublicHttpUrl("https://user:pw@example.com")).toMatchObject({ ok: false });
    expect(checkPublicHttpUrl("https://user@example.com")).toMatchObject({ ok: false });
  });

  it("localhost·루프백·사설 IP·링크 로컬·메타데이터 주소를 거부한다", () => {
    const blocked = [
      "http://localhost:3000",
      "http://app.localhost",
      "http://printer.local",
      "http://127.0.0.1",
      "http://127.1.2.3",
      "http://0.0.0.0",
      "http://10.0.0.1",
      "http://172.16.5.5",
      "http://172.31.255.255",
      "http://192.168.0.1",
      "http://169.254.169.254/latest/meta-data",
      "http://100.64.0.1",
      "http://[::1]",
      "http://[fe80::1]",
      "http://[fd00::1]",
      "http://[::ffff:127.0.0.1]",
      "http://[::ffff:10.0.0.1]",
      "http://[64:ff9b::7f00:1]",
    ];
    for (const url of blocked) {
      expect(checkPublicHttpUrl(url), url).toMatchObject({ ok: false });
    }
  });

  it("비표준 포트는 거부한다", () => {
    expect(checkPublicHttpUrl("http://example.com:8080")).toMatchObject({ ok: false });
    expect(checkPublicHttpUrl("https://example.com:443")).toMatchObject({ ok: true });
  });
});

describe("isPublicIp", () => {
  it("공개 IP는 통과한다", () => {
    expect(isPublicIp("93.184.216.34")).toBe(true);
    expect(isPublicIp("2606:2800:220:1:248:1893:25c8:1946")).toBe(true);
    expect(isPublicIp("172.32.0.1")).toBe(true);
  });
  it("내부 IP는 막는다", () => {
    expect(isPublicIp("127.0.0.1")).toBe(false);
    expect(isPublicIp("10.1.1.1")).toBe(false);
    expect(isPublicIp("192.168.1.1")).toBe(false);
    expect(isPublicIp("169.254.169.254")).toBe(false);
    expect(isPublicIp("::1")).toBe(false);
    expect(isPublicIp("fe80::1%eth0")).toBe(false);
    expect(isPublicIp("fc00::1")).toBe(false);
    expect(isPublicIp("::ffff:192.168.0.1")).toBe(false);
    expect(isPublicIp("999.1.1.1")).toBe(false);
  });
});

describe("parseMetadata", () => {
  const base = "https://example.com/blog/post";

  it("og 태그를 우선 읽고 상대 경로 이미지를 절대 URL로 바꾼다", () => {
    const html = `<html><head>
      <title>HTML 제목</title>
      <meta name="description" content="메타 설명">
      <meta property="og:title" content="OG 제목 &amp; 더">
      <meta content="OG 설명" property="og:description">
      <meta property="og:image" content="/img/cover.png?v=1">
      <meta property="og:url" content="https://example.com/canonical">
    </head><body>본문</body></html>`;
    expect(parseMetadata(html, base)).toEqual({
      title: "OG 제목 & 더",
      description: "OG 설명",
      image: "https://example.com/img/cover.png?v=1",
      ogUrl: "https://example.com/canonical",
    });
  });

  it("og 태그가 없으면 <title>과 meta description으로 대체한다", () => {
    const html = `<html><head><title>  Example
      Domain </title><meta name="Description" content="설명 &#44;입니다"></head></html>`;
    expect(parseMetadata(html, base)).toEqual({
      title: "Example Domain",
      description: "설명 ,입니다",
      image: "",
      ogUrl: "",
    });
  });

  it("정보가 없으면 빈 값이다", () => {
    expect(parseMetadata("<html><body>no head</body></html>", base)).toEqual({
      title: "",
      description: "",
      image: "",
      ogUrl: "",
    });
  });

  it("제목 안의 태그와 스크립트 속 가짜 메타는 무시한다", () => {
    const html = `<head><script>document.write('<meta property="og:title" content="가짜">')</script>
      <title><b>굵은</b> 제목</title></head>`;
    expect(parseMetadata(html, base).title).toBe("굵은 제목");
  });

  it("http(s)가 아닌 이미지 주소는 버린다", () => {
    const html = `<head><meta property="og:image" content="data:image/png;base64,AAAA"></head>`;
    expect(parseMetadata(html, base).image).toBe("");
  });

  it("매우 긴 제목은 잘라낸다", () => {
    const html = `<head><title>${"가".repeat(500)}</title></head>`;
    expect(parseMetadata(html, base).title.length).toBeLessThanOrEqual(200);
  });
});

describe("text helpers", () => {
  it("엔티티를 복원한다", () => {
    expect(decodeEntities("&lt;a&gt; &quot;x&quot; &#39;y&#39; &#x1F600;")).toBe("<a> \"x\" 'y' 😀");
  });
  it("태그를 제거하고 공백을 정리한다", () => {
    expect(toPlainText("  <b>a</b>\n\n b  ", 100)).toBe("a b");
  });
  it("상대 경로를 푼다", () => {
    expect(resolveHttpUrl("../x.png", "https://a.com/b/c/")).toBe("https://a.com/b/x.png");
    expect(resolveHttpUrl("//cdn.a.com/x.png", "https://a.com/")).toBe("https://cdn.a.com/x.png");
  });
  it("문자 인코딩을 헤더 → meta 순으로 찾는다", () => {
    const bytes = new TextEncoder().encode('<meta charset="euc-kr">');
    expect(detectCharset("text/html; charset=UTF-8", bytes)).toBe("utf-8");
    expect(detectCharset("text/html", bytes)).toBe("euc-kr");
    expect(detectCharset(null, new Uint8Array())).toBe("utf-8");
  });
});

/* ------------------------------ collectOpenGraph ------------------------------ */

function htmlResponse(body: string, init: ResponseInit = {}): Response {
  return new Response(body, {
    status: 200,
    headers: { "content-type": "text/html; charset=utf-8" },
    ...init,
  });
}

function makeDeps(
  routes: Record<string, () => Response>,
  lookup: CollectDeps["lookup"] = async () => ["93.184.216.34"],
): CollectDeps & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    lookup,
    fetchImpl: (async (input: RequestInfo | URL) => {
      const key = typeof input === "string" ? input : input.toString();
      calls.push(key);
      const handler = routes[key];
      if (!handler) throw new Error(`unexpected ${key}`);
      return handler();
    }) as typeof fetch,
  };
}

describe("collectOpenGraph", () => {
  it("정상 페이지에서 메타데이터를 모은다", async () => {
    const deps = makeDeps({
      "https://example.com/": () =>
        htmlResponse('<head><meta property="og:title" content="T"><meta property="og:image" content="/i.png"></head>'),
    });
    const out = await collectOpenGraph(" https://example.com ", deps);
    expect(out).toEqual({
      ok: true,
      data: {
        title: "T",
        description: "",
        image: "https://example.com/i.png",
        url: "https://example.com",
        ogUrl: "",
        finalUrl: "https://example.com/",
      },
    });
  });

  it("리다이렉트를 따라가고 최종 주소를 돌려준다", async () => {
    const deps = makeDeps({
      "https://example.com/": () =>
        new Response(null, { status: 301, headers: { location: "/final" } }),
      "https://example.com/final": () => htmlResponse("<head><title>Final</title></head>"),
    });
    const out = await collectOpenGraph("https://example.com", deps);
    expect(out.ok).toBe(true);
    if (out.ok) {
      expect(out.data.finalUrl).toBe("https://example.com/final");
      expect(out.data.title).toBe("Final");
      expect(out.data.url).toBe("https://example.com");
    }
  });

  it("내부 주소로 가는 리다이렉트는 차단한다", async () => {
    const deps = makeDeps({
      "https://example.com/": () =>
        new Response(null, { status: 302, headers: { location: "http://169.254.169.254/" } }),
    });
    const out = await collectOpenGraph("https://example.com", deps);
    expect(out).toMatchObject({ ok: false, status: 403, code: "blocked_url" });
    expect(deps.calls).toEqual(["https://example.com/"]);
  });

  it("DNS가 사설 IP를 가리키는 호스트는 요청하지 않는다", async () => {
    const deps = makeDeps({}, async () => ["10.0.0.5"]);
    const out = await collectOpenGraph("https://evil.example", deps);
    expect(out).toMatchObject({ ok: false, status: 403, code: "blocked_url" });
    expect(deps.calls).toEqual([]);
  });

  it("DNS 결과 중 하나라도 내부 주소면 차단한다", async () => {
    const deps = makeDeps({}, async () => ["93.184.216.34", "127.0.0.1"]);
    const out = await collectOpenGraph("https://evil.example", deps);
    expect(out).toMatchObject({ ok: false, code: "blocked_url" });
  });

  it("리다이렉트 횟수를 제한한다", async () => {
    const routes: Record<string, () => Response> = {};
    for (let i = 0; i < 10; i++) {
      routes[`https://example.com/${i}`] = () =>
        new Response(null, { status: 302, headers: { location: `/${i + 1}` } });
    }
    const deps = makeDeps(routes);
    const out = await collectOpenGraph("https://example.com/0", deps);
    expect(out).toMatchObject({ ok: false, code: "too_many_redirects" });
    expect(deps.calls.length).toBeLessThanOrEqual(6);
  });

  it("HTML이 아닌 응답은 분석하지 않는다", async () => {
    const deps = makeDeps({
      "https://example.com/data.json": () =>
        new Response("{}", { status: 200, headers: { "content-type": "application/json" } }),
    });
    const out = await collectOpenGraph("https://example.com/data.json", deps);
    expect(out).toMatchObject({ ok: false, code: "not_html" });
  });

  it("오류 상태 코드는 실패로 처리한다", async () => {
    const deps = makeDeps({
      "https://example.com/": () => new Response("nope", { status: 404 }),
    });
    const out = await collectOpenGraph("https://example.com", deps);
    expect(out).toMatchObject({ ok: false, code: "fetch_failed" });
  });

  it("본문이 크기 제한을 넘으면 앞부분만 사용한다", async () => {
    const head = '<head><meta property="og:title" content="큰 페이지"></head>';
    const deps = makeDeps({
      "https://example.com/": () => htmlResponse(head + "x".repeat(50_000)),
    });
    const out = await collectOpenGraph("https://example.com", deps, {
      maxRedirects: 5,
      timeoutMs: 8000,
      maxBodyBytes: 2048,
    });
    expect(out).toMatchObject({ ok: true, data: { title: "큰 페이지" } });
  });

  it("시간 제한을 넘기면 timeout으로 실패한다", async () => {
    const deps: CollectDeps = {
      lookup: async () => ["93.184.216.34"],
      fetchImpl: ((_input: RequestInfo | URL, init?: RequestInit) =>
        new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () =>
            reject(new DOMException("aborted", "AbortError")),
          );
        })) as typeof fetch,
    };
    const out = await collectOpenGraph("https://example.com", deps, {
      maxRedirects: 5,
      timeoutMs: 20,
      maxBodyBytes: 1024,
    });
    expect(out).toMatchObject({ ok: false, code: "timeout", status: 504 });
  });

  it("잘못된 URL은 400으로 거부한다", async () => {
    const deps = makeDeps({});
    expect(await collectOpenGraph("ftp://example.com", deps)).toMatchObject({
      ok: false,
      status: 400,
      code: "invalid_url",
    });
    expect(deps.calls).toEqual([]);
  });
});
