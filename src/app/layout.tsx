import type { Metadata } from "next";
import { SITE } from "@/lib/site-metadata";
import "./globals.css";

/**
 * 모든 페이지의 기본 메타 태그. 각 페이지는 lib/site-metadata 의 pageMetadata() 로 제목·설명을 덮어쓴다.
 * - 파비콘: src/app/favicon.ico (Next.js 파일 규칙으로 <link rel="icon"> 자동 생성)
 * - 썸네일: public/thumbnail.png (오픈 그래프·트위터 카드 이미지)
 */
export const metadata: Metadata = {
  metadataBase: new URL(SITE.url),
  title: {
    default: SITE.name,
    template: `%s · ${SITE.name}`,
  },
  description: SITE.description,
  applicationName: SITE.name,
  keywords: ["링크 보관함", "북마크", "링크 정리", "폴더", "링크 모음"],
  openGraph: {
    type: "website",
    locale: "ko_KR",
    siteName: SITE.name,
    title: SITE.name,
    description: SITE.description,
    url: "/",
    images: [{ ...SITE.thumbnail, alt: `${SITE.name} 미리보기` }],
  },
  twitter: {
    card: "summary_large_image",
    title: SITE.name,
    description: SITE.description,
    images: [SITE.thumbnail.url],
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
