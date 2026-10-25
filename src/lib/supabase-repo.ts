import type { SupabaseClient } from "@supabase/supabase-js";
import { UNCATEGORIZED_FOLDER_NAME, type Folder, type Link } from "@/lib/types";
import type { ImportPlan, VaultState } from "@/lib/vault";

/**
 * Supabase folders / links 테이블 읽기·쓰기.
 * 행(snake_case) ↔ 앱 모델(camelCase) 변환만 하고 업무 규칙은 vault.ts가 맡는다.
 * 모든 쿼리는 RLS 때문에 로그인한 사용자의 행만 다룬다.
 */

interface FolderRow {
  id: string;
  name: string;
  is_system: boolean;
  sort_order: number;
  created_at: string;
}

interface LinkRow {
  id: string;
  folder_id: string | null;
  title: string;
  description: string;
  url: string;
  image_url: string | null;
  og_url: string | null;
  final_url: string | null;
  created_at: string;
  updated_at: string;
}

const FOLDER_COLUMNS = "id, name, is_system, sort_order, created_at";
const LINK_COLUMNS =
  "id, folder_id, title, description, url, image_url, og_url, final_url, created_at, updated_at";

function toFolder(row: FolderRow): Folder {
  return row.is_system
    ? { id: row.id, name: UNCATEGORIZED_FOLDER_NAME, isSystem: true }
    : { id: row.id, name: row.name };
}

function toLink(row: LinkRow, fallbackFolderId: string): Link {
  return {
    id: row.id,
    folderId: row.folder_id ?? fallbackFolderId,
    title: row.title,
    description: row.description ?? "",
    url: row.url,
    imageUrl: row.image_url ?? undefined,
    ogUrl: row.og_url ?? undefined,
    finalUrl: row.final_url ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function linkRow(userId: string, link: Link) {
  return {
    id: link.id,
    user_id: userId,
    folder_id: link.folderId,
    title: link.title,
    description: link.description,
    url: link.url,
    image_url: link.imageUrl ?? null,
    og_url: link.ogUrl ?? null,
    final_url: link.finalUrl ?? null,
  };
}

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

export async function insertFolder(
  supabase: SupabaseClient,
  userId: string,
  folder: Folder,
  sortOrder: number,
): Promise<void> {
  const { error } = await supabase
    .from("folders")
    .insert({ id: folder.id, user_id: userId, name: folder.name, is_system: false, sort_order: sortOrder });
  if (error) fail("폴더 추가", error);
}

export async function renameFolder(supabase: SupabaseClient, id: string, name: string): Promise<void> {
  const { error } = await supabase.from("folders").update({ name }).eq("id", id);
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
    .update({ folder_id: uncategorizedId })
    .eq("folder_id", id);
  if (moveError) fail("링크 이동", moveError);
  const { error } = await supabase.from("folders").delete().eq("id", id);
  if (error) fail("폴더 삭제", error);
}

export async function insertLink(supabase: SupabaseClient, userId: string, link: Link): Promise<void> {
  const { error } = await supabase.from("links").insert(linkRow(userId, link));
  if (error) fail("링크 추가", error);
}

export async function updateLink(supabase: SupabaseClient, link: Link): Promise<void> {
  const { error } = await supabase
    .from("links")
    .update({
      folder_id: link.folderId,
      title: link.title,
      description: link.description,
      url: link.url,
      image_url: link.imageUrl ?? null,
      og_url: link.ogUrl ?? null,
      final_url: link.finalUrl ?? null,
    })
    .eq("id", link.id);
  if (error) fail("링크 수정", error);
}

export async function deleteLink(supabase: SupabaseClient, id: string): Promise<void> {
  const { error } = await supabase.from("links").delete().eq("id", id);
  if (error) fail("링크 삭제", error);
}

export async function moveLink(supabase: SupabaseClient, id: string, folderId: string): Promise<void> {
  const { error } = await supabase.from("links").update({ folder_id: folderId }).eq("id", id);
  if (error) fail("링크 이동", error);
}

/** localStorage 데이터 가져오기 계획을 실제로 기록한다. */
export async function applyImport(
  supabase: SupabaseClient,
  userId: string,
  plan: ImportPlan,
  firstSortOrder: number,
): Promise<void> {
  if (plan.foldersToInsert.length > 0) {
    const { error } = await supabase.from("folders").insert(
      plan.foldersToInsert.map((f, i) => ({
        id: f.id,
        user_id: userId,
        name: f.name,
        is_system: false,
        sort_order: firstSortOrder + i,
      })),
    );
    if (error) fail("폴더 가져오기", error);
  }
  if (plan.linksToInsert.length > 0) {
    // 오래된 링크부터 넣어 생성 순서를 비슷하게 유지한다
    const rows = [...plan.linksToInsert].reverse().map((l) => ({
      ...linkRow(userId, l),
      created_at: l.createdAt,
      updated_at: l.updatedAt,
    }));
    const { error } = await supabase.from("links").insert(rows);
    if (error) fail("링크 가져오기", error);
  }
}
