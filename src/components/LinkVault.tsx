"use client";

import { useRouter } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import AddLinkDialog from "@/components/AddLinkDialog";
import ConfirmDialog from "@/components/ConfirmDialog";
import EditLinkDialog from "@/components/EditLinkDialog";
import FolderNameDialog from "@/components/FolderNameDialog";
import FolderSidebar from "@/components/FolderSidebar";
import Header from "@/components/Header";
import LinkGrid from "@/components/LinkGrid";
import MoveLinkDialog from "@/components/MoveLinkDialog";
import SearchBar from "@/components/SearchBar";
import {
  ALL_FILTER,
  ALL_FILTER_NAME,
  UNCATEGORIZED_FOLDER_NAME,
  type FolderFilter,
  type FolderId,
  type Link,
  type LinkInput,
} from "@/lib/types";
import {
  countByFolder,
  linksInFilter,
  searchLinks,
  uncategorizedIdOf,
  type VaultState,
} from "@/lib/vault";
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
  const router = useRouter();
  const vault = useVault();
  const {
    status,
    user,
    error,
    imported,
    aliases,
    folders,
    links,
    addLink,
    updateLink,
    deleteLink,
    moveLink,
    addFolder,
    renameFolder,
    deleteFolder,
    dismissError,
    reload,
    signOut,
  } = vault;

  const [selected, setSelected] = useState<FolderFilter>(ALL_FILTER);
  const [query, setQuery] = useState("");
  const [dialog, setDialog] = useState<DialogState>({ kind: "none" });
  const closeDialog = useCallback(() => setDialog({ kind: "none" }), []);

  const state = useMemo<VaultState>(() => ({ folders, links }), [folders, links]);
  const counts = useMemo(() => countByFolder(state), [state]);

  // 방금 만든 폴더의 임시 id 가 서버 id 로 바뀌었으면 그 id 로 따라간다
  const resolvedSelected =
    selected === ALL_FILTER ? selected : (aliases[selected] ?? selected);
  // 선택한 폴더가 사라졌으면 '전체'로 되돌린다
  const effectiveSelected =
    resolvedSelected === ALL_FILTER || folders.some((f) => f.id === resolvedSelected)
      ? resolvedSelected
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

  const handleSignOut = async () => {
    await signOut();
    router.replace("/login");
    router.refresh();
  };

  /* -------------------------------- 상태 화면 -------------------------------- */

  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)] text-[var(--text-sub)]">
        불러오는 중…
      </div>
    );
  }
  if (status === "unauthenticated") {
    // 프록시가 /login 으로 보내지만, 세션이 중간에 끊긴 경우를 대비한다
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] px-6 text-center">
        <p className="text-[var(--text-body)] font-bold text-[var(--text)]">로그인이 필요합니다</p>
        <a href="/login" className="btn-primary px-5 py-2.5 text-[15px]">
          로그인 화면으로
        </a>
      </div>
    );
  }
  if (status === "error") {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[var(--bg)] px-6 text-center">
        <p className="text-[var(--text-body)] font-bold text-[var(--text)]">데이터를 불러오지 못했습니다</p>
        <p className="text-[var(--text-sub-size)] text-[var(--text-sub)]">{error}</p>
        <div className="flex gap-2">
          <button type="button" onClick={reload} className="btn-primary px-5 py-2.5 text-[15px]">
            다시 시도
          </button>
          <button type="button" onClick={handleSignOut} className="btn-secondary px-5 py-2.5 text-[15px]">
            로그아웃
          </button>
        </div>
      </div>
    );
  }

  /* -------------------------------- 다이얼로그 -------------------------------- */

  const uncategorizedId = uncategorizedIdOf(folders);
  const defaultFolderId =
    effectiveSelected === ALL_FILTER ? uncategorizedId : effectiveSelected;

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
        userEmail={user?.email ?? null}
        onNewFolder={() => setDialog({ kind: "add-folder" })}
        onNewLink={() => setDialog({ kind: "add-link" })}
        onSignOut={handleSignOut}
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
          {error && (
            <div role="alert" className="notice notice-error flex items-start justify-between gap-3 px-4 py-3 text-[var(--text-sub-size)] leading-[1.5]">
              <span>{error}</span>
              <button type="button" onClick={dismissError} aria-label="알림 닫기" className="shrink-0 font-bold">
                ×
              </button>
            </div>
          )}
          {imported && !error && (
            <div role="status" className="notice notice-info flex items-start justify-between gap-3 px-4 py-3 text-[var(--text-sub-size)] leading-[1.5]">
              <span>
                이 브라우저에 저장되어 있던 폴더 {imported.folders}개와 링크 {imported.links}개를 계정으로 가져왔습니다.
              </span>
              <button type="button" onClick={dismissError} aria-label="알림 닫기" className="shrink-0 font-bold">
                ×
              </button>
            </div>
          )}
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
