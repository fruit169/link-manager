/** POST /api/og 가 돌려주는 수집 결과 */
export interface OpenGraphData {
  /** og:title → <title> 순서. 없으면 빈 문자열 */
  title: string;
  /** og:description → meta description 순서. 없으면 빈 문자열 */
  description: string;
  /** og:image를 최종 응답 주소 기준 절대 URL로 바꾼 값. 없으면 빈 문자열 */
  image: string;
  /** 사용자가 입력한 URL (저장 시 기본 링크 주소) */
  url: string;
  /** 페이지가 선언한 og:url (절대 URL). 없으면 빈 문자열 */
  ogUrl: string;
  /** 리다이렉트를 따라간 최종 응답 URL */
  finalUrl: string;
}

export type OgErrorCode =
  | "invalid_url"
  | "blocked_url"
  | "fetch_failed"
  | "timeout"
  | "not_html"
  | "too_many_redirects"
  | "bad_request";

export type OgResponse =
  | { ok: true; data: OpenGraphData }
  | { ok: false; error: { code: OgErrorCode; message: string } };
