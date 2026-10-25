"use client";

import { useEffect, type ReactNode } from "react";

interface DialogProps {
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}

/**
 * 모달 공통 껍데기: 반투명 배경, 배경 클릭·ESC로 닫기, 모바일에서는 바닥 시트.
 * 내용은 children으로 받는다. 열림 상태는 부모가 조건부 렌더링으로 관리한다.
 */
export default function Dialog({ titleId, onClose, children }: DialogProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-40 flex items-end justify-center bg-[var(--overlay)] p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onClick={(e) => e.stopPropagation()}
        className="modal-panel w-full max-w-md rounded-t-[var(--radius-card)] p-5 sm:rounded-[var(--radius-card)] sm:p-6"
      >
        {children}
      </div>
    </div>
  );
}
