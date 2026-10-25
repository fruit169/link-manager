"use client";

import { useState, type FormEvent } from "react";
import Dialog from "@/components/Dialog";
import type { Folder, FolderId, Link, LinkInput } from "@/lib/types";

interface EditLinkDialogProps {
  link: Link;
  folders: Folder[];
  onClose: () => void;
  onSave: (input: LinkInput) => void;
}

/**
 * 링크 수정 모달. 폴더·제목·설명만 바꾼다.
 * URL, 썸네일, 수집 메타데이터는 기존 값을 그대로 유지한다.
 */
export default function EditLinkDialog({ link, folders, onClose, onSave }: EditLinkDialogProps) {
  const [folderId, setFolderId] = useState<FolderId>(link.folderId);
  const [title, setTitle] = useState(link.title);
  const [description, setDescription] = useState(link.description);
  const [titleError, setTitleError] = useState<string | null>(null);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setTitleError("제목을 입력해 주세요.");
      return;
    }
    onSave({
      url: link.url,
      imageUrl: link.imageUrl,
      ogUrl: link.ogUrl,
      finalUrl: link.finalUrl,
      folderId,
      title: title.trim(),
      description: description.trim(),
    });
  };

  const inputClass = (hasError: boolean) =>
    `input-field w-full px-4 py-3 text-[16px] ${hasError ? "input-field-error" : ""}`;
  const labelClass =
    "mb-1.5 block text-[var(--text-sub-size)] font-semibold text-[var(--text)]";

  return (
    <Dialog titleId="edit-link-title" onClose={onClose}>
      <h2
        id="edit-link-title"
        className="text-[var(--text-h2)] font-bold leading-[1.4] text-[var(--text)]"
      >
        링크 수정
      </h2>
      <p className="mt-2 truncate text-[var(--text-sub-size)] text-[var(--text-sub)]" title={link.url}>
        {link.url}
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <div>
          <label htmlFor="edit-folder" className={labelClass}>
            폴더
          </label>
          <select
            id="edit-folder"
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className={inputClass(false)}
          >
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="edit-title" className={labelClass}>
            제목 <span className="text-[var(--error)]">*</span>
          </label>
          <input
            id="edit-title"
            type="text"
            autoFocus
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (titleError) setTitleError(null);
            }}
            placeholder="링크 제목"
            className={inputClass(Boolean(titleError))}
            aria-invalid={Boolean(titleError)}
          />
          {titleError && (
            <p className="mt-1.5 text-[var(--text-caption)] text-[var(--error)]">{titleError}</p>
          )}
        </div>

        <div>
          <label htmlFor="edit-description" className={labelClass}>
            설명
          </label>
          <textarea
            id="edit-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이 링크가 무엇인지 간단히 적어 주세요"
            rows={3}
            className={`${inputClass(false)} resize-none`}
          />
        </div>

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5 text-[15px]">
            취소
          </button>
          <button type="submit" className="btn-primary px-5 py-2.5 text-[15px]">
            저장
          </button>
        </div>
      </form>
    </Dialog>
  );
}
