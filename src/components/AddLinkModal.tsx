"use client";

import { useState, type FormEvent } from "react";
import Dialog from "@/components/Dialog";
import type { Folder, FolderId } from "@/lib/types";
import type { NewLinkInput } from "@/lib/vault";

interface AddLinkModalProps {
  folders: Folder[];
  defaultFolderId: FolderId;
  onClose: () => void;
  onAdd: (input: NewLinkInput) => void;
}

type FieldErrors = Partial<Record<"url" | "title" | "imageUrl", string>>;

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * 새 링크 입력 모달. 부모가 조건부 렌더링으로 열고 닫으므로
 * 닫힐 때 언마운트되어 다음에 열릴 때 입력값이 초기화된다.
 */
export default function AddLinkModal({
  folders,
  defaultFolderId,
  onClose,
  onAdd,
}: AddLinkModalProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [folderId, setFolderId] = useState<FolderId>(defaultFolderId);
  const [errors, setErrors] = useState<FieldErrors>({});

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    const nextErrors: FieldErrors = {};
    const trimmedUrl = url.trim();
    const trimmedTitle = title.trim();
    const trimmedImageUrl = imageUrl.trim();

    if (!trimmedUrl) nextErrors.url = "URL을 입력해 주세요.";
    else if (!isHttpUrl(trimmedUrl))
      nextErrors.url = "http:// 또는 https://로 시작하는 주소여야 합니다.";
    if (!trimmedTitle) nextErrors.title = "제목을 입력해 주세요.";
    if (trimmedImageUrl && !isHttpUrl(trimmedImageUrl))
      nextErrors.imageUrl = "이미지 주소 형식이 올바르지 않습니다.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    onAdd({
      url: trimmedUrl,
      title: trimmedTitle,
      description: description.trim(),
      folderId,
      imageUrl: trimmedImageUrl || undefined,
    });
  };

  const inputClass = (hasError: boolean) =>
    `input-field w-full px-4 py-3 text-[16px] ${hasError ? "input-field-error" : ""}`;
  const labelClass =
    "mb-1.5 block text-[var(--text-sub-size)] font-semibold text-[var(--text)]";
  const errorClass = "mt-1.5 text-[var(--text-caption)] text-[var(--error)]";

  return (
    <Dialog titleId="add-link-title" onClose={onClose}>
      <h2
        id="add-link-title"
        className="text-[var(--text-h2)] font-bold leading-[1.4] text-[var(--text)]"
      >
        새 링크 추가
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4">
        <div>
          <label htmlFor="link-url" className={labelClass}>
            URL <span className="text-[var(--error)]">*</span>
          </label>
          <input
            id="link-url"
            type="url"
            autoFocus
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            className={inputClass(Boolean(errors.url))}
            aria-invalid={Boolean(errors.url)}
          />
          {errors.url && <p className={errorClass}>{errors.url}</p>}
        </div>

        <div>
          <label htmlFor="link-title" className={labelClass}>
            제목 <span className="text-[var(--error)]">*</span>
          </label>
          <input
            id="link-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="링크 제목"
            className={inputClass(Boolean(errors.title))}
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title && <p className={errorClass}>{errors.title}</p>}
        </div>

        <div>
          <label htmlFor="link-description" className={labelClass}>
            설명
          </label>
          <textarea
            id="link-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="이 링크가 무엇인지 간단히 적어 주세요"
            rows={2}
            className={`${inputClass(false)} resize-none`}
          />
        </div>

        <div>
          <label htmlFor="link-folder" className={labelClass}>
            폴더
          </label>
          <select
            id="link-folder"
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
          <label htmlFor="link-image" className={labelClass}>
            이미지 URL
          </label>
          <input
            id="link-image"
            type="url"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            placeholder="비워 두면 대체 화면이 표시됩니다"
            className={inputClass(Boolean(errors.imageUrl))}
            aria-invalid={Boolean(errors.imageUrl)}
          />
          {errors.imageUrl && <p className={errorClass}>{errors.imageUrl}</p>}
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
            추가
          </button>
        </div>
      </form>
    </Dialog>
  );
}
