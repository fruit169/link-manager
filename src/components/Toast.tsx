"use client";

import { useEffect } from "react";

export type ToastTone = "error" | "info";

interface ToastProps {
  tone: ToastTone;
  message: string;
  onClose: () => void;
  /** 자동으로 사라지기까지의 시간(ms). 0이면 닫기 전까지 유지한다. */
  duration?: number;
}

/**
 * 화면 상단 가운데에 잠시 떠 있는 알림.
 * 기존 인라인 알림(notice-*)과 같은 색을 쓰고, 일정 시간이 지나거나 ×를 누르면 사라진다.
 */
export default function Toast({ tone, message, onClose, duration = 4000 }: ToastProps) {
  useEffect(() => {
    if (duration <= 0) return;
    const timer = window.setTimeout(onClose, duration);
    return () => window.clearTimeout(timer);
  }, [duration, message, onClose]);

  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      aria-live={tone === "error" ? "assertive" : "polite"}
      className={`notice notice-${tone} fixed inset-x-0 top-4 z-50 mx-auto flex w-[calc(100%-2*var(--space-page-x))] max-w-sm items-start justify-between gap-3 px-4 py-3 text-[var(--text-sub-size)] leading-[1.5] shadow-[var(--shadow-modal)]`}
    >
      <span>{message}</span>
      <button type="button" onClick={onClose} aria-label="알림 닫기" className="shrink-0 font-bold">
        ×
      </button>
    </div>
  );
}
