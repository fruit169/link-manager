"use client";

import { useCallback, useSyncExternalStore } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { loadVault as loadLocalVault, STORAGE_KEY } from "@/lib/storage";
import * as repo from "@/lib/supabase-repo";
import {
  addFolder as addFolderPure,
  addLink as addLinkPure,
  deleteFolder as deleteFolderPure,
  deleteLink as deleteLinkPure,
  moveLink as moveLinkPure,
  planImport,
  renameFolder as renameFolderPure,
  uncategorizedIdOf,
  updateLink as updateLinkPure,
  type NewLinkInput,
  type Result,
  type VaultState,
} from "@/lib/vault";
import type { AppUser, Folder, FolderId } from "@/lib/types";
import { createClient } from "@/utils/supabase/client";

/**
 * 폴더·링크 상태를 Supabase와 동기화하는 외부 스토어.
 * - 처음 구독될 때 로그인 사용자와 데이터를 불러온다.
 * - 변경은 순수 함수(vault.ts)로 화면에 먼저 반영하고, 그다음 서버에 기록한다.
 *   서버 기록이 실패하면 오류를 표시하고 서버 상태를 다시 불러온다.
 * - 예전 localStorage 데이터가 있으면 사용자별로 한 번만 가져온다.
 */

export type VaultStatus = "loading" | "ready" | "unauthenticated" | "error";

export interface VaultStoreState extends VaultState {
  status: VaultStatus;
  user: AppUser | null;
  /** 마지막 서버 작업 오류. 사용자가 닫을 때까지 표시한다. */
  error: string | null;
  /** 직전 불러오기에서 localStorage 데이터를 가져왔는지 (개수) */
  imported: { folders: number; links: number } | null;
}

const initialState: VaultStoreState = {
  status: "loading",
  user: null,
  error: null,
  imported: null,
  folders: [],
  links: [],
};

let state: VaultStoreState = initialState;
let supabase: SupabaseClient | null = null;
let loadStarted = false;
const listeners = new Set<() => void>();

function client(): SupabaseClient {
  if (!supabase) supabase = createClient();
  return supabase;
}

function setState(patch: Partial<VaultStoreState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

function importedFlagKey(userId: string) {
  return `link-manager.imported.${userId}`;
}

function errorMessage(err: unknown): string {
  if (err instanceof repo.RepoError) return err.message;
  if (err instanceof Error && err.message) return err.message;
  return "서버와 통신하지 못했습니다.";
}

/** 사용자 확인 → 데이터 불러오기 → (한 번만) localStorage 가져오기 */
async function load(): Promise<void> {
  try {
    const { data, error } = await client().auth.getUser();
    if (error || !data.user) {
      setState({ status: "unauthenticated", user: null });
      return;
    }
    const user: AppUser = { id: data.user.id, email: data.user.email ?? "" };

    let vault = await repo.loadVault(client(), user.id);
    let imported: VaultStoreState["imported"] = null;

    try {
      if (!window.localStorage.getItem(importedFlagKey(user.id))) {
        const local = loadLocalVault().state;
        if (local && (local.links.length > 0 || local.folders.some((f) => !f.isSystem))) {
          const plan = planImport(local, vault);
          if (plan.foldersToInsert.length > 0 || plan.linksToInsert.length > 0) {
            await repo.applyImport(client(), user.id, plan, vault.folders.length);
            vault = await repo.loadVault(client(), user.id);
            imported = { folders: plan.foldersToInsert.length, links: plan.linksToInsert.length };
          }
        }
        window.localStorage.setItem(importedFlagKey(user.id), new Date().toISOString());
      }
    } catch (err) {
      // 가져오기 실패는 치명적이지 않다. 안내만 하고 서버 데이터로 계속 간다.
      setState({ error: `이전 데이터를 가져오지 못했습니다. ${errorMessage(err)}` });
    }

    setState({ status: "ready", user, imported, ...vault });
  } catch (err) {
    setState({ status: "error", error: errorMessage(err) });
  }
}

function ensureLoaded() {
  if (loadStarted) return;
  loadStarted = true;
  void load();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  ensureLoaded();
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): VaultStoreState {
  return state;
}

function getServerSnapshot(): VaultStoreState {
  return initialState;
}

/** 서버 기록이 실패했을 때: 오류를 알리고 서버 상태로 되돌린다 */
async function recover(err: unknown) {
  const message = errorMessage(err);
  try {
    if (state.user) {
      const vault = await repo.loadVault(client(), state.user.id);
      setState({ ...vault, error: message });
      return;
    }
  } catch {
    // 다시 불러오기도 실패하면 화면 상태는 그대로 두고 오류만 보여 준다
  }
  setState({ error: message });
}

/** 화면에 먼저 반영하고 서버에 기록한다. */
function commit(next: VaultState, persist: () => Promise<void>) {
  setState({ folders: next.folders, links: next.links, error: null });
  persist().catch(recover);
}

export interface VaultActions {
  addLink: (input: NewLinkInput) => void;
  updateLink: (id: string, input: NewLinkInput) => Result<void>;
  deleteLink: (id: string) => Result<void>;
  moveLink: (id: string, folderId: FolderId) => Result<void>;
  addFolder: (name: string) => Result<Folder>;
  renameFolder: (id: FolderId, name: string) => Result<void>;
  deleteFolder: (id: FolderId) => Result<void>;
  dismissError: () => void;
  reload: () => void;
  signOut: () => Promise<void>;
}

export function useVault(): VaultStoreState & VaultActions {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addLink = useCallback((input: NewLinkInput) => {
    const current = getSnapshot();
    const next = addLinkPure(current, input);
    const link = next.links[0];
    const userId = current.user?.id;
    if (!userId) return;
    commit(next, () => repo.insertLink(client(), userId, link));
  }, []);

  const updateLink = useCallback((id: string, input: NewLinkInput): Result<void> => {
    const result = updateLinkPure(getSnapshot(), id, input);
    if (!result.ok) return result;
    const link = result.value.links.find((l) => l.id === id)!;
    commit(result.value, () => repo.updateLink(client(), link));
    return { ok: true, value: undefined };
  }, []);

  const deleteLink = useCallback((id: string): Result<void> => {
    const result = deleteLinkPure(getSnapshot(), id);
    if (!result.ok) return result;
    commit(result.value, () => repo.deleteLink(client(), id));
    return { ok: true, value: undefined };
  }, []);

  const moveLink = useCallback((id: string, folderId: FolderId): Result<void> => {
    const result = moveLinkPure(getSnapshot(), id, folderId);
    if (!result.ok) return result;
    commit(result.value, () => repo.moveLink(client(), id, folderId));
    return { ok: true, value: undefined };
  }, []);

  const addFolder = useCallback((name: string): Result<Folder> => {
    const current = getSnapshot();
    const result = addFolderPure(current, name);
    if (!result.ok) return result;
    const userId = current.user?.id;
    if (!userId) return { ok: false, error: "로그인이 필요합니다." };
    const sortOrder = current.folders.filter((f) => !f.isSystem).length;
    commit(result.value.state, () =>
      repo.insertFolder(client(), userId, result.value.folder, sortOrder),
    );
    return { ok: true, value: result.value.folder };
  }, []);

  const renameFolder = useCallback((id: FolderId, name: string): Result<void> => {
    const result = renameFolderPure(getSnapshot(), id, name);
    if (!result.ok) return result;
    const folder = result.value.folders.find((f) => f.id === id)!;
    commit(result.value, () => repo.renameFolder(client(), id, folder.name));
    return { ok: true, value: undefined };
  }, []);

  const deleteFolder = useCallback((id: FolderId): Result<void> => {
    const current = getSnapshot();
    const result = deleteFolderPure(current, id);
    if (!result.ok) return result;
    const uncategorizedId = uncategorizedIdOf(current.folders);
    commit(result.value, () => repo.deleteFolder(client(), id, uncategorizedId));
    return { ok: true, value: undefined };
  }, []);

  const dismissError = useCallback(() => setState({ error: null, imported: null }), []);

  const reload = useCallback(() => {
    setState({ status: "loading", error: null });
    void load();
  }, []);

  const signOut = useCallback(async () => {
    await client().auth.signOut();
    // 다음 로그인(다른 계정일 수 있음)을 위해 스토어를 비운다. localStorage 데이터는 건드리지 않는다.
    loadStarted = false;
    setState({ ...initialState, status: "unauthenticated" });
  }, []);

  return {
    ...snapshot,
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
  };
}

/** 테스트·디버깅용: localStorage 데이터 키 */
export { STORAGE_KEY };
