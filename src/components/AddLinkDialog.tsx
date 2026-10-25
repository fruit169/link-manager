"use client";

import { useRef, useState, type FormEvent } from "react";
import Dialog from "@/components/Dialog";
import { fetchOpenGraph } from "@/lib/og-client";
import type { OpenGraphData } from "@/lib/og/types";
import { UNCATEGORIZED_FOLDER_ID, type Folder, type FolderId, type Link, type LinkInput } from "@/lib/types";
import { findDuplicateUrl } from "@/lib/vault";

interface AddLinkDialogProps {
  folders: Folder[];
  /** 모든 링크. 중복 URL 확인에 쓴다. */
  links: Link[];
  defaultFolderId: FolderId;
  onClose: () => void;
  onSave: (input: LinkInput) => void;
}

type FetchStatus = "idle" | "loading" | "failed";

interface Notice {
  tone: "info" | "error" | "warn";
  text: string;
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * 새 링크 추가 폼.
 * '확인'을 누르면 서버 API로 제목·설명·썸네일을 모아 저장한다.
 * 조회가 실패하거나 제목이 없으면 입력을 유지한 채 수동 입력 항목을 보여주고,
 * 제목을 넣고 다시 '확인'하면 재조회 없이 수동 저장한다.
 * 직접 입력한 값은 자동 수집 값보다 우선한다.
 */
export default function AddLinkDialog({
  folders,
  links,
  defaultFolderId,
  onClose,
  onSave,
}: AddLinkDialogProps) {
  const [url, setUrl] = useState("");
  const [folderId, setFolderId] = useState<FolderId>(defaultFolderId);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");

  const [showDetails, setShowDetails] = useState(false);
  const [status, setStatus] = useState<FetchStatus>("idle");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [titleError, setTitleError] = useState<string | null>(null);
  /** 이 URL로 이미 (성공이든 실패든) 조회했는지. 같은 URL은 다시 조회하지 않는다. */
  const [attemptedUrl, setAttemptedUrl] = useState<string | null>(null);
  /** 중복 URL 안내를 보고도 저장하기로 한 URL */
  const [duplicateAccepted, setDuplicateAccepted] = useState<string | null>(null);
  /** 연속 클릭 방지: 상태 갱신보다 먼저 막는다 */
  const busyRef = useRef(false);

  const busy = status === "loading";

  const runFetch = async (targetUrl: string): Promise<OpenGraphData | null> => {
    setStatus("loading");
    setNotice({ tone: "info", text: "링크 정보를 가져오는 중…" });
    const result = await fetchOpenGraph(targetUrl);
    setAttemptedUrl(targetUrl);
    if (!result.ok) {
      setStatus("failed");
      setShowDetails(true);
      setNotice({
        tone: "error",
        text: `${result.message} 제목을 직접 입력한 뒤 다시 '확인'을 누르면 저장됩니다.`,
      });
      return null;
    }
    setStatus("idle");
    setNotice(null);
    return result.data;
  };

  const save = (merged: {
    title: string;
    description: string;
    imageUrl: string;
    ogUrl: string;
    finalUrl: string;
  }) => {
    onSave({
      url: url.trim(),
      folderId: folders.some((f) => f.id === folderId) ? folderId : UNCATEGORIZED_FOLDER_ID,
      title: merged.title.trim(),
      description: merged.description.trim(),
      imageUrl: merged.imageUrl.trim() || undefined,
      ogUrl: merged.ogUrl || undefined,
      finalUrl: merged.finalUrl || undefined,
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busyRef.current) return;

    const trimmedUrl = url.trim();
    if (!trimmedUrl) {
      setUrlError("URL을 입력해 주세요.");
      return;
    }
    if (!isHttpUrl(trimmedUrl)) {
      setUrlError("http:// 또는 https://로 시작하는 주소여야 합니다.");
      return;
    }
    const trimmedImage = imageUrl.trim();
    if (trimmedImage && !isHttpUrl(trimmedImage)) {
      setShowDetails(true);
      setNotice({ tone: "error", text: "썸네일 주소 형식이 올바르지 않습니다." });
      return;
    }

    // 같은 주소가 이미 있으면 한 번 확인받는다
    const duplicate = findDuplicateUrl(links, trimmedUrl);
    if (duplicate && duplicateAccepted !== trimmedUrl) {
      setNotice({
        tone: "warn",
        text: `같은 주소의 링크 '${duplicate.title}'이(가) 이미 있습니다. 그래도 저장하려면 '확인'을 한 번 더 누르세요.`,
      });
      setDuplicateAccepted(trimmedUrl);
      return;
    }

    // 아직 조회하지 않은 주소면 서버에서 정보를 모은다 (실패한 주소는 다시 조회하지 않는다)
    if (attemptedUrl !== trimmedUrl) {
      busyRef.current = true;
      try {
        const data = await runFetch(trimmedUrl);
        if (!data) return;
        // 직접 입력한 값이 우선, 없으면 수집값. 방금 받은 메타데이터는 data에서 직접 넘긴다.
        const merged = {
          title: title.trim() || data.title,
          description: description.trim() || data.description,
          imageUrl: imageUrl.trim() || data.image,
          ogUrl: data.ogUrl,
          finalUrl: data.finalUrl !== data.url ? data.finalUrl : "",
        };
        if (!merged.title) {
          setShowDetails(true);
          setDescription((prev) => prev.trim() || data.description);
          setImageUrl((prev) => prev.trim() || data.image);
          setTitleError("페이지에서 제목을 찾지 못했습니다. 제목을 입력한 뒤 다시 '확인'을 누르세요.");
          return;
        }
        save(merged);
      } finally {
        busyRef.current = false;
      }
      return;
    }

    // 조회 없이 수동 저장
    if (!title.trim()) {
      setShowDetails(true);
      setTitleError("제목을 입력해 주세요.");
      return;
    }
    save({ title, description, imageUrl, ogUrl: "", finalUrl: "" });
  };

  const handleRetry = async () => {
    if (busyRef.current) return;
    const trimmedUrl = url.trim();
    if (!isHttpUrl(trimmedUrl)) {
      setUrlError("http:// 또는 https://로 시작하는 주소여야 합니다.");
      return;
    }
    busyRef.current = true;
    try {
      const data = await runFetch(trimmedUrl);
      if (data) {
        setTitle((prev) => prev.trim() || data.title);
        setDescription((prev) => prev.trim() || data.description);
        setImageUrl((prev) => prev.trim() || data.image);
      }
    } finally {
      busyRef.current = false;
    }
  };

  const inputClass = (hasError: boolean) =>
    `input-field w-full px-4 py-3 text-[16px] disabled:opacity-60 ${hasError ? "input-field-error" : ""}`;
  const labelClass =
    "mb-1.5 block text-[var(--text-sub-size)] font-semibold text-[var(--text)]";
  const errorClass = "mt-1.5 text-[var(--text-caption)] text-[var(--error)]";
  const noticeClass =
    notice?.tone === "error"
      ? "notice notice-error"
      : notice?.tone === "warn"
        ? "notice notice-warn"
        : "notice notice-info";

  return (
    <Dialog titleId="add-link-title" onClose={onClose}>
      <h2
        id="add-link-title"
        className="text-[var(--text-h2)] font-bold leading-[1.4] text-[var(--text)]"
      >
        새 링크 추가
      </h2>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4" aria-busy={busy}>
        <div>
          <label htmlFor="link-url" className={labelClass}>
            URL <span className="text-[var(--error)]">*</span>
          </label>
          <input
            id="link-url"
            type="url"
            autoFocus
            value={url}
            disabled={busy}
            onChange={(e) => {
              setUrl(e.target.value);
              setUrlError(null);
            }}
            placeholder="https://example.com"
            className={inputClass(Boolean(urlError))}
            aria-invalid={Boolean(urlError)}
          />
          {urlError && <p className={errorClass}>{urlError}</p>}
        </div>

        <div>
          <label htmlFor="link-folder" className={labelClass}>
            폴더
          </label>
          <select
            id="link-folder"
            value={folderId}
            disabled={busy}
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

        {notice && (
          <p
            role={notice.tone === "info" ? "status" : "alert"}
            className={`${noticeClass} px-4 py-3 text-[var(--text-sub-size)] leading-[1.5]`}
          >
            {notice.text}
          </p>
        )}

        {!showDetails ? (
          <button
            type="button"
            onClick={() => setShowDetails(true)}
            className="link-inline text-[var(--text-sub-size)] font-semibold text-[var(--accent)]"
          >
            제목·설명·썸네일 직접 입력
          </button>
        ) : (
          <div className="space-y-4 rounded-[var(--radius-button)] bg-[var(--bg)] p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="text-[var(--text-caption)] font-semibold text-[var(--text-sub)]">
                직접 입력한 값이 자동 수집 값보다 우선합니다
              </span>
              {status === "failed" && (
                <button
                  type="button"
                  onClick={handleRetry}
                  disabled={busy}
                  className="btn-secondary shrink-0 px-3 py-1.5 text-[13px] disabled:opacity-50"
                >
                  다시 가져오기
                </button>
              )}
            </div>
            <div>
              <label htmlFor="link-title" className={labelClass}>
                제목
              </label>
              <input
                id="link-title"
                type="text"
                value={title}
                disabled={busy}
                onChange={(e) => {
                  setTitle(e.target.value);
                  if (titleError) setTitleError(null);
                }}
                placeholder="비워 두면 페이지 제목을 사용합니다"
                className={`${inputClass(Boolean(titleError))} bg-[var(--card-bg)]`}
                aria-invalid={Boolean(titleError)}
              />
              {titleError && <p className={errorClass}>{titleError}</p>}
            </div>
            <div>
              <label htmlFor="link-description" className={labelClass}>
                설명
              </label>
              <textarea
                id="link-description"
                value={description}
                disabled={busy}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="비워 두면 페이지 설명을 사용합니다"
                rows={2}
                className={`${inputClass(false)} resize-none bg-[var(--card-bg)]`}
              />
            </div>
            <div>
              <label htmlFor="link-image" className={labelClass}>
                썸네일 URL
              </label>
              <input
                id="link-image"
                type="url"
                value={imageUrl}
                disabled={busy}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="비워 두면 페이지 대표 이미지를 사용합니다"
                className={`${inputClass(false)} bg-[var(--card-bg)]`}
              />
            </div>
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="btn-secondary px-5 py-2.5 text-[15px] disabled:opacity-50"
          >
            취소
          </button>
          <button
            type="submit"
            disabled={busy}
            className="btn-primary px-5 py-2.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {busy ? "링크 정보를 가져오는 중…" : "확인"}
          </button>
        </div>
      </form>
    </Dialog>
  );
}
