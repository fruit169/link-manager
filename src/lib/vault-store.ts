"use client";

import { useCallback, useSyncExternalStore } from "react";
import { seedVault } from "@/data/links";
import { loadVault, saveVault, STORAGE_KEY } from "@/lib/storage";
import {
  addFolder as addFolderPure,
  addLink as addLinkPure,
  deleteFolder as deleteFolderPure,
  deleteLink as deleteLinkPure,
  moveLink as moveLinkPure,
  normalizeState,
  renameFolder as renameFolderPure,
  updateLink as updateLinkPure,
  type NewLinkInput,
  type Result,
  type VaultState,
} from "@/lib/vault";
import type { Folder, FolderId } from "@/lib/types";

/**
 * 폴더·링크 상태를 localStorage와 동기화하는 외부 스토어.
 * - 서버 렌더링과 하이드레이션 단계에서는 seed(샘플 데이터)를 쓰고,
 *   브라우저에서는 저장된 데이터가 있으면 그것으로 바꿔 그린다.
 * - 저장 데이터가 깨져 있으면 덮어쓰지 않고, 사용자가 처음 바꿀 때만 저장한다.
 * - 다른 탭에서 바뀐 내용도 storage 이벤트로 반영한다.
 */

/** 저장 데이터가 없을 때의 초기 상태. 서버 스냅샷과 같은 객체여야 하므로 모듈 상수다. */
const seedState: VaultState = normalizeState(seedVault) ?? seedVault;

let currentState: VaultState | null = null;
const listeners = new Set<() => void>();

function emit() {
  for (const listener of listeners) listener();
}

function getSnapshot(): VaultState {
  if (currentState === null) {
    const { state, hadData } = loadVault();
    currentState = state ?? seedState;
    // 아무것도 저장된 적이 없을 때만 샘플을 기록한다. 깨진 데이터는 보존한다.
    if (!hadData) saveVault(currentState);
  }
  return currentState;
}

function getServerSnapshot(): VaultState {
  return seedState;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY || !e.newValue) return;
    const next = normalizeState(safeParse(e.newValue));
    if (next) {
      currentState = next;
      emit();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function commit(next: VaultState) {
  currentState = next;
  saveVault(next);
  emit();
}

export interface VaultActions {
  addLink: (input: NewLinkInput) => void;
  updateLink: (id: string, input: NewLinkInput) => Result<void>;
  deleteLink: (id: string) => Result<void>;
  moveLink: (id: string, folderId: FolderId) => Result<void>;
  addFolder: (name: string) => Result<Folder>;
  renameFolder: (id: FolderId, name: string) => Result<void>;
  deleteFolder: (id: FolderId) => Result<void>;
}

function applyResult(result: Result<VaultState>): Result<void> {
  if (!result.ok) return result;
  commit(result.value);
  return { ok: true, value: undefined };
}

export function useVault(): VaultState & VaultActions {
  const state = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  const addLink = useCallback((input: NewLinkInput) => {
    commit(addLinkPure(getSnapshot(), input));
  }, []);

  const updateLink = useCallback(
    (id: string, input: NewLinkInput) => applyResult(updateLinkPure(getSnapshot(), id, input)),
    [],
  );

  const deleteLink = useCallback(
    (id: string) => applyResult(deleteLinkPure(getSnapshot(), id)),
    [],
  );

  const moveLink = useCallback(
    (id: string, folderId: FolderId) => applyResult(moveLinkPure(getSnapshot(), id, folderId)),
    [],
  );

  const addFolder = useCallback((name: string): Result<Folder> => {
    const result = addFolderPure(getSnapshot(), name);
    if (!result.ok) return result;
    commit(result.value.state);
    return { ok: true, value: result.value.folder };
  }, []);

  const renameFolder = useCallback(
    (id: FolderId, name: string) => applyResult(renameFolderPure(getSnapshot(), id, name)),
    [],
  );

  const deleteFolder = useCallback(
    (id: FolderId) => applyResult(deleteFolderPure(getSnapshot(), id)),
    [],
  );

  return {
    ...state,
    addLink,
    updateLink,
    deleteLink,
    moveLink,
    addFolder,
    renameFolder,
    deleteFolder,
  };
}
