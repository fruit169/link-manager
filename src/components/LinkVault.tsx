"use client";

import { useCallback, useMemo, useState } from "react";
import AddLinkModal from "@/components/AddLinkModal";
import ConfirmDialog from "@/components/ConfirmDialog";
import FolderNameDialog from "@/components/FolderNameDialog";
import FolderSidebar from "@/components/FolderSidebar";
import Header from "@/components/Header";
import LinkGrid from "@/components/LinkGrid";
import {
  ALL_FILTER,
  UNCATEGORIZED_FOLDER_NAME,
  type FolderFilter,
  type FolderId,
} from "@/lib/types";
import { countByFolder, linksInFilter, type NewLinkInput, type VaultState } from "@/lib/vault";
import { useVault } from "@/lib/vault-store";

interface LinkVaultProps {
  appName: string;
}

type DialogState =
  | { kind: "none" }
  | { kind: "add-link" }
  | { kind: "add-folder" }
  | { kind: "rename-folder"; id: FolderId }
  | { kind: "delete-folder"; id: FolderId };

export default function LinkVault({ appName }: LinkVaultProps) {
  const vault = useVault();
  const { folders, links, addLink, addFolder, renameFolder, deleteFolder } = vault;

  const [selected, setSelected] = useState<FolderFilter>(ALL_FILTER);
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const closeDialog = useCallback(() => setDialog({ kind: "none" }), []);

  const state = useMemo<VaultState>(() => ({ folders, links }), [folders, links]);
  const counts = useMemo(() => countByFolder(state), [state]);

  // 선택한 폴더가 (다른 탭 등에서) 사라졌으면 '전체'로 되돌린다
  const effectiveSelected =
    selected === ALL_FILTER || folders.some((f) => f.id === selected)
      ? selected
      : ALL_FILTER;
  const visible = linksInFilter(state, effectiveSelected);
  const selectedFolderName =
    effectiveSelected === ALL_FILTER
      ? null
      : (folders.find((f) => f.id === effectiveSelected)?.name ?? null);

  const handleAddLink = (input: NewLinkInput) => {
    addLink(input);
    // 현재 필터에 가려지는 폴더면 새 링크가 보이도록 전환
    if (effectiveSelected !== ALL_FILTER && effectiveSelected !== input.folderId) {
      setSelected(input.folderId);
    }
    closeDialog();
  };

  const handleAddFolder = (name: string): string | null => {
    const result = addFolder(name);
    if (!result.ok) return result.error;
    setSelected(result.value.id);
    closeDialog();
    return null;
  };

  const handleRenameFolder = (id: FolderId, name: string): string | null => {
    const result = renameFolder(id, name);
    if (!result.ok) return result.error;
    closeDialog();
    return null;
  };

  const handleDeleteFolder = (id: FolderId) => {
    const result = deleteFolder(id);
    if (result.ok && effectiveSelected === id) setSelected(ALL_FILTER);
    closeDialog();
  };

  // 새 링크 모달의 폴더 기본값: 현재 보고 있는 폴더, '전체'면 첫 폴더
  const defaultFolderId =
    effectiveSelected === ALL_FILTER ? folders[0]?.id ?? "" : effectiveSelected;

  const folderForDialog =
    dialog.kind === "rename-folder" || dialog.kind === "delete-folder"
      ? folders.find((f) => f.id === dialog.id)
      : undefined;

  return (
    <div className="flex min-h-screen flex-col bg-[var(--bg)]">
      <Header
        appName={appName}
        onNewFolder={() => setDialog({ kind: "add-folder" })}
        onNewLink={() => setDialog({ kind: "add-link" })}
      />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-4 px-[var(--space-page-x)] py-4 md:flex-row md:gap-[var(--space-section)] md:py-[var(--space-section)]">
        <FolderSidebar
          folders={folders}
          selected={effectiveSelected}
          counts={counts}
          onSelect={setSelected}
          onRenameFolder={(id) => setDialog({ kind: "rename-folder", id })}
          onDeleteFolder={(id) => setDialog({ kind: "delete-folder", id })}
        />
        <LinkGrid links={visible} folders={folders} folderName={selectedFolderName} />
      </main>

      {dialog.kind === "add-link" && (
        <AddLinkModal
          folders={folders}
          defaultFolderId={defaultFolderId}
          onClose={closeDialog}
          onAdd={handleAddLink}
        />
      )}
      {dialog.kind === "add-folder" && (
        <FolderNameDialog
          title="새 폴더"
          submitLabel="추가"
          onClose={closeDialog}
          onSubmit={handleAddFolder}
        />
      )}
      {dialog.kind === "rename-folder" && folderForDialog && (
        <FolderNameDialog
          title="폴더 이름 변경"
          submitLabel="저장"
          initialName={folderForDialog.name}
          onClose={closeDialog}
          onSubmit={(name) => handleRenameFolder(folderForDialog.id, name)}
        />
      )}
      {dialog.kind === "delete-folder" && folderForDialog && (
        <ConfirmDialog
          title="폴더 삭제"
          message={
            (counts[folderForDialog.id] ?? 0) > 0
              ? `'${folderForDialog.name}' 폴더를 삭제할까요? 안에 있는 링크 ${counts[folderForDialog.id]}개는 '${UNCATEGORIZED_FOLDER_NAME}'로 이동합니다.`
              : `'${folderForDialog.name}' 폴더를 삭제할까요?`
          }
          confirmLabel="삭제"
          onClose={closeDialog}
          onConfirm={() => handleDeleteFolder(folderForDialog.id)}
        />
      )}
    </div>
  );
}
