import {
  ALL_FILTER,
  ALL_FILTER_NAME,
  UNCATEGORIZED_FOLDER_ID,
  UNCATEGORIZED_FOLDER_NAME,
  type Folder,
  type FolderFilter,
  type FolderId,
  type Link,
  type LinkInput,
} from "@/lib/types";

/**
 * 폴더·링크 상태를 다루는 순수 함수 모음.
 * React나 localStorage에 의존하지 않으므로 단독으로 테스트할 수 있다.
 */

export interface VaultState {
  folders: Folder[];
  links: Link[];
}

export type NewLinkInput = LinkInput;

export type Result<T> = { ok: true; value: T } | { ok: false; error: string };

export function newId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function nowIso(): string {
  return new Date().toISOString();
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

/* ---------------------------------- 폴더 ---------------------------------- */

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

/* ---------------------------------- 링크 ---------------------------------- */

function resolveFolderId(state: VaultState, folderId: FolderId): FolderId {
  return state.folders.some((f) => f.id === folderId) ? folderId : UNCATEGORIZED_FOLDER_ID;
}

/** 빈 문자열인 선택 필드는 저장하지 않는다. */
function cleanInput(input: LinkInput): LinkInput {
  return {
    folderId: input.folderId,
    title: input.title.trim(),
    description: input.description.trim(),
    url: input.url.trim(),
    imageUrl: input.imageUrl?.trim() || undefined,
    ogUrl: input.ogUrl?.trim() || undefined,
    finalUrl: input.finalUrl?.trim() || undefined,
  };
}

export function addLink(state: VaultState, input: LinkInput, now = nowIso()): VaultState {
  const clean = cleanInput(input);
  const link: Link = {
    id: newId(),
    ...clean,
    folderId: resolveFolderId(state, clean.folderId),
    createdAt: now,
    updatedAt: now,
  };
  return { ...state, links: [link, ...state.links] };
}

/** 기존 링크를 같은 ID로 덮어쓴다. 생성일은 유지하고 수정일만 갱신한다. */
export function updateLink(
  state: VaultState,
  id: string,
  input: LinkInput,
  now = nowIso(),
): Result<VaultState> {
  const existing = state.links.find((l) => l.id === id);
  if (!existing) return { ok: false, error: "링크를 찾을 수 없습니다." };
  const clean = cleanInput(input);
  const updated: Link = {
    ...clean,
    id,
    folderId: resolveFolderId(state, clean.folderId),
    createdAt: existing.createdAt,
    updatedAt: now,
  };
  return {
    ok: true,
    value: { ...state, links: state.links.map((l) => (l.id === id ? updated : l)) },
  };
}

export function deleteLink(state: VaultState, id: string): Result<VaultState> {
  if (!state.links.some((l) => l.id === id)) {
    return { ok: false, error: "링크를 찾을 수 없습니다." };
  }
  return { ok: true, value: { ...state, links: state.links.filter((l) => l.id !== id) } };
}

export function moveLink(
  state: VaultState,
  id: string,
  folderId: FolderId,
  now = nowIso(),
): Result<VaultState> {
  const existing = state.links.find((l) => l.id === id);
  if (!existing) return { ok: false, error: "링크를 찾을 수 없습니다." };
  if (!state.folders.some((f) => f.id === folderId)) {
    return { ok: false, error: "폴더를 찾을 수 없습니다." };
  }
  if (existing.folderId === folderId) return { ok: true, value: state };
  return {
    ok: true,
    value: {
      ...state,
      links: state.links.map((l) =>
        l.id === id ? { ...l, folderId, updatedAt: now } : l,
      ),
    },
  };
}

/* ------------------------------ 조회·검색·중복 ------------------------------ */

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

/** 제목·설명·URL에서 대소문자 구분 없이 검색한다. 빈 검색어면 전부 돌려준다. */
export function searchLinks(links: Link[], query: string): Link[] {
  const q = query.trim().toLowerCase();
  if (!q) return links;
  return links.filter(
    (l) =>
      l.title.toLowerCase().includes(q) ||
      l.description.toLowerCase().includes(q) ||
      l.url.toLowerCase().includes(q),
  );
}

/**
 * 중복 판단용 URL 정규화: 앞뒤 공백 제거, 스킴·호스트 소문자화,
 * 끝의 슬래시와 해시(#...) 제거. 파싱이 안 되면 공백만 제거한다.
 */
export function normalizeUrl(raw: string): string {
  const trimmed = raw.trim();
  try {
    const u = new URL(trimmed);
    u.hash = "";
    let s = u.toString();
    if (u.pathname === "/" && !u.search) s = s.replace(/\/$/, "");
    return s;
  } catch {
    return trimmed;
  }
}

/** 같은 주소의 링크가 이미 있으면 돌려준다. 수정 중인 링크 자신은 제외한다. */
export function findDuplicateUrl(
  links: Link[],
  url: string,
  excludeId?: string,
): Link | undefined {
  const target = normalizeUrl(url);
  if (!target) return undefined;
  return links.find((l) => l.id !== excludeId && normalizeUrl(l.url) === target);
}

/* ------------------------------- 저장 데이터 복구 ------------------------------- */

function isFolder(value: unknown): value is Folder {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Folder).id === "string" &&
    typeof (value as Folder).name === "string"
  );
}

type RawLink = Partial<Link> & { id?: unknown; folderId?: unknown; title?: unknown; url?: unknown };

function isRawLink(value: unknown): value is RawLink {
  if (typeof value !== "object" || value === null) return false;
  const v = value as RawLink;
  return (
    typeof v.id === "string" &&
    typeof v.folderId === "string" &&
    typeof v.title === "string" &&
    typeof v.url === "string"
  );
}

function optionalString(value: unknown): string | undefined {
  return typeof value === "string" && value.trim() ? value : undefined;
}

function isoOr(value: unknown, fallback: string): string {
  return typeof value === "string" && !Number.isNaN(Date.parse(value)) ? value : fallback;
}

/**
 * 저장소에서 읽은(신뢰할 수 없는) 데이터를 안전한 상태로 정리한다.
 * - 형식이 맞지 않는 항목은 버린다
 * - '미분류' 폴더가 없으면 추가한다
 * - 존재하지 않는 폴더를 가리키는 링크는 '미분류'로 옮긴다
 * - 예전 데이터에 없는 필드(썸네일, 날짜 등)는 기본값으로 채운다
 * 데이터가 전혀 없으면 null을 돌려준다.
 */
export function normalizeState(raw: unknown, now = nowIso()): VaultState | null {
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

  const seenLinkIds = new Set<string>();
  const safeLinks: Link[] = [];
  for (const l of links) {
    if (!isRawLink(l) || seenLinkIds.has(l.id as string)) continue;
    seenLinkIds.add(l.id as string);
    const createdAt = isoOr(l.createdAt, now);
    safeLinks.push({
      id: l.id as string,
      folderId: folderIds.has(l.folderId as string)
        ? (l.folderId as string)
        : UNCATEGORIZED_FOLDER_ID,
      title: l.title as string,
      description: typeof l.description === "string" ? l.description : "",
      url: l.url as string,
      imageUrl: optionalString(l.imageUrl),
      ogUrl: optionalString(l.ogUrl),
      finalUrl: optionalString(l.finalUrl),
      createdAt,
      updatedAt: isoOr(l.updatedAt, createdAt),
    });
  }

  return { folders: finalFolders, links: safeLinks };
}
