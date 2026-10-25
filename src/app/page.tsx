import LinkVault from "@/components/LinkVault";
import { folders, sampleLinks } from "@/data/links";

export default function Home() {
  return (
    <LinkVault
      appName="나만의 링크 보관함"
      folders={folders}
      initialLinks={sampleLinks}
    />
  );
}
