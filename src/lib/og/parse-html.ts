/**
 * HTML 문자열에서 오픈 그래프 메타데이터를 뽑아낸다.
 * 외부 파서 없이 <meta>와 <title> 태그만 정규식으로 읽는다. 결과는 모두 일반 텍스트다.
 */

export interface ParsedMeta {
  title: string;
  description: string;
  image: string;
  ogUrl: string;
}

const MAX_TITLE = 200;
const MAX_DESCRIPTION = 500;

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: " ",
  ndash: "–",
  mdash: "—",
  hellip: "…",
  copy: "©",
  reg: "®",
  trade: "™",
  laquo: "«",
  raquo: "»",
  lsquo: "‘",
  rsquo: "’",
  ldquo: "“",
  rdquo: "”",
  middot: "·",
};

export function decodeEntities(text: string): string {
  return text.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (match, body: string) => {
    const lower = body.toLowerCase();
    if (lower.startsWith("#x")) {
      const code = parseInt(lower.slice(2), 16);
      return Number.isFinite(code) ? safeFromCodePoint(code, match) : match;
    }
    if (lower.startsWith("#")) {
      const code = parseInt(lower.slice(1), 10);
      return Number.isFinite(code) ? safeFromCodePoint(code, match) : match;
    }
    return NAMED_ENTITIES[lower] ?? match;
  });
}

function safeFromCodePoint(code: number, fallback: string): string {
  try {
    return String.fromCodePoint(code);
  } catch {
    return fallback;
  }
}

/** 태그 제거 → 엔티티 복원 → 공백 정리 → 길이 제한 */
export function toPlainText(raw: string, maxLength: number): string {
  const text = decodeEntities(raw.replace(/<[^>]*>/g, " "))
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength - 1).trimEnd()}…` : text;
}

/** 태그 하나의 속성 문자열을 {이름: 값} 으로 푼다. 이름은 소문자. */
function parseAttributes(attrText: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)\s*(?:=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(attrText)) !== null) {
    const name = m[1].toLowerCase();
    const value = m[2] ?? m[3] ?? m[4] ?? "";
    if (!(name in attrs)) attrs[name] = decodeEntities(value);
  }
  return attrs;
}

/** <head> 영역이 있으면 거기까지만 본다. 없으면 전체(이미 크기 제한된) 문서를 본다. */
function headSection(html: string): string {
  const headEnd = html.search(/<\/head\s*>/i);
  if (headEnd !== -1) return html.slice(0, headEnd);
  const bodyStart = html.search(/<body[\s>]/i);
  return bodyStart !== -1 ? html.slice(0, bodyStart) : html;
}

/** 주석과 스크립트/스타일 블록은 메타 추출 대상에서 제외한다. */
function stripNoise(html: string): string {
  return html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<script\b[\s\S]*?<\/script\s*>/gi, "")
    .replace(/<style\b[\s\S]*?<\/style\s*>/gi, "");
}

export function parseMetadata(html: string, baseUrl: string): ParsedMeta {
  const head = stripNoise(headSection(html));

  const meta: Record<string, string> = {};
  const metaRe = /<meta\b([^>]*)>/gi;
  let m: RegExpExecArray | null;
  while ((m = metaRe.exec(head)) !== null) {
    const attrs = parseAttributes(m[1]);
    const key = (attrs.property ?? attrs.name ?? "").toLowerCase();
    const content = attrs.content;
    if (!key || content === undefined) continue;
    // 같은 키가 여러 번 나오면 첫 번째를 쓴다 (og:image는 보통 첫 번째가 대표 이미지)
    if (!(key in meta) && content.trim()) meta[key] = content;
  }

  const titleTag = /<title\b[^>]*>([\s\S]*?)<\/title\s*>/i.exec(head);
  const htmlTitle = titleTag ? titleTag[1] : "";

  const title = toPlainText(meta["og:title"] ?? htmlTitle, MAX_TITLE);
  const description = toPlainText(
    meta["og:description"] ?? meta["description"] ?? "",
    MAX_DESCRIPTION,
  );
  const image = resolveHttpUrl(meta["og:image"] ?? meta["og:image:url"] ?? "", baseUrl);
  const ogUrl = resolveHttpUrl(meta["og:url"] ?? "", baseUrl);

  return { title, description, image, ogUrl };
}

/** 상대 경로를 base 기준 절대 URL로 바꾼다. http(s)가 아니거나 못 풀면 빈 문자열. */
export function resolveHttpUrl(value: string, baseUrl: string): string {
  const trimmed = toPlainText(value, 2048);
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed, baseUrl);
    return u.protocol === "http:" || u.protocol === "https:" ? u.toString() : "";
  } catch {
    return "";
  }
}

/** Content-Type 헤더나 <meta charset>에서 문자 인코딩 이름을 찾는다. 없으면 utf-8. */
export function detectCharset(contentType: string | null, headBytes: Uint8Array): string {
  const fromHeader = /charset\s*=\s*["']?([\w-]+)/i.exec(contentType ?? "");
  if (fromHeader) return fromHeader[1].toLowerCase();
  const sniff = new TextDecoder("latin1").decode(headBytes.subarray(0, 4096));
  const fromMeta =
    /<meta\b[^>]*charset\s*=\s*["']?\s*([\w-]+)/i.exec(sniff) ??
    /<meta\b[^>]*content\s*=\s*["'][^"']*charset=([\w-]+)/i.exec(sniff);
  return fromMeta ? fromMeta[1].toLowerCase() : "utf-8";
}

/** 알 수 없는 인코딩이면 utf-8로 대체한다. */
export function decodeBytes(bytes: Uint8Array, charset: string): string {
  try {
    return new TextDecoder(charset).decode(bytes);
  } catch {
    return new TextDecoder("utf-8").decode(bytes);
  }
}
