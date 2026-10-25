import LinkCard from "@/components/LinkCard";
import type { Folder, Link } from "@/lib/types";

interface LinkGridProps {
  links: Link[];
  folders: Folder[];
}

export default function LinkGrid({ links, folders }: LinkGridProps) {
  const folderName = (id: Link["folderId"]) =>
    folders.find((f) => f.id === id)?.name ?? "기타";

  if (links.length === 0) {
    return (
      <div className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-gray-300 bg-white py-20 text-sm text-gray-500">
        이 폴더에는 아직 링크가 없습니다.
      </div>
    );
  }

  return (
    <div className="grid flex-1 content-start grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {links.map((link) => (
        <LinkCard
          key={link.id}
          link={link}
          folderName={folderName(link.folderId)}
        />
      ))}
    </div>
  );
}
