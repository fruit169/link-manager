/** 폴더 고유 ID. DB에서는 int8 을 문자열로 바꾼 값, 저장 전 임시 항목과 예전 localStorage 데이터에서는 uuid 등 임의 문자열이다. */
export type FolderId = string;

/** 사이드바 필터. "all"은 가상 항목(전체)이고 나머지는 폴더 ID다. */
export type FolderFilter = "all" | FolderId;

export const ALL_FILTER = "all" as const;

/** localStorage 시절 '미분류' 폴더의 고정 ID. DB에서는 사용자별 int8 id 를 쓴다. */
export const UNCATEGORIZED_FOLDER_ID = "uncategorized";
export const UNCATEGORIZED_FOLDER_NAME = "미분류";

/** '전체' 가상 항목의 표시 이름. 폴더 이름으로는 쓸 수 없다. */
export const ALL_FILTER_NAME = "전체";

export interface Folder {
  id: FolderId;
  name: string;
  /** '미분류'처럼 이름 변경·삭제가 안 되는 시스템 폴더 */
  isSystem?: boolean;
}

export interface Link {
  id: string;
  folderId: FolderId;
  title: string;
  description: string;
  /** 사용자가 입력한 링크 주소 */
  url: string;
  /** 썸네일 이미지 주소. 없으면 카드에 대체 화면을 보여준다. */
  imageUrl?: string;
  /** 페이지가 선언한 og:url (있을 때만) */
  ogUrl?: string;
  /** 리다이렉트를 따라간 최종 응답 주소 (입력 URL과 다를 때만) */
  finalUrl?: string;
  /** ISO 8601 */
  createdAt: string;
  /** ISO 8601 */
  updatedAt: string;
}

/** 링크 추가·수정 시 입력하는 값. id와 날짜는 스토어가 채운다. */
export type LinkInput = Omit<Link, "id" | "createdAt" | "updatedAt">;

/** 로그인한 사용자 */
export interface AppUser {
  id: string;
  email: string;
}
