"use client";

import { useEffect, useState } from "react";

interface FolderMenuProps {
  folderName: string;
  onRename: () => void;
  onDelete: () => void;
}

/**
 * 폴더 항목 오른쪽의 ⋯ 버튼과 그 메뉴.
 * 데스크톱에서는 버튼 아래 팝오버, 모바일에서는 화면 아래 시트로 열린다.
 */
export default function FolderMenu({ folderName, onRename, onDelete }: FolderMenuProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const pick = (action: () => void) => {
    setOpen(false);
    action();
  };

  return (
    <>
      <button
        type="button"
        aria-label={`${folderName} 폴더 메뉴`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className="icon-btn flex h-7 w-7 shrink-0 items-center justify-center text-[18px] leading-none"
      >
        ⋯
      </button>

      {open && (
        <>
          {/* 바깥 클릭을 받는 투명 배경 (모바일에서는 살짝 어둡게) */}
          <div
            className="fixed inset-0 z-20 bg-[var(--overlay)] md:bg-transparent"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          />
          <div
            role="menu"
            aria-label={`${folderName} 폴더 메뉴`}
            onClick={(e) => e.stopPropagation()}
            className="menu-panel fixed inset-x-0 bottom-0 z-30 rounded-t-[var(--radius-card)] p-2 pb-[max(8px,env(safe-area-inset-bottom))] md:absolute md:inset-x-auto md:right-0 md:top-full md:bottom-auto md:mt-1 md:w-40 md:rounded-[var(--radius-button)] md:p-1.5"
          >
            <p className="truncate px-3 py-2 text-[var(--text-caption)] font-semibold text-[var(--text-sub)] md:hidden">
              {folderName}
            </p>
            <button
              type="button"
              role="menuitem"
              onClick={() => pick(onRename)}
              className="menu-item block w-full px-3 py-3 text-left text-[15px] md:py-2 md:text-[14px]"
            >
              이름 변경
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => pick(onDelete)}
              className="menu-item menu-item-danger block w-full px-3 py-3 text-left text-[15px] md:py-2 md:text-[14px]"
            >
              삭제
            </button>
          </div>
        </>
      )}
    </>
  );
}
