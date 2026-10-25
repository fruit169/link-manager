import type { SupabaseClient } from "@supabase/supabase-js";
import { UNCATEGORIZED_FOLDER_NAME, type Folder, type Link } from "@/lib/types";
import type { ImportPlan, VaultState } from "@/lib/vault";

/**
 * Supabase folders / links 테이블 읽기·쓰기.
 * 행(snake_case) ↔ 앱 모델(camelCase) 변환만 하고 업무 규칙은 vault.ts가 맡는다.
 * 모든 쿼리는 RLS 때문에 로그인한 사용자의 행만 다룬다.
 *
 * id 규칙: DB의 id 는 int8 identity(자동 증가)라서 insert 때 보내지 않고,
 * 생성된 값을 select 로 돌려받아 문자열로 바꿔 앱 모델에 넣는다.
 * 앱이 화면에 먼저 그릴 때 쓰는 임시 id(uuid 문자열)는 DB 로 보내면 안 된다.
 */

interface FolderRow {
  id: number;
  name: string;
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

interface LinkRow {
  id: number;
  folder_id: number | null;
  title: string | null;
  description: string | null;
  url: string;
  thumbnail_url: string | null;
  og_url: string | null;
  final_url: string | null;
  created_at: string;
  updated_at: string;
}

const FOLDER_COLUMNS = "id, name, is_system, sort_order, created_at";
const LINK_COLUMNS =
  "id, folder_id, title, description, url, thumbnail_url, og_url, final_url, created_at, updated_at";

export class RepoError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RepoError";
  }
}

function fail(action: string, error: { message: string } | null): never {
  const detail = error?.message ? ` (${error.message})` : "";
  throw new RepoError(`${action}에 실패했습니다.${detail}`);
}

/** DB int8 id → 앱 모델 id (문자열) */
function appId(id: number): string {
  return String(id);
}

/**
 * 앱 모델 id → DB int8 id.
 * 아직 서버에 저장되지 않은 임시 id(uuid 문자열)가 들어오면 명확한 오류를 낸다.
 */
export function dbId(id: string): number {
  const n = Number(id);
  if (!Number.isSafeInteger(n) || n <= 0) {
    throw new RepoError("아직 저장이 끝나지 않은 항목입니다. 잠시 후 다시 시도해 주세요.");
  }
  return n;
}

function toFolder(row: FolderRow): Folder {
  return row.is_system
    ? { id: appId(row.id), name: UNCATEGORIZED_FOLDER_NAME, isSystem: true }
    : { id: appId(row.id), name: row.name };
}

function toLink(row: LinkRow, fallbackFolderId: string): Link {
  return {
    id: appId(row.id),
    folderId: row.folder_id === null ? fallbackFolderId : appId(row.folder_id),
    title: row.title ?? "",
    description: row.description ?? "",
    url: row.url,
    imageUrl: row.thumbnail_url ?? undefined,
    ogUrl: row.og_url ?? undefined,
    finalUrl: row.final_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** insert/update 에 보내는 링크 열. id 는 DB 가 만들므로 넣지 않는다. */
function linkRow(userId: string, link: Link, folderId: number) {
  return {
    user_id: userId,
    folder_id: folderId,
    title: link.title,
    description: link.description,
    url: link.url,
    thumbnail_url: link.imageUrl ?? null,
    og_url: link.ogUrl ?? null,
    final_url: link.finalUrl ?? null,
  };
}

export async function loadVault(supabase: SupabaseClient, userId: string): Promise<VaultState> {
  const { data: folderRows, error: folderError } = await supabase
    .from("folders")
    .select(FOLDER_COLUMNS)
    .order("is_system", { ascending: true })
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (folderError) fail("폴더 불러오기", folderError);

  let folders = (folderRows as FolderRow[]).map(toFolder);

  // 사용자별 '미분류' 폴더가 없으면 만든다 (처음 로그인한 사용자)
  if (!folders.some((f) => f.isSystem)) {
    const { data, error } = await supabase
      .from("folders")
      .insert({ user_id: userId, name: UNCATEGORIZED_FOLDER_NAME, is_system: true, sort_order: 9999 })
      .select(FOLDER_COLUMNS)
      .single();
    if (error) fail("'미분류' 폴더 만들기", error);
    folders = [...folders, toFolder(data as FolderRow)];
  }
  const uncategorizedId = folders.find((f) => f.isSystem)!.id;

  const { data: linkRows, error: linkError } = await supabase
    .from("links")
    .select(LINK_COLUMNS)
    .order("created_at", { ascending: false });
  if (linkError) fail("링크 불러오기", linkError);

  return {
    folders,
    links: (linkRows as LinkRow[]).map((row) => toLink(row, uncategorizedId)),
  };
}

/** 폴더를 만들고 DB 가 부여한 id 를 돌려준다. */
export async function insertFolder(
  supabase: SupabaseClient,
  userId: string,
  folder: Folder,
  sortOrder: number,
): Promise<string> {
  const { data, error } = await supabase
    .from("folders")
    .insert({ user_id: userId, name: folder.name, is_system: false, sort_order: sortOrder })
    .select("id")
    .single();
  if (error || !data) fail("폴더 추가", error);
  return appId((data as { id: number }).id);
}

export async function renameFolder(supabase: SupabaseClient, id: string, name: string): Promise<void> {
  const { error } = await supabase.from("folders").update({ name }).eq("id", dbId(id));
  if (error) fail("폴더 이름 변경", error);
}

/** 안의 링크를 '미분류'로 옮긴 뒤 폴더를 지운다. */
export async function deleteFolder(
  supabase: SupabaseClient,
  id: string,
  uncategorizedId: string,
): Promise<void> {
  const { error: moveError } = await supabase
    .from("links")
    .update({ folder_id: dbId(uncategorizedId) })
    .eq("folder_id", dbId(id));
  if (moveError) fail("링크 이동", moveError);
  const { error } = await supabase.from("folders").delete().eq("id", dbId(id));
  if (error) fail("폴더 삭제", error);
}

/**
 * 링크를 만들고 DB 가 부여한 id 를 돌려준다.
 * @param folderId 서버에 이미 있는 폴더 id (임시 id 는 호출 쪽에서 먼저 바꿔 준다)
 */
export async function insertLink(
  supabase: SupabaseClient,
  userId: string,
  link: Link,
  folderId: string = link.folderId,
): Promise<string> {
  const { data, error } = await supabase
    .from("links")
    .insert(linkRow(userId, link, dbId(folderId)))
    .select("id")
    .single();
  if (error || !data) fail("링크 추가", error);
  return appId((data as { id: number }).id);
}

export async function updateLink(
  supabase: SupabaseClient,
  link: Link,
  folderId: string = link.folderId,
): Promise<void> {
  const { error } = await supabase
    .from("links")
    .update({
      folder_id: dbId(folderId),
      title: link.title,
      description: link.description,
      url: link.url,
      thumbnail_url: link.imageUrl ?? null,
      og_url: link.ogUrl ?? null,
      final_url: link.finalUrl ?? null,
    })
    .eq("id", dbId(link.id));
  if (error) fail("링크 수정", error);
}

export async function deleteLink(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("links").delete().eq("id", dbId(id));
  if (error) fail("링크 삭제", error);
}

export async function moveLink(supabase: SupabaseClient, id: string, folderId: string): Promise<void> {
  const { error } = await supabase
    .from("links")
    .update({ folder_id: dbId(folderId) })
    .eq("id", dbId(id));
  if (error) fail("링크 이동", error);
}

/**
 * localStorage 데이터 가져오기 계획을 실제로 기록한다.
 * 계획 안의 폴더 id 는 임시값이므로, 폴더를 먼저 넣고 돌려받은 id 로 링크의 folder_id 를 바꾼다.
 * (같은 사용자 안에서 폴더 이름은 유일하므로 이름으로 짝을 맞춘다)
 */
export async function applyImport(
  supabase: SupabaseClient,
  userId: string,
  plan: ImportPlan,
  firstSortOrder: number,
): Promise<void> {
  const folderIdMap = new Map<string, string>();

  if (plan.foldersToInsert.length > 0) {
    const { data, error } = await supabase
      .from("folders")
      .insert(
        plan.foldersToInsert.map((f, i) => ({
          user_id: userId,
          name: f.name,
          is_system: false,
          sort_order: firstSortOrder + i,
        })),
      )
      .select("id, name");
    if (error || !data) fail("폴더 가져오기", error);
    const byName = new Map(
      (data as { id: number; name: string }[]).map((r) => [r.name, appId(r.id)] as const),
    );
    for (const f of plan.foldersToInsert) {
      const serverId = byName.get(f.name);
      if (serverId) folderIdMap.set(f.id, serverId);
    }
  }

  if (plan.linksToInsert.length > 0) {
    // 오래된 링크부터 넣어 생성 순서를 비슷하게 유지한다
    const rows = [...plan.linksToInsert].reverse().map((l) => ({
      ...linkRow(userId, l, dbId(folderIdMap.get(l.folderId) ?? l.folderId)),
      created_at: l.createdAt,
      updated_at: l.updatedAt,
    }));
    const { error } = await supabase.from("links").insert(rows);
    if (error) fail("링크 가져오기", error);
  }
}
