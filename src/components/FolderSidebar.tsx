"use client";

import FolderMenu from "@/components/FolderMenu";
import { isSystemFolder } from "@/lib/vault";
import {
  ALL_FILTER,
  ALL_FILTER_NAME,
  type Folder,
  type FolderFilter,
  type FolderId,
} from "@/lib/types";

interface FolderSidebarProps {
  folders: Folder[];
  selected: FolderFilter;
  counts: Record<FolderFilter, number>;
  onSelect: (id: FolderFilter) => void;
  onRenameFolder: (id: FolderId) => void;
  onDeleteFolder: (id: FolderId) => void;
}

export default function FolderSidebar({
  folders,
  selected,
  counts,
  onSelect,
  onRenameFolder,
  onDeleteFolder,
}: FolderSidebarProps) {
  const items: { id: FolderFilter; name: string; editable: boolean }[] = [
    { id: ALL_FILTER, name: ALL_FILTER_NAME, editable: false },
    ...folders.map((f) => ({ id: f.id, name: f.name, editable: !isSystemFolder(f.id) })),
  ];

  return (
    <nav aria-label="폴더" className="md:w-56 md:shrink-0">
      {/* 모바일: 가로 스크롤 칩 / 데스크톱: 세로 메뉴 */}
      <ul className="scrollbar-none -mx-[var(--space-page-x)] flex gap-2 overflow-x-auto px-[var(--space-page-x)] md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:px-0">
        {items.map((item) => {
          const active = item.id === selected;
          return (
            <li
              key={item.id}
              className={`nav-item relative flex shrink-0 items-center pr-1.5 ${
                active ? "nav-item-active" : ""
              }`}
            >
              <button
                type="button"
                onClick={() => onSelect(item.id)}
                aria-current={active ? "page" : undefined}
                className="flex min-w-0 flex-1 items-center gap-2 whitespace-nowrap py-2.5 pl-4 pr-2 text-left text-[15px]"
              >
                <span className="truncate md:max-w-[9rem]">{item.name}</span>
                <span
                  className={`ml-auto text-[var(--text-caption)] ${
                    active ? "text-[var(--accent)]" : "text-[var(--text-sub)]"
                  }`}
                >
                  {counts[item.id] ?? 0}
                </span>
              </button>
              {item.editable ? (
                <FolderMenu
                  folderName={item.name}
                  onRename={() => onRenameFolder(item.id)}
                  onDelete={() => onDeleteFolder(item.id)}
                />
              ) : (
                <span className="h-7 w-2.5 shrink-0 md:w-7" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
