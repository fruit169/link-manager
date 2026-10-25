import { uncategorizedFolder, type VaultState } from "@/lib/vault";
import type { Folder, Link } from "@/lib/types";

export const folders: Folder[] = [
  { id: "ai", name: "AI 도구" },
  { id: "lecture", name: "강의 자료" },
  { id: "design", name: "디자인" },
  { id: "dev", name: "개발" },
  { id: "etc", name: "기타" },
  uncategorizedFolder,
];

export const sampleLinks: Link[] = [
  {
    id: "1",
    folderId: "ai",
    title: "ChatGPT",
    description:
      "OpenAI의 대화형 AI. 글쓰기, 요약, 아이디어 정리에 활용하는 기본 도구.",
    url: "https://chatgpt.com",
    imageUrl: "/thumbs/chatgpt.svg",
  },
  {
    id: "2",
    folderId: "ai",
    title: "Claude",
    description:
      "Anthropic의 AI 어시스턴트. 긴 문서 분석과 코드 작성에 강점이 있다.",
    url: "https://claude.ai",
  },
  {
    id: "3",
    folderId: "lecture",
    title: "인프런 - 라이프타임 커리어 플랫폼",
    description:
      "프로그래밍, 인공지능, 데이터, 마케팅, 디자인 등 입문부터 실전까지 업계 최고 선배들에게 배우는 온라인 강의.",
    url: "https://www.inflearn.com",
    imageUrl: "/thumbs/inflearn.svg",
  },
  {
    id: "4",
    folderId: "design",
    title: "Canva",
    description:
      "템플릿 기반 온라인 디자인 도구. 발표 자료, 카드뉴스, 포스터를 빠르게 만든다.",
    url: "https://www.canva.com",
    imageUrl: "/thumbs/canva.svg",
  },
  {
    id: "5",
    folderId: "dev",
    title: "Next.js 공식 문서",
    description:
      "App Router, 서버 컴포넌트, 데이터 패칭 등 Next.js의 모든 기능을 다루는 공식 문서.",
    url: "https://nextjs.org/docs",
  },
  {
    id: "6",
    folderId: "etc",
    title: "네이버",
    description: "네이버 메인에서 다양한 정보와 유용한 컨텐츠를 만나 보세요.",
    url: "https://naver.com",
    imageUrl: "/thumbs/naver.svg",
  },
];

/** 저장된 데이터가 없을 때 쓰는 초기 상태. 항상 같은 객체여야 하므로 모듈 상수로 둔다. */
export const seedVault: VaultState = { folders, links: sampleLinks };
