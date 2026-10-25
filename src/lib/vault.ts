import {
  ALL_FILTER,
  ALL_FILTER_NAME,
  UNCATEGORIZED_FOLDER_ID,
  UNCATEGORIZED_FOLDER_NAME,
  type Folder,
  type FolderFilter,
  type FolderId,
  type Link,
} from "@/lib/types";

/**
 * 폴더·링크 상태를 다루는 순수 함수 모음.
 * React나 localStorage에 의존하지 않으므로 단독으로 테스트할 수 있다.
 */

export interface VaultState {
  folders: Folder[];
  links: Link[];
}

export type NewLinkInput = Omit<Link, "id">;

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

/** '미분류'처럼 사용자가 바꾸거나 지울 수 없는 폴더인지 */
export function isSystemFolder(id: FolderId): boolean {
  return id === UNCATEGORIZED_FOLDER_ID;
}

export const uncategorizedFolder: Folder = {
  id: UNCATEGORIZED_FOLDER_ID,
  name: UNCATEGORIZED_FOLDER_NAME,
};

/** 시스템 폴더('미분류')가 항상 마지막에 있도록 정렬한다. */
function withSystemFolderLast(folders: Folder[]): Folder[] {
  const user = folders.filter((f) => !isSystemFolder(f.id));
  return [...user, uncategorizedFolder];
}

/**
 * 폴더 이름 검증. 문제가 없으면 정리된(trim) 이름을, 있으면 오류 메시지를 돌려준다.
 * @param excludeId 이름 변경 시 자기 자신은 중복 검사에서 제외
 */
export function validateFolderName(
  folders: Folder[],
  rawName: string,
  excludeId?: FolderId,
): Result<string> {
  const name = rawName.trim();
  if (!name) return { ok: false, error: "폴더 이름을 입력해 주세요." };
  if (name === ALL_FILTER_NAME || name === ALL_FILTER) {
    return { ok: false, error: `'${name}'은 사용할 수 없는 이름입니다.` };
  }
  const duplicate = folders.some(
    (f) => f.id !== excludeId && f.name.trim() === name,
  );
  if (duplicate) return { ok: false, error: "같은 이름의 폴더가 이미 있습니다." };
  return { ok: true, value: name };
}

export function addFolder(
  state: VaultState,
  rawName: string,
): Result<{ state: VaultState; folder: Folder }> {
  const valid = validateFolderName(state.folders, rawName);
  if (!valid.ok) return valid;
  const folder: Folder = { id: newId(), name: valid.value };
  return {
    ok: true,
    value: {
      state: { ...state, folders: withSystemFolderLast([...state.folders, folder]) },
      folder,
    },
  };
}

export function renameFolder(
  state: VaultState,
  id: FolderId,
  rawName: string,
): Result<VaultState> {
  if (isSystemFolder(id)) {
    return { ok: false, error: `'${UNCATEGORIZED_FOLDER_NAME}' 폴더는 이름을 바꿀 수 없습니다.` };
  }
  if (!state.folders.some((f) => f.id === id)) {
    return { ok: false, error: "폴더를 찾을 수 없습니다." };
  }
  const valid = validateFolderName(state.folders, rawName, id);
  if (!valid.ok) return valid;
  return {
    ok: true,
    value: {
      ...state,
      folders: state.folders.map((f) =>
        f.id === id ? { ...f, name: valid.value } : f,
      ),
    },
  };
}

/** 폴더를 지우고 안에 있던 링크는 '미분류'로 옮긴다. */
export function deleteFolder(state: VaultState, id: FolderId): Result<VaultState> {
  if (isSystemFolder(id)) {
    return { ok: false, error: `'${UNCATEGORIZED_FOLDER_NAME}' 폴더는 삭제할 수 없습니다.` };
  }
  if (!state.folders.some((f) => f.id === id)) {
    return { ok: false, error: "폴더를 찾을 수 없습니다." };
  }
  return {
    ok: true,
    value: {
      folders: state.folders.filter((f) => f.id !== id),
      links: state.links.map((l) =>
        l.folderId === id ? { ...l, folderId: UNCATEGORIZED_FOLDER_ID } : l,
      ),
    },
  };
}

export function addLink(state: VaultState, input: NewLinkInput): VaultState {
  const folderExists = state.folders.some((f) => f.id === input.folderId);
  const link: Link = {
    id: newId(),
    ...input,
    folderId: folderExists ? input.folderId : UNCATEGORIZED_FOLDER_ID,
  };
  return { ...state, links: [link, ...state.links] };
}

export function countByFolder(state: VaultState): Record<FolderFilter, number> {
  const counts: Record<FolderFilter, number> = { [ALL_FILTER]: state.links.length };
  for (const folder of state.folders) counts[folder.id] = 0;
  for (const link of state.links) {
    counts[link.folderId] = (counts[link.folderId] ?? 0) + 1;
  }
  return counts;
}

export function linksInFilter(state: VaultState, filter: FolderFilter): Link[] {
  if (filter === ALL_FILTER) return state.links;
  return state.links.filter((l) => l.folderId === filter);
}

function isFolder(value: unknown): value is Folder {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Folder).id === "string" &&
    typeof (value as Folder).name === "string"
  );
}

function isLink(value: unknown): value is Link {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Link;
  return (
    typeof v.id === "string" &&
    typeof v.folderId === "string" &&
    typeof v.title === "string" &&
    typeof v.url === "string" &&
    (v.description === undefined || typeof v.description === "string") &&
    (v.imageUrl === undefined || typeof v.imageUrl === "string")
  );
}

/**
 * 저장소에서 읽은(신뢰할 수 없는) 데이터를 안전한 상태로 정리한다.
 * - 형식이 맞지 않는 항목은 버린다
 * - '미분류' 폴더가 없으면 추가한다
 * - 존재하지 않는 폴더를 가리키는 링크는 '미분류'로 옮긴다
 * 데이터가 전혀 없으면 null을 돌려준다.
 */
export function normalizeState(raw: unknown): VaultState | null {
  if (typeof raw !== "object" || raw === null) return null;
  const { folders, links } = raw as { folders?: unknown; links?: unknown };
  if (!Array.isArray(folders) || !Array.isArray(links)) return null;

  const seenIds = new Set<string>();
  const safeFolders: Folder[] = [];
  for (const f of folders) {
    if (!isFolder(f) || seenIds.has(f.id)) continue;
    seenIds.add(f.id);
    safeFolders.push(isSystemFolder(f.id) ? uncategorizedFolder : { id: f.id, name: f.name });
  }
  const finalFolders = withSystemFolderLast(safeFolders);
  const folderIds = new Set(finalFolders.map((f) => f.id));

  const safeLinks: Link[] = [];
  for (const l of links) {
    if (!isLink(l)) continue;
    safeLinks.push({
      id: l.id,
      folderId: folderIds.has(l.folderId) ? l.folderId : UNCATEGORIZED_FOLDER_ID,
      title: l.title,
      description: l.description ?? "",
      url: l.url,
      imageUrl: l.imageUrl,
    });
  }

  return { folders: finalFolders, links: safeLinks };
}
