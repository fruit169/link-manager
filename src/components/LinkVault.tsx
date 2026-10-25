"use client";

import { useCallback, useMemo, useState } from "react";
import AddLinkModal, { type NewLinkInput } from "@/components/AddLinkModal";
import FolderSidebar from "@/components/FolderSidebar";
import Header from "@/components/Header";
import LinkGrid from "@/components/LinkGrid";
import type { Folder, FolderFilter, Link } from "@/lib/types";

interface LinkVaultProps {
  appName: string;
  folders: Folder[];
  initialLinks: Link[];
}

export default function LinkVault({
  appName,
  folders,
  initialLinks,
}: LinkVaultProps) {
  const [links, setLinks] = useState<Link[]>(initialLinks);
  const [selected, setSelected] = useState<FolderFilter>("all");
  const [isAddOpen, setIsAddOpen] = useState(false);

  const counts = useMemo(() => {
    const base = { all: links.length } as Record<FolderFilter, number>;
    for (const folder of folders) base[folder.id] = 0;
    for (const link of links) base[link.folderId] = (base[link.folderId] ?? 0) + 1;
    return base;
  }, [folders, links]);

  const visible =
    selected === "all" ? links : links.filter((l) => l.folderId === selected);

  const closeAdd = useCallback(() => setIsAddOpen(false), []);

  const handleAdd = (input: NewLinkInput) => {
    const newLink: Link = { id: crypto.randomUUID(), ...input };
    setLinks((prev) => [newLink, ...prev]);
    // 현재 필터에 가려지는 폴더면 새 링크가 보이도록 전환
    if (selected !== "all" && selected !== newLink.folderId) {
      setSelected(newLink.folderId);
    }
    setIsAddOpen(false);
  };

  // 모달의 폴더 기본값: 현재 보고 있는 폴더, '전체'면 첫 폴더
  const defaultFolderId = selected === "all" ? folders[0].id : selected;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <Header appName={appName} onNewLink={() => setIsAddOpen(true)} />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-[var(--space-page-x)] py-4 md:flex-row md:gap-[var(--space-section)] md:py-[var(--space-section)]">
        <FolderSidebar
          folders={folders}
          selected={selected}
          counts={counts}
          onSelect={setSelected}
        />
        <LinkGrid links={visible} folders={folders} />
      </main>
      <AddLinkModal
        open={isAddOpen}
        folders={folders}
        defaultFolderId={defaultFolderId}
        onClose={closeAdd}
        onAdd={handleAdd}
      />
    </div>
  );
}
