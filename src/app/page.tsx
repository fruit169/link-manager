import LinkVault from "@/components/LinkVault";
import { SITE, pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: SITE.name,
  description: "폴더별로 정리한 내 링크를 한눈에 보고, 새 링크를 추가하거나 검색합니다.",
  path: "/",
  absoluteTitle: true,
});

export default function Home() {
  return <LinkVault appName={SITE.name} />;
}
