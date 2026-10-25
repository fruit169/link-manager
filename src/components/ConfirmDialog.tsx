"use client";

import Dialog from "@/components/Dialog";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmLabel: string;
  onClose: () => void;
  onConfirm: () => void;
}

/** 되돌리기 어려운 동작 전에 띄우는 확인창 */
export default function ConfirmDialog({
  title,
  message,
  confirmLabel,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <Dialog titleId="confirm-title" onClose={onClose}>
      <h2
        id="confirm-title"
        className="text-[var(--text-h2)] font-bold leading-[1.4] text-[var(--text)]"
      >
        {title}
      </h2>
      <p className="mt-3 text-[var(--text-sub-size)] leading-[1.6] text-[var(--text-sub)]">
        {message}
      </p>
      <div className="mt-6 flex justify-end gap-2">
        <button
          type="button"
          onClick={onClose}
          autoFocus
          className="btn-secondary px-5 py-2.5 text-[15px]"
        >
          취소
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className="btn-danger px-5 py-2.5 text-[15px]"
        >
          {confirmLabel}
        </button>
      </div>
    </Dialog>
  );
}
