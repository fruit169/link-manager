export type FolderId = "ai" | "lecture" | "design" | "dev" | "etc";

export type FolderFilter = FolderId | "all";

export interface Folder {
  id: FolderId;
  name: string;
}

export interface Link {
  id: string;
  folderId: FolderId;
  title: string;
  description: string;
  url: string;
  /** 미리보기 이미지. 없으면 카드에 대체 화면을 보여준다. */
  imageUrl?: string;
}
