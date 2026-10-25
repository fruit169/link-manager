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

/** next.config.ts의 images.remotePatterns에 등록된 호스트만 이미지 최적화를 거친다. */
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
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-blue-50 to-blue-100">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-blue-500 text-2xl font-bold text-white">
        {initial}
      </div>
      <span className="text-xs text-blue-700">{hostnameOf(url)}</span>
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
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition hover:-translate-y-0.5 hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-500"
    >
      <div className="relative aspect-[2/1] w-full bg-gray-100">
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

      <div className="flex flex-1 flex-col gap-2 p-4">
        <span className="w-fit rounded border border-gray-200 bg-gray-50 px-2 py-0.5 text-xs text-gray-600">
          {folderName}
        </span>
        <h2 className="line-clamp-1 font-semibold text-gray-900 group-hover:text-blue-600">
          {link.title}
        </h2>
        <p className="line-clamp-2 text-sm leading-relaxed text-gray-500">
          {link.description}
        </p>
        <span className="mt-auto truncate pt-1 text-sm text-blue-500">
          {link.url}
        </span>
      </div>
    </a>
  );
}
