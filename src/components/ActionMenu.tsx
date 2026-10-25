"use client";

import { useEffect, useState } from "react";

export interface ActionMenuItem {
  label: string;
  onSelect: () => void;
  danger?: boolean;
}

interface ActionMenuProps {
  /** 메뉴가 속한 대상 이름 (접근성 레이블, 모바일 시트 제목) */
  subject: string;
  items: ActionMenuItem[];
  /** 열림 상태가 바뀔 때 알려준다 (카드가 z-index를 올리는 데 쓴다) */
  onOpenChange?: (open: boolean) => void;
  /** 버튼 크기·색 조정용 추가 클래스 */
  buttonClassName?: string;
}

/**
 * ⋯ 버튼과 그 메뉴. 데스크톱에서는 버튼 아래 팝오버, 모바일에서는 화면 아래 시트로 열린다.
 * 폴더 항목과 링크 카드가 함께 쓴다. 클릭 이벤트는 바깥으로 전파하지 않는다.
 */
export default function ActionMenu({
  subject,
  items,
  onOpenChange,
  buttonClassName = "",
}: ActionMenuProps) {
  const [open, setOpen] = useState(false);

  const setOpenAndNotify = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        onOpenChange?.(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, onOpenChange]);

  const pick = (action: () => void) => {
    setOpenAndNotify(false);
    action();
  };

  return (
    <span className="relative inline-flex">
      <button
        type="button"
        aria-label={`${subject} 메뉴`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setOpenAndNotify(!open);
        }}
        className={`icon-btn flex h-7 w-7 shrink-0 items-center justify-center text-[18px] leading-none ${buttonClassName}`}
      >
        ⋯
      </button>

      {open && (
        <>
          {/* 바깥 클릭을 받는 배경 (모바일에서는 살짝 어둡게) */}
          <div
            className="fixed inset-0 z-20 bg-[var(--overlay)] md:bg-transparent"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setOpenAndNotify(false);
            }}
          />
          <div
            role="menu"
            aria-label={`${subject} 메뉴`}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
            }}
            className="menu-panel fixed inset-x-0 bottom-0 z-30 rounded-t-[var(--radius-card)] p-2 pb-[max(8px,env(safe-area-inset-bottom))] md:absolute md:inset-x-auto md:right-0 md:top-full md:bottom-auto md:mt-1 md:w-40 md:rounded-[var(--radius-button)] md:p-1.5"
          >
            <p className="truncate px-3 py-2 text-[var(--text-caption)] font-semibold text-[var(--text-sub)] md:hidden">
              {subject}
            </p>
            {items.map((item) => (
              <button
                key={item.label}
                type="button"
                role="menuitem"
                onClick={() => pick(item.onSelect)}
                className={`menu-item block w-full px-3 py-3 text-left text-[15px] md:py-2 md:text-[14px] ${
                  item.danger ? "menu-item-danger" : ""
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        </>
      )}
    </span>
  );
}
