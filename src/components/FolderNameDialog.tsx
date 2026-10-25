"use client";

import { useRef, useState, type FormEvent } from "react";
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
  // 중복 제출 방지: ref 는 같은 틱의 연속 클릭을, state 는 버튼 비활성화를 맡는다
  const busyRef = useRef(false);
  const [busy, setBusy] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    const result = onSubmit(name);
    if (result) {
      // 실패하면 다시 시도할 수 있게 푼다. 성공하면 부모가 다이얼로그를 닫는다.
      setError(result);
      busyRef.current = false;
      setBusy(false);
    }
  };

  return (
    <Dialog titleId="folder-name-title" onClose={onClose}>
      <h2
        id="folder-name-title"
        className="text-[var(--text-h2)] font-bold leading-[1.4] text-[var(--text)]"
      >
        {title}
      </h2>
      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4" aria-busy={busy}>
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
          <button
            type="submit"
            disabled={busy}
            className="btn-primary px-5 py-2.5 text-[15px] disabled:opacity-50"
          >
            {submitLabel}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
