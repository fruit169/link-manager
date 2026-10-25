/** 폴더 고유 ID. 사용자가 만든 폴더는 무작위 ID, 시스템 폴더는 고정 ID를 쓴다. */
export type FolderId = string;

/** 사이드바 필터. "all"은 가상 항목(전체)이고 나머지는 폴더 ID다. */
export type FolderFilter = "all" | FolderId;

export const ALL_FILTER = "all" as const;

/** 폴더 삭제 시 링크가 옮겨지는 시스템 폴더. 이름 변경·삭제 불가. */
export const UNCATEGORIZED_FOLDER_ID = "uncategorized";
export const UNCATEGORIZED_FOLDER_NAME = "미분류";

/** '전체' 가상 항목의 표시 이름. 폴더 이름으로는 쓸 수 없다. */
export const ALL_FILTER_NAME = "전체";

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
