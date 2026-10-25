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
    <nav aria-label="폴더" className="md:w-48 md:shrink-0">
      {/* 모바일: 가로 스크롤 칩 / 데스크톱: 세로 메뉴 */}
      <ul className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:px-0 md:pb-0">
        {items.map((item) => {
          const active = item.id === selected;
          return (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={active ? "page" : undefined}
                className={`flex w-full items-center justify-between gap-3 whitespace-nowrap rounded-md px-3 py-2 text-sm transition ${
                  active
                    ? "bg-blue-500 font-semibold text-white"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                <span>{item.name}</span>
                <span
                  className={`text-xs ${active ? "text-blue-100" : "text-gray-400"}`}
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
