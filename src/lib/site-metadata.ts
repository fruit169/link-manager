import type { Metadata } from "next";

/** 사이트 공통 정보. 루트 레이아웃과 각 페이지의 메타 태그가 함께 쓴다. */
export const SITE = {
  name: "나만의 링크 보관함",
  description:
    "쌓아두기만 했던 링크를 폴더로 깔끔하게 정리하세요. 자주 쓰는 링크를 모아 두고 어디서나 열어 보는 링크 보관함입니다.",
  /** 배포 주소. .env.local 의 NEXT_PUBLIC_SITE_URL 이 없으면 로컬 개발 주소 */
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  /** 오픈 그래프·트위터 카드 썸네일 (public/thumbnail.png) */
  thumbnail: { url: "/thumbnail.png", width: 1672, height: 941 },
} as const;

interface PageMetadataInput {
  /** 페이지 제목. 탭에는 "제목 · 사이트명" 으로 보인다 */
  title: string;
  description: string;
  /** 페이지 경로 (예: "/login") */
  path: string;
  /** 검색 엔진에 노출하지 않을 페이지 (비밀번호 재설정 등) */
  noIndex?: boolean;
  /** true 면 제목에 사이트명을 덧붙이지 않는다 (인덱스 페이지처럼 제목이 곧 사이트명일 때) */
  absoluteTitle?: boolean;
}

/**
 * 페이지별 메타 태그를 만든다.
 * Next.js 는 페이지의 openGraph 를 루트 것과 합치지 않고 통째로 바꾸므로,
 * 썸네일·사이트명·로케일을 여기서 매번 채워 어느 페이지를 공유해도 같은 카드가 나오게 한다.
 */
export function pageMetadata({
  title,
  description,
  path,
  noIndex = false,
  absoluteTitle = false,
}: PageMetadataInput): Metadata {
  const fullTitle = absoluteTitle ? title : `${title} · ${SITE.name}`;
  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    ...(noIndex ? { robots: { index: false, follow: false } } : {}),
    openGraph: {
      type: "website",
      locale: "ko_KR",
      siteName: SITE.name,
      title: fullTitle,
      description,
      url: path,
      images: [{ ...SITE.thumbnail, alt: `${SITE.name} 미리보기` }],
    },
    twitter: {
      card: "summary_large_image",
      title: fullTitle,
      description,
      images: [SITE.thumbnail.url],
    },
  };
}
