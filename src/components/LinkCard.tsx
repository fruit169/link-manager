"use client";

import Image from "next/image";
import { useState } from "react";
import ActionMenu from "@/components/ActionMenu";
import type { Link } from "@/lib/types";

interface LinkCardProps {
  link: Link;
  folderName: string;
  onEdit: () => void;
  onMove: () => void;
  onDelete: () => void;
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

/**
 * next.config.ts의 images.remotePatterns에 등록된 호스트만 이미지 최적화를 거친다.
 * 프로젝트 내부 파일(/thumbs/...)과 그 외 외부 주소는 원본 그대로 표시한다.
 */
const OPTIMIZED_IMAGE_HOSTS = ["picsum.photos"];

function isOptimizedHost(url: string): boolean {
  try {
    return OPTIMIZED_IMAGE_HOSTS.includes(new URL(url).hostname);
  } catch {
    return false;
  }
}

function ImageFallback({ title, url }: { title: string; url: string }) {
  const initial = title.trim().charAt(0).toUpperCase() || "?";
  return (
    <div
      role="img"
      aria-label={`${title} 미리보기 없음`}
      className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--accent-soft)]"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-2xl font-bold text-white">
        {initial}
      </div>
      <span className="text-[var(--text-caption)] text-[var(--accent)]">
        {hostnameOf(url)}
      </span>
    </div>
  );
}

function PencilIcon() {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
    </svg>
  );
}

export default function LinkCard({ link, folderName, onEdit, onMove, onDelete }: LinkCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const imageUrl = link.imageUrl;
  const showImage = imageUrl !== undefined && !imageFailed;
  const linkProps = { href: link.url, target: "_blank", rel: "noopener noreferrer" } as const;

  return (
    <article
      className={`card card-hover group relative flex flex-col ${menuOpen ? "z-20" : ""}`}
      aria-label={link.title}
    >
      {/* 썸네일: 일정한 비율, cover 배치. 누르면 새 탭 */}
      <a
        {...linkProps}
        tabIndex={-1}
        aria-hidden="true"
        className="relative block aspect-[2/1] w-full overflow-hidden rounded-t-[var(--radius-card)] bg-[var(--bg)]"
      >
        {showImage ? (
          <Image
            src={imageUrl}
            alt={`${link.title} 미리보기`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
            unoptimized={!isOptimizedHost(imageUrl)}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <ImageFallback title={link.title} url={link.url} />
        )}
      </a>

      {/* 수정 버튼: 카드에 마우스를 올리면 우측 상단에 연필 아이콘으로 나타난다 */}
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          onEdit();
        }}
        aria-label={`${link.title} 수정`}
        title="수정"
        className="card-edit-btn absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full"
      >
        <PencilIcon />
      </button>

      <div className="flex flex-1 flex-col gap-[var(--space-element)] p-5">
        <div className="flex items-center justify-between gap-2">
          <span className="badge min-w-0 truncate px-2.5 py-1 leading-none">{folderName}</span>
          <ActionMenu
            subject={link.title}
            onOpenChange={setMenuOpen}
            items={[
              { label: "폴더 이동", onSelect: onMove },
              { label: "삭제", onSelect: onDelete, danger: true },
            ]}
          />
        </div>
        <h2 className="line-clamp-2 break-words text-[var(--text-body)] font-bold leading-[1.4] text-[var(--text)]">
          <a {...linkProps} className="link-title">
            {link.title}
          </a>
        </h2>
        {link.description && (
          <p className="line-clamp-2 break-words text-[var(--text-sub-size)] leading-[1.5] text-[var(--text-sub)]">
            {link.description}
          </p>
        )}
        <a
          {...linkProps}
          className="link-url mt-auto block truncate pt-1 text-[var(--text-sub-size)] text-[var(--accent)]"
          title={link.url}
        >
          {link.url}
        </a>
      </div>
    </article>
  );
}
