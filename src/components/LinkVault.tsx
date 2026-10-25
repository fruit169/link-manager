"use client";

import { useCallback, useMemo, useState } from "react";
import ConfirmDialog from "@/components/ConfirmDialog";
import FolderNameDialog from "@/components/FolderNameDialog";
import FolderSidebar from "@/components/FolderSidebar";
import Header from "@/components/Header";
import AddLinkDialog from "@/components/AddLinkDialog";
import EditLinkDialog from "@/components/EditLinkDialog";
import LinkGrid from "@/components/LinkGrid";
import MoveLinkDialog from "@/components/MoveLinkDialog";
import SearchBar from "@/components/SearchBar";
import {
  ALL_FILTER,
  ALL_FILTER_NAME,
  UNCATEGORIZED_FOLDER_ID,
  UNCATEGORIZED_FOLDER_NAME,
  type FolderFilter,
  type FolderId,
  type Link,
  type LinkInput,
} from "@/lib/types";
import { countByFolder, linksInFilter, searchLinks, type VaultState } from "@/lib/vault";
import { useVault } from "@/lib/vault-store";

interface LinkVaultProps {
  appName: string;
}

type DialogState =
  | { kind: "none" }
  | { kind: "add-link" }
  | { kind: "edit-link"; id: string }
  | { kind: "move-link"; id: string }
  | { kind: "delete-link"; id: string }
  | { kind: "add-folder" }
  | { kind: "rename-folder"; id: FolderId }
  | { kind: "delete-folder"; id: FolderId };

export default function LinkVault({ appName }: LinkVaultProps) {
  const vault = useVault();
  const {
    folders,
    links,
    addLink,
    updateLink,
    deleteLink,
    moveLink,
    addFolder,
    renameFolder,
    deleteFolder,
  } = vault;

  const [selected, setSelected] = useState<FolderFilter>(ALL_FILTER);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const closeDialog = useCallback(() => setDialog({ kind: "none" }), []);

  const state = useMemo<VaultState>(() => ({ folders, links }), [folders, links]);
  const counts = useMemo(() => countByFolder(state), [state]);

  // 선택한 폴더가 (다른 탭 등에서) 사라졌으면 '전체'로 되돌린다
  const effectiveSelected =
    selected === ALL_FILTER || folders.some((f) => f.id === selected)
      ? selected
      : ALL_FILTER;
  const selectedFolderName =
    effectiveSelected === ALL_FILTER
      ? null
      : (folders.find((f) => f.id === effectiveSelected)?.name ?? null);
  const visible = useMemo(
    () => searchLinks(linksInFilter(state, effectiveSelected), query),
    [state, effectiveSelected, query],
  );

  /* ------------------------------- 링크 동작 ------------------------------- */

  const handleAddLink = (input: LinkInput) => {
    addLink(input);
    // 현재 필터에 가려지는 폴더면 새 링크가 보이도록 전환
    if (effectiveSelected !== ALL_FILTER && effectiveSelected !== input.folderId) {
      setSelected(input.folderId);
    }
    closeDialog();
  };

  const handleUpdateLink = (id: string, input: LinkInput) => {
    updateLink(id, input);
    closeDialog();
  };

  const handleMoveLink = (id: string, folderId: FolderId) => {
    moveLink(id, folderId);
    closeDialog();
  };

  const handleDeleteLink = (id: string) => {
    deleteLink(id);
    closeDialog();
  };

  /* ------------------------------- 폴더 동작 ------------------------------- */

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

  /* -------------------------------- 다이얼로그 -------------------------------- */

  // 새 링크의 기본 폴더: 보고 있는 폴더, '전체'면 '미분류'
  const defaultFolderId =
    effectiveSelected === ALL_FILTER ? UNCATEGORIZED_FOLDER_ID : effectiveSelected;

  const dialogLink: Link | undefined =
    dialog.kind === "edit-link" || dialog.kind === "move-link" || dialog.kind === "delete-link"
      ? links.find((l) => l.id === dialog.id)
      : undefined;
  const dialogFolder =
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
        <section className="flex min-w-0 flex-1 flex-col gap-4" aria-label="링크 목록">
          <SearchBar
            value={query}
            onChange={setQuery}
            scopeName={selectedFolderName ?? ALL_FILTER_NAME}
          />
          <LinkGrid
            links={visible}
            folders={folders}
            folderName={selectedFolderName}
            query={query}
            onEditLink={(link) => setDialog({ kind: "edit-link", id: link.id })}
            onMoveLink={(link) => setDialog({ kind: "move-link", id: link.id })}
            onDeleteLink={(link) => setDialog({ kind: "delete-link", id: link.id })}
          />
        </section>
      </main>

      {dialog.kind === "add-link" && (
        <AddLinkDialog
          folders={folders}
          links={links}
          defaultFolderId={defaultFolderId}
          onClose={closeDialog}
          onSave={handleAddLink}
        />
      )}
      {dialog.kind === "edit-link" && dialogLink && (
        <EditLinkDialog
          link={dialogLink}
          folders={folders}
          onClose={closeDialog}
          onSave={(input) => handleUpdateLink(dialogLink.id, input)}
        />
      )}
      {dialog.kind === "move-link" && dialogLink && (
        <MoveLinkDialog
          link={dialogLink}
          folders={folders}
          onClose={closeDialog}
          onMove={(folderId) => handleMoveLink(dialogLink.id, folderId)}
        />
      )}
      {dialog.kind === "delete-link" && dialogLink && (
        <ConfirmDialog
          title="링크 삭제"
          message={`'${dialogLink.title}' 링크를 삭제할까요? 이 작업은 되돌릴 수 없습니다.`}
          confirmLabel="삭제"
          onClose={closeDialog}
          onConfirm={() => handleDeleteLink(dialogLink.id)}
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
      {dialog.kind === "rename-folder" && dialogFolder && (
        <FolderNameDialog
          title="폴더 이름 변경"
          submitLabel="저장"
          initialName={dialogFolder.name}
          onClose={closeDialog}
          onSubmit={(name) => handleRenameFolder(dialogFolder.id, name)}
        />
      )}
      {dialog.kind === "delete-folder" && dialogFolder && (
        <ConfirmDialog
          title="폴더 삭제"
          message={
            (counts[dialogFolder.id] ?? 0) > 0
              ? `'${dialogFolder.name}' 폴더를 삭제할까요? 안에 있는 링크 ${counts[dialogFolder.id]}개는 '${UNCATEGORIZED_FOLDER_NAME}'로 이동합니다.`
              : `'${dialogFolder.name}' 폴더를 삭제할까요?`
          }
          confirmLabel="삭제"
          onClose={closeDialog}
          onConfirm={() => handleDeleteFolder(dialogFolder.id)}
        />
      )}
    </div>
  );
}
