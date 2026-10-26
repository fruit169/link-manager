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
  /**
   * 이 세션에서 화면용 임시 id 가 서버(int8) id 로 바뀐 기록: 임시 id → 서버 id.
   * 화면이 임시 id 를 들고 있어도(예: 방금 만든 폴더 선택) 같은 항목을 가리키게 한다.
   */
  aliases: Record<string, string>;
}

const initialState: VaultStoreState = {
  status: "loading",
  user: null,
  error: null,
  imported: null,
  aliases: {},
  folders: [],
  links: [],
};

let state: VaultStoreState = initialState;
let supabase: SupabaseClient | null = null;
let loadStarted = false;
/** 불러오기 순번. 계정이 바뀌어 다시 불러오기 시작하면 올라가고, 이전 불러오기의 결과는 버린다. */
let loadSeq = 0;
let authWatchStarted = false;
const listeners = new Set<() => void>();

/**
 * 서버 insert 가 아직 끝나지 않은 항목의 임시 id → 서버 id 약속.
 * 그 사이에 들어온 수정·이동·삭제는 settled() 로 서버 id 가 나올 때까지 기다린다.
 */
const pending = new Map<string, Promise<string>>();

/** 임시 id 면 서버 id 가 나올 때까지 기다리고, 아니면 그대로 돌려준다. */
async function settled(id: string): Promise<string> {
  const promised = pending.get(id);
  return promised ? await promised : id;
}

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

/**
 * 사용자 확인 → 그 사용자의 데이터만 불러오기 → (사용자별로 한 번만) localStorage 가져오기.
 * 진행 중에 계정이 바뀌어 새 불러오기가 시작되면(loadSeq 증가) 이 결과는 반영하지 않는다.
 */
async function load(): Promise<void> {
  const seq = ++loadSeq;
  const stale = () => seq !== loadSeq;
  try {
    const { data, error } = await client().auth.getUser();
    if (stale()) return;
    if (error || !data.user) {
      setState({ status: "unauthenticated", user: null });
      return;
    }
    const user: AppUser = { id: data.user.id, email: data.user.email ?? "" };

    let vault = await repo.loadVault(client(), user.id);
    if (stale()) return;
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
      if (!stale()) setState({ error: `이전 데이터를 가져오지 못했습니다. ${errorMessage(err)}` });
    }

    if (stale()) return;
    setState({ status: "ready", user, imported, ...vault });
  } catch (err) {
    if (!stale()) setState({ status: "error", error: errorMessage(err) });
  }
}

/** 스토어를 비운다. 다른 계정의 데이터가 화면에 남지 않도록 처음 상태로 되돌린다. */
function resetStore(status: VaultStatus) {
  pending.clear();
  loadStarted = status === "loading";
  setState({ ...initialState, status });
}

/**
 * Supabase 인증 상태를 지켜보다가 계정이 바뀌면 처음부터 다시 불러온다.
 * - 다른 사용자로 로그인되면(다른 탭 포함) 상태를 비우고 새 사용자의 데이터를 불러온다
 * - 로그아웃되면 상태를 비운다
 */
function watchAuthChanges() {
  if (authWatchStarted) return;
  authWatchStarted = true;
  client().auth.onAuthStateChange((event, session) => {
    const nextUserId = session?.user.id ?? null;
    const currentUserId = state.user?.id ?? null;

    if (event === "SIGNED_OUT" || (nextUserId === null && currentUserId !== null)) {
      resetStore("unauthenticated");
      return;
    }
    // 첫 불러오기가 진행 중일 때 오는 INITIAL_SESSION 등은 그 불러오기가 처리한다
    if (nextUserId !== null && nextUserId !== currentUserId && state.status !== "loading") {
      resetStore("loading");
      void load();
    }
  });
}

function ensureLoaded() {
  watchAuthChanges();
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

/**
 * 새 항목 추가: 화면에는 임시 id 로 먼저 그리고, 서버가 만든 id 를 받아 바꿔 끼운다.
 * @param tempId  vault.ts 가 만든 임시 id (uuid 문자열)
 * @param persist 서버에 insert 하고 생성된 id 를 돌려주는 함수
 * @param replace 상태 안의 임시 id 를 서버 id 로 바꾸는 순수 함수
 */
function commitInsert(
  next: VaultState,
  tempId: string,
  persist: () => Promise<string>,
  replace: (state: VaultState, serverId: string) => VaultState,
) {
  setState({ folders: next.folders, links: next.links, error: null });
  const promise = persist();
  pending.set(tempId, promise);
  promise
    .then((serverId) => {
      const current = getSnapshot();
      const replaced = replace({ folders: current.folders, links: current.links }, serverId);
      setState({ ...replaced, aliases: { ...current.aliases, [tempId]: serverId } });
    })
    .catch(recover)
    .finally(() => pending.delete(tempId));
}

function replaceLinkId(tempId: string) {
  return (s: VaultState, serverId: string): VaultState => ({
    ...s,
    links: s.links.map((l) => (l.id === tempId ? { ...l, id: serverId } : l)),
  });
}

function replaceFolderId(tempId: string) {
  return (s: VaultState, serverId: string): VaultState => ({
    folders: s.folders.map((f) => (f.id === tempId ? { ...f, id: serverId } : f)),
    // 폴더 저장이 끝나기 전에 그 폴더로 넣은 링크도 따라간다
    links: s.links.map((l) => (l.folderId === tempId ? { ...l, folderId: serverId } : l)),
  });
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
    commitInsert(
      next,
      link.id,
      async () => repo.insertLink(client(), userId, link, await settled(link.folderId)),
      replaceLinkId(link.id),
    );
  }, []);

  const updateLink = useCallback((id: string, input: NewLinkInput): Result<void> => {
    const result = updateLinkPure(getSnapshot(), id, input);
    if (!result.ok) return result;
    const link = result.value.links.find((l) => l.id === id)!;
    commit(result.value, async () =>
      repo.updateLink(client(), { ...link, id: await settled(link.id) }, await settled(link.folderId)),
    );
    return { ok: true, value: undefined };
  }, []);

  const deleteLink = useCallback((id: string): Result<void> => {
    const result = deleteLinkPure(getSnapshot(), id);
    if (!result.ok) return result;
    commit(result.value, async () => repo.deleteLink(client(), await settled(id)));
    return { ok: true, value: undefined };
  }, []);

  const moveLink = useCallback((id: string, folderId: FolderId): Result<void> => {
    const result = moveLinkPure(getSnapshot(), id, folderId);
    if (!result.ok) return result;
    commit(result.value, async () =>
      repo.moveLink(client(), await settled(id), await settled(folderId)),
    );
    return { ok: true, value: undefined };
  }, []);

  const addFolder = useCallback((name: string): Result<Folder> => {
    const current = getSnapshot();
    const result = addFolderPure(current, name);
    if (!result.ok) return result;
    const userId = current.user?.id;
    if (!userId) return { ok: false, error: "로그인이 필요합니다." };
    const sortOrder = current.folders.filter((f) => !f.isSystem).length;
    const folder = result.value.folder;
    commitInsert(
      result.value.state,
      folder.id,
      () => repo.insertFolder(client(), userId, folder, sortOrder),
      replaceFolderId(folder.id),
    );
    // 화면은 임시 id 를 받는다. 서버 id 로 바뀐 뒤에는 aliases 로 같은 폴더를 찾을 수 있다.
    return { ok: true, value: folder };
  }, []);

  const renameFolder = useCallback((id: FolderId, name: string): Result<void> => {
    const result = renameFolderPure(getSnapshot(), id, name);
    if (!result.ok) return result;
    const folder = result.value.folders.find((f) => f.id === id)!;
    commit(result.value, async () => repo.renameFolder(client(), await settled(id), folder.name));
    return { ok: true, value: undefined };
  }, []);

  const deleteFolder = useCallback((id: FolderId): Result<void> => {
    const current = getSnapshot();
    const result = deleteFolderPure(current, id);
    if (!result.ok) return result;
    const uncategorizedId = uncategorizedIdOf(current.folders);
    commit(result.value, async () =>
      repo.deleteFolder(client(), await settled(id), await settled(uncategorizedId)),
    );
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
    resetStore("unauthenticated");
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
