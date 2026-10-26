"use client";

import ActionMenu from "@/components/ActionMenu";
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
  /** 로그인한 사용자 이메일. 사이드바 맨 아래 로그아웃 버튼 위에 보여 준다. */
  userEmail: string | null;
  onSelect: (id: FolderFilter) => void;
  onRenameFolder: (id: FolderId) => void;
  onDeleteFolder: (id: FolderId) => void;
  onSignOut: () => void;
}

export default function FolderSidebar({
  folders,
  selected,
  counts,
  userEmail,
  onSelect,
  onRenameFolder,
  onDeleteFolder,
  onSignOut,
}: FolderSidebarProps) {
  const items: { id: FolderFilter; name: string; editable: boolean }[] = [
    { id: ALL_FILTER, name: ALL_FILTER_NAME, editable: false },
    ...folders.map((f) => ({ id: f.id, name: f.name, editable: !isSystemFolder(folders, f.id) })),
  ];

  return (
    <nav aria-label="폴더" className="md:flex md:w-56 md:shrink-0 md:flex-col">
      {/* 모바일: 가로 스크롤 칩 / 데스크톱: 세로 메뉴 */}
      <ul className="scrollbar-none -mx-[var(--space-page-x)] flex gap-2 overflow-x-auto px-[var(--space-page-x)] md:mx-0 md:flex-col md:gap-1 md:overflow-visible md:px-0">
        {items.map((item) => {
          const active = item.id === selected;
          return (
            <li
              key={item.id}
              className={`nav-item flex shrink-0 items-center pr-1.5 ${
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
                <ActionMenu
                  subject={`${item.name} 폴더`}
                  items={[
                    { label: "이름 변경", onSelect: () => onRenameFolder(item.id) },
                    { label: "삭제", onSelect: () => onDeleteFolder(item.id), danger: true },
                  ]}
                />
              ) : (
                <span className="h-7 w-2.5 shrink-0 md:w-7" aria-hidden="true" />
              )}
            </li>
          );
        })}
      </ul>

      {/* 데스크톱: 사이드바 맨 아래에 사용자 이메일과 로그아웃. 모바일은 헤더의 버튼을 쓴다. */}
      <div className="hidden md:mt-auto md:flex md:flex-col md:gap-1 md:pt-[var(--space-section)]">
        {userEmail !== null && (
          <span
            className="truncate px-4 text-[var(--text-caption)] text-[var(--text-sub)]"
            title={userEmail}
          >
            {userEmail}
          </span>
        )}
        <button
          type="button"
          onClick={onSignOut}
          className="nav-item flex w-full items-center py-2.5 pl-4 pr-2 text-left text-[15px] font-semibold text-[var(--text-sub)]"
        >
          로그아웃
        </button>
      </div>
    </nav>
  );
}
