/**
 * 서버에서 외부 페이지를 가져오기 전에 주소가 "공개 웹페이지"인지 확인한다.
 * SSRF를 막기 위해 내부망·루프백·링크 로컬·메타데이터 주소 등을 모두 거부한다.
 * 이 모듈은 네트워크를 쓰지 않는다. DNS 조회는 호출자가 하고 결과 IP를 여기로 넘긴다.
 */

export type UrlCheck = { ok: true; url: URL } | { ok: false; reason: string };

const ALLOWED_PORTS = new Set(["", "80", "443"]);

/** 외부 조회를 허용하지 않는 호스트 이름 (접미사 포함) */
const BLOCKED_HOST_SUFFIXES = [".localhost", ".local", ".internal", ".home.arpa"];
const BLOCKED_HOSTS = new Set(["localhost", "0.0.0.0", "broadcasthost"]);

/** 문자열 주소를 검사해 안전한 URL 객체를 돌려준다. */
export function checkPublicHttpUrl(raw: string): UrlCheck {
  const trimmed = raw.trim();
  if (!trimmed) return { ok: false, reason: "URL을 입력해 주세요." };
  if (trimmed.length > 2048) return { ok: false, reason: "URL이 너무 깁니다." };

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    return { ok: false, reason: "올바른 URL 형식이 아닙니다." };
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    return { ok: false, reason: "http 또는 https 주소만 사용할 수 있습니다." };
  }
  if (url.username || url.password) {
    return { ok: false, reason: "사용자 이름이나 비밀번호가 포함된 주소는 사용할 수 없습니다." };
  }
  if (!ALLOWED_PORTS.has(url.port)) {
    return { ok: false, reason: "허용되지 않는 포트입니다." };
  }

  const host = url.hostname.toLowerCase();
  if (!host) return { ok: false, reason: "호스트가 없는 주소입니다." };
  if (isBlockedHostname(host)) {
    return { ok: false, reason: "내부 주소에는 접근할 수 없습니다." };
  }

  // IP 리터럴이면 바로 검사 (대괄호 IPv6 포함)
  const literal = host.startsWith("[") ? host.slice(1, -1) : host;
  if (looksLikeIp(literal) && !isPublicIp(literal)) {
    return { ok: false, reason: "내부 주소에는 접근할 수 없습니다." };
  }

  return { ok: true, url };
}

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname.toLowerCase().replace(/\.$/, "");
  if (BLOCKED_HOSTS.has(host)) return true;
  return BLOCKED_HOST_SUFFIXES.some((suffix) => host.endsWith(suffix));
}

export function looksLikeIp(value: string): boolean {
  return /^\d{1,3}(\.\d{1,3}){3}$/.test(value) || value.includes(":");
}

/** 모든 IP가 공개 주소여야 통과한다. 하나라도 내부 주소면 false. */
export function allPublicIps(addresses: string[]): boolean {
  return addresses.length > 0 && addresses.every(isPublicIp);
}

/** 공개 인터넷에서 접근 가능한 IP인지. 사설·루프백·링크 로컬·멀티캐스트 등은 false. */
export function isPublicIp(address: string): boolean {
  const ip = address.trim().toLowerCase();
  if (ip.includes(":")) return isPublicIpv6(ip);
  return isPublicIpv4(ip);
}

function parseIpv4(ip: string): number[] | null {
  const parts = ip.split(".");
  if (parts.length !== 4) return null;
  const nums = parts.map((p) => (/^\d{1,3}$/.test(p) ? Number(p) : NaN));
  if (nums.some((n) => Number.isNaN(n) || n > 255)) return null;
  return nums;
}

function isPublicIpv4(ip: string): boolean {
  const o = parseIpv4(ip);
  if (!o) return false;
  const [a, b] = o;
  if (a === 0) return false; // 0.0.0.0/8 "this network"
  if (a === 10) return false; // 10.0.0.0/8 사설
  if (a === 127) return false; // 루프백
  if (a === 169 && b === 254) return false; // 링크 로컬, 클라우드 메타데이터(169.254.169.254)
  if (a === 172 && b >= 16 && b <= 31) return false; // 172.16.0.0/12 사설
  if (a === 192 && b === 168) return false; // 192.168.0.0/16 사설
  if (a === 100 && b >= 64 && b <= 127) return false; // 100.64.0.0/10 CGNAT
  if (a === 192 && b === 0 && o[2] === 0) return false; // 192.0.0.0/24 IETF 프로토콜 할당
  if (a === 192 && b === 0 && o[2] === 2) return false; // 192.0.2.0/24 문서용
  if (a === 198 && (b === 18 || b === 19)) return false; // 198.18.0.0/15 벤치마크
  if (a === 198 && b === 51 && o[2] === 100) return false; // 198.51.100.0/24 문서용
  if (a === 203 && b === 0 && o[2] === 113) return false; // 203.0.113.0/24 문서용
  if (a >= 224) return false; // 멀티캐스트(224/4), 예약(240/4), 브로드캐스트
  return true;
}

/** IPv6 주소를 16비트 그룹 8개로 펼친다. 실패하면 null. */
function expandIpv6(ip: string): number[] | null {
  let s = ip;
  // 영역 ID(fe80::1%eth0)는 떼어낸다
  const zone = s.indexOf("%");
  if (zone !== -1) s = s.slice(0, zone);

  // IPv4가 섞인 형태(::ffff:1.2.3.4)는 마지막 부분을 16진 두 그룹으로 바꾼다
  const lastColon = s.lastIndexOf(":");
  const tail = s.slice(lastColon + 1);
  if (tail.includes(".")) {
    const v4 = parseIpv4(tail);
    if (!v4) return null;
    const hi = ((v4[0] << 8) | v4[1]).toString(16);
    const lo = ((v4[2] << 8) | v4[3]).toString(16);
    s = `${s.slice(0, lastColon)}:${hi}:${lo}`;
  }

  const halves = s.split("::");
  if (halves.length > 2) return null;
  const head = halves[0] ? halves[0].split(":") : [];
  const rest = halves.length === 2 && halves[1] ? halves[1].split(":") : [];
  const missing = 8 - head.length - rest.length;
  if (halves.length === 1 && missing !== 0) return null;
  if (halves.length === 2 && missing < 1) return null;
  const groups = [...head, ...Array(halves.length === 2 ? missing : 0).fill("0"), ...rest];
  if (groups.length !== 8) return null;
  const nums = groups.map((g) => (/^[0-9a-f]{1,4}$/.test(g) ? parseInt(g, 16) : NaN));
  return nums.some(Number.isNaN) ? null : nums;
}

function isPublicIpv6(ip: string): boolean {
  const g = expandIpv6(ip);
  if (!g) return false;
  const isZeroPrefix = g.slice(0, 5).every((x) => x === 0);

  // ::1 루프백, :: 미지정
  if (g.slice(0, 7).every((x) => x === 0) && (g[7] === 0 || g[7] === 1)) return false;
  // ::ffff:a.b.c.d IPv4 매핑 → 안의 IPv4로 판단
  if (isZeroPrefix && g[5] === 0xffff) {
    return isPublicIpv4(`${g[6] >> 8}.${g[6] & 0xff}.${g[7] >> 8}.${g[7] & 0xff}`);
  }
  // 64:ff9b::/96 NAT64 → 안의 IPv4로 판단
  if (g[0] === 0x64 && g[1] === 0xff9b && g.slice(2, 6).every((x) => x === 0)) {
    return isPublicIpv4(`${g[6] >> 8}.${g[6] & 0xff}.${g[7] >> 8}.${g[7] & 0xff}`);
  }
  if ((g[0] & 0xfe00) === 0xfc00) return false; // fc00::/7 고유 로컬
  if ((g[0] & 0xffc0) === 0xfe80) return false; // fe80::/10 링크 로컬
  if ((g[0] & 0xff00) === 0xff00) return false; // ff00::/8 멀티캐스트
  if (g[0] === 0x2001 && g[1] === 0x0db8) return false; // 2001:db8::/32 문서용
  return true;
}
