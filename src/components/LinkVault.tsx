"use client";

import { useMemo, useState } from "react";
import FolderSidebar from "@/components/FolderSidebar";
import Header from "@/components/Header";
import LinkGrid from "@/components/LinkGrid";
import type { Folder, FolderFilter, Link } from "@/lib/types";

interface LinkVaultProps {
  appName: string;
  folders: Folder[];
  links: Link[];
}

export default function LinkVault({ appName, folders, links }: LinkVaultProps) {
  const [selected, setSelected] = useState<FolderFilter>("all");

  const counts = useMemo(() => {
    const base = { all: links.length } as Record<FolderFilter, number>;
    for (const folder of folders) base[folder.id] = 0;
    for (const link of links) base[link.folderId] = (base[link.folderId] ?? 0) + 1;
    return base;
  }, [folders, links]);

  const visible =
    selected === "all" ? links : links.filter((l) => l.folderId === selected);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <Header appName={appName} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-4 py-4 sm:px-6 md:flex-row md:gap-6 md:py-6">
        <FolderSidebar
          folders={folders}
          selected={selected}
          counts={counts}
          onSelect={setSelected}
        />
        <LinkGrid links={visible} folders={folders} />
      </main>
    </div>
  );
}
