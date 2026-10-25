"use client";

import Image from "next/image";
import { useState } from "react";
import type { Link } from "@/lib/types";

interface LinkCardProps {
  link: Link;
  folderName: string;
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
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--accent-soft)]">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent)] text-2xl font-bold text-white">
        {initial}
      </div>
      <span className="text-[var(--text-caption)] text-[var(--accent)]">
        {hostnameOf(url)}
      </span>
    </div>
  );
}

export default function LinkCard({ link, folderName }: LinkCardProps) {
  const [imageFailed, setImageFailed] = useState(false);
  const imageUrl = link.imageUrl;
  const showImage = imageUrl !== undefined && !imageFailed;

  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener noreferrer"
      className="card card-hover group flex flex-col overflow-hidden"
    >
      <div className="relative aspect-[2/1] w-full bg-[var(--bg)]">
        {showImage ? (
          <Image
            src={imageUrl}
            alt=""
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover"
            unoptimized={!isOptimizedHost(imageUrl)}
            onError={() => setImageFailed(true)}
          />
        ) : (
          <ImageFallback title={link.title} url={link.url} />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-[var(--space-element)] p-5">
        <span className="badge w-fit px-2.5 py-1 leading-none">{folderName}</span>
        <h2 className="line-clamp-1 text-[var(--text-body)] font-bold leading-[1.4] text-[var(--text)]">
          {link.title}
        </h2>
        <p className="line-clamp-2 text-[var(--text-sub-size)] leading-[1.5] text-[var(--text-sub)]">
          {link.description}
        </p>
        <span className="mt-auto truncate pt-1 text-[var(--text-sub-size)] text-[var(--accent)]">
          {link.url}
        </span>
      </div>
    </a>
  );
}
