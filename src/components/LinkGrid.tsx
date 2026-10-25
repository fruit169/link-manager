import LinkCard from "@/components/LinkCard";
import type { Folder, Link } from "@/lib/types";

interface LinkGridProps {
  links: Link[];
  folders: Folder[];
  /** 지금 보고 있는 폴더 이름. '전체'면 null */
  folderName: string | null;
}

export default function LinkGrid({ links, folders, folderName }: LinkGridProps) {
  const nameOf = (id: Link["folderId"]) =>
    folders.find((f) => f.id === id)?.name ?? "미분류";

  if (links.length === 0) {
    return (
      <div className="card flex flex-1 flex-col items-center justify-center gap-1 px-6 py-20 text-center">
        <p className="text-[var(--text-body)] font-bold text-[var(--text)]">
          {folderName ? `'${folderName}' 폴더가 비어 있습니다` : "아직 링크가 없습니다"}
        </p>
        <p className="text-[var(--text-sub-size)] text-[var(--text-sub)]">
          오른쪽 위 &apos;+ 새 링크&apos;로 첫 링크를 추가해 보세요.
        </p>
      </div>
    );
  }

  return (
    <div className="grid flex-1 content-start grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {links.map((link) => (
        <LinkCard key={link.id} link={link} folderName={nameOf(link.folderId)} />
      ))}
    </div>
  );
}
