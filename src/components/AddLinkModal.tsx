"use client";

import { useEffect, useState, type FormEvent } from "react";
import type { Folder, FolderId, Link } from "@/lib/types";

/** 모달에서 입력받는 값. id는 상위에서 부여한다. */
export type NewLinkInput = Omit<Link, "id">;

interface AddLinkModalProps {
  open: boolean;
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
 * 열림/닫힘만 담당한다. 닫히면 폼을 언마운트하므로
 * 다음에 열릴 때 입력값이 자연스럽게 초기화된다.
 */
export default function AddLinkModal({ open, ...formProps }: AddLinkModalProps) {
  if (!open) return null;
  return <AddLinkDialog {...formProps} />;
}

type AddLinkDialogProps = Omit<AddLinkModalProps, "open">;

function AddLinkDialog({
  folders,
  defaultFolderId,
  onClose,
  onAdd,
}: AddLinkDialogProps) {
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [folderId, setFolderId] = useState<FolderId>(defaultFolderId);
  const [errors, setErrors] = useState<FieldErrors>({});

  // ESC로 닫기
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

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

  const inputClass =
    "w-full rounded-md border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-100";
  const labelClass = "mb-1 block text-sm font-medium text-gray-700";
  const errorClass = "mt-1 text-xs text-red-600";

  return (
    <div
      className="fixed inset-0 z-20 flex items-end justify-center bg-gray-900/40 p-0 sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-link-title"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-xl sm:rounded-2xl sm:p-6"
      >
        <h2 id="add-link-title" className="text-lg font-bold text-gray-900">
          새 링크 추가
        </h2>

        <form onSubmit={handleSubmit} noValidate className="mt-4 space-y-4">
          <div>
            <label htmlFor="link-url" className={labelClass}>
              URL <span className="text-red-500">*</span>
            </label>
            <input
              id="link-url"
              type="url"
              autoFocus
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className={inputClass}
              aria-invalid={Boolean(errors.url)}
            />
            {errors.url && <p className={errorClass}>{errors.url}</p>}
          </div>

          <div>
            <label htmlFor="link-title" className={labelClass}>
              제목 <span className="text-red-500">*</span>
            </label>
            <input
              id="link-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="링크 제목"
              className={inputClass}
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
              className={`${inputClass} resize-none`}
            />
          </div>

          <div>
            <label htmlFor="link-folder" className={labelClass}>
              폴더
            </label>
            <select
              id="link-folder"
              value={folderId}
              onChange={(e) => setFolderId(e.target.value as FolderId)}
              className={`${inputClass} bg-white`}
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
              className={inputClass}
              aria-invalid={Boolean(errors.imageUrl)}
            />
            {errors.imageUrl && <p className={errorClass}>{errors.imageUrl}</p>}
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
            >
              취소
            </button>
            <button
              type="submit"
              className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-600"
            >
              추가
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
