import type { Folder, FolderFilter } from "@/lib/types";

interface FolderSidebarProps {
  folders: Folder[];
  selected: FolderFilter;
  counts: Record<FolderFilter, number>;
  onSelect: (id: FolderFilter) => void;
}

export default function FolderSidebar({
  folders,
  selected,
  counts,
  onSelect,
}: FolderSidebarProps) {
  const items: { id: FolderFilter; name: string }[] = [
    { id: "all", name: "전체" },
    ...folders,
  ];

  return (
    <nav aria-label="폴더" className="md:w-52 md:shrink-0">
      {/* 모바일: 가로 스크롤 칩 / 데스크톱: 세로 메뉴 */}
      <ul className="scrollbar-none -mx-[var(--space-page-x)] flex gap-2 overflow-x-auto px-[var(--space-page-x)] md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:px-0">
        {items.map((item) => {
          const active = item.id === selected;
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={active ? "page" : undefined}
                className={`nav-item flex w-full items-center justify-between gap-3 whitespace-nowrap px-4 py-2.5 text-[15px] ${
                  active ? "nav-item-active" : ""
                }`}
              >
                <span>{item.name}</span>
                <span
                  className={`text-[var(--text-caption)] ${
                    active ? "text-[var(--accent)]" : "text-[var(--text-sub)]"
                  }`}
                >
                  {counts[item.id]}
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
