"use client";

import { useState, type FormEvent } from "react";
import Dialog from "@/components/Dialog";

interface FolderNameDialogProps {
  title: string;
  submitLabel: string;
  initialName?: string;
  onClose: () => void;
  /** 저장 시도. 실패하면 화면에 보여줄 오류 메시지를 돌려준다. */
  onSubmit: (name: string) => string | null;
}

/** 폴더 추가와 이름 변경에 함께 쓰는 한 줄 입력 다이얼로그 */
export default function FolderNameDialog({
  title,
  submitLabel,
  initialName = "",
  onClose,
  onSubmit,
}: FolderNameDialogProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const result = onSubmit(name);
    if (result) setError(result);
  };

  return (
    <Dialog titleId="folder-name-title" onClose={onClose}>
      <h2
        id="folder-name-title"
        className="text-[var(--text-h2)] font-bold leading-[1.4] text-[var(--text)]"
      >
        {title}
      </h2>
      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="folder-name"
            className="mb-1.5 block text-[var(--text-sub-size)] font-semibold text-[var(--text)]"
          >
            폴더 이름
          </label>
          <input
            id="folder-name"
            type="text"
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              if (error) setError(null);
            }}
            placeholder="예: 강의 자료"
            maxLength={30}
            className={`input-field w-full px-4 py-3 text-[16px] ${error ? "input-field-error" : ""}`}
            aria-invalid={Boolean(error)}
          />
          {error && (
            <p className="mt-1.5 text-[var(--text-caption)] text-[var(--error)]">{error}</p>
          )}
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="btn-secondary px-5 py-2.5 text-[15px]"
          >
            취소
          </button>
          <button type="submit" className="btn-primary px-5 py-2.5 text-[15px]">
            {submitLabel}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
