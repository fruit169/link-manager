import { describe, expect, it } from "vitest";
import {
  addFolder,
  addLink,
  countByFolder,
  deleteFolder,
  deleteLink,
  findDuplicateUrl,
  linksInFilter,
  moveLink,
  normalizeState,
  normalizeUrl,
  renameFolder,
  searchLinks,
  uncategorizedFolder,
  updateLink,
  validateFolderName,
  type VaultState,
} from "@/lib/vault";
import { UNCATEGORIZED_FOLDER_ID } from "@/lib/types";

const T0 = "2026-01-01T00:00:00.000Z";
const T1 = "2026-02-01T00:00:00.000Z";

function makeState(): VaultState {
  return {
    folders: [
      { id: "ai", name: "AI 도구" },
      { id: "dev", name: "개발" },
      uncategorizedFolder,
    ],
    links: [
      { id: "l1", folderId: "ai", title: "ChatGPT", description: "대화형 AI", url: "https://chatgpt.com", createdAt: T0, updatedAt: T0 },
      { id: "l2", folderId: "ai", title: "Claude", description: "", url: "https://claude.ai", createdAt: T0, updatedAt: T0 },
      { id: "l3", folderId: "dev", title: "Next.js", description: "React 프레임워크", url: "https://nextjs.org/docs", createdAt: T0, updatedAt: T0 },
    ],
  };
}

describe("validateFolderName", () => {
  it("빈 이름과 공백만 있는 이름을 거부한다", () => {
    expect(validateFolderName([], "")).toMatchObject({ ok: false });
    expect(validateFolderName([], "   ")).toMatchObject({ ok: false });
  });

  it("앞뒤 공백을 제거한 뒤 중복 이름을 거부한다", () => {
    const folders = makeState().folders;
    expect(validateFolderName(folders, "  AI 도구 ")).toMatchObject({ ok: false });
  });

  it("정상 이름은 공백을 제거해서 돌려준다", () => {
    expect(validateFolderName([], "  디자인 ")).toEqual({ ok: true, value: "디자인" });
  });

  it("'전체'는 예약어라 쓸 수 없다", () => {
    expect(validateFolderName([], "전체")).toMatchObject({ ok: false });
  });

  it("이름 변경 시 자기 자신은 중복으로 보지 않는다", () => {
    const folders = makeState().folders;
    expect(validateFolderName(folders, "AI 도구", "ai")).toEqual({ ok: true, value: "AI 도구" });
  });
});

describe("addFolder", () => {
  it("새 폴더를 추가하되 '미분류'는 항상 마지막에 둔다", () => {
    const result = addFolder(makeState(), "디자인");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const names = result.value.state.folders.map((f) => f.name);
    expect(names).toEqual(["AI 도구", "개발", "디자인", "미분류"]);
    expect(result.value.folder.id).not.toBe("");
  });

  it("중복 이름이면 상태를 바꾸지 않고 오류를 돌려준다", () => {
    const result = addFolder(makeState(), "개발");
    expect(result).toMatchObject({ ok: false });
  });
});

describe("renameFolder", () => {
  it("이름을 바꿔도 링크의 폴더 연결(ID)은 그대로다", () => {
    const result = renameFolder(makeState(), "ai", "인공지능");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.folders.find((f) => f.id === "ai")?.name).toBe("인공지능");
    expect(result.value.links.filter((l) => l.folderId === "ai")).toHaveLength(2);
  });

  it("'미분류'는 이름을 바꿀 수 없다", () => {
    expect(renameFolder(makeState(), UNCATEGORIZED_FOLDER_ID, "기타")).toMatchObject({ ok: false });
  });

  it("없는 폴더는 오류다", () => {
    expect(renameFolder(makeState(), "nope", "이름")).toMatchObject({ ok: false });
  });
});

describe("deleteFolder", () => {
  it("폴더를 지우면 안의 링크는 '미분류'로 옮겨진다", () => {
    const result = deleteFolder(makeState(), "ai");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.folders.map((f) => f.id)).toEqual(["dev", UNCATEGORIZED_FOLDER_ID]);
    expect(result.value.links).toHaveLength(3);
    expect(result.value.links.filter((l) => l.folderId === UNCATEGORIZED_FOLDER_ID)).toHaveLength(2);
  });

  it("'미분류'는 삭제할 수 없다", () => {
    expect(deleteFolder(makeState(), UNCATEGORIZED_FOLDER_ID)).toMatchObject({ ok: false });
  });
});

describe("addLink", () => {
  it("새 링크는 맨 앞에 추가되고 생성·수정일이 찍힌다", () => {
    const next = addLink(
      makeState(),
      { folderId: "dev", title: " GitHub ", description: "", url: " https://github.com ", imageUrl: "" },
      T1,
    );
    expect(next.links[0]).toMatchObject({
      title: "GitHub",
      url: "https://github.com",
      createdAt: T1,
      updatedAt: T1,
    });
    expect(next.links[0].imageUrl).toBeUndefined();
    expect(next.links).toHaveLength(4);
  });

  it("없는 폴더로 추가하면 '미분류'에 들어간다", () => {
    const next = addLink(makeState(), { folderId: "ghost", title: "X", description: "", url: "https://x.com" });
    expect(next.links[0].folderId).toBe(UNCATEGORIZED_FOLDER_ID);
  });
});

describe("updateLink / deleteLink / moveLink", () => {
  it("수정은 같은 ID를 유지하고 생성일은 보존, 수정일만 바꾼다", () => {
    const result = updateLink(
      makeState(),
      "l1",
      { folderId: "dev", title: "ChatGPT 2", description: "d", url: "https://chatgpt.com/new", imageUrl: "https://img/x.png", ogUrl: "https://chatgpt.com/" },
      T1,
    );
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const updated = result.value.links.find((l) => l.id === "l1");
    expect(updated).toMatchObject({
      id: "l1",
      folderId: "dev",
      title: "ChatGPT 2",
      createdAt: T0,
      updatedAt: T1,
      ogUrl: "https://chatgpt.com/",
    });
    expect(result.value.links).toHaveLength(3);
  });

  it("없는 링크 수정은 오류다", () => {
    expect(updateLink(makeState(), "nope", { folderId: "ai", title: "x", description: "", url: "https://x" })).toMatchObject({ ok: false });
  });

  it("삭제는 해당 링크만 지운다", () => {
    const result = deleteLink(makeState(), "l2");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.links.map((l) => l.id)).toEqual(["l1", "l3"]);
  });

  it("이동은 폴더 ID만 바꾸고 개수에 반영된다", () => {
    const result = moveLink(makeState(), "l3", UNCATEGORIZED_FOLDER_ID, T1);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.links.find((l) => l.id === "l3")).toMatchObject({
      folderId: UNCATEGORIZED_FOLDER_ID,
      updatedAt: T1,
    });
    expect(countByFolder(result.value)).toEqual({ all: 3, ai: 2, dev: 0, [UNCATEGORIZED_FOLDER_ID]: 1 });
  });

  it("없는 폴더로는 이동할 수 없다", () => {
    expect(moveLink(makeState(), "l3", "ghost")).toMatchObject({ ok: false });
  });
});

describe("countByFolder / linksInFilter", () => {
  it("폴더별 개수와 전체 개수를 센다", () => {
    expect(countByFolder(makeState())).toEqual({ all: 3, ai: 2, dev: 1, [UNCATEGORIZED_FOLDER_ID]: 0 });
  });

  it("필터에 맞는 링크만 돌려준다", () => {
    expect(linksInFilter(makeState(), "all")).toHaveLength(3);
    expect(linksInFilter(makeState(), "dev").map((l) => l.id)).toEqual(["l3"]);
    expect(linksInFilter(makeState(), UNCATEGORIZED_FOLDER_ID)).toHaveLength(0);
  });
});

describe("searchLinks", () => {
  it("제목·설명·URL에서 대소문자 구분 없이 찾는다", () => {
    const links = makeState().links;
    expect(searchLinks(links, "chatgpt").map((l) => l.id)).toEqual(["l1"]);
    expect(searchLinks(links, "프레임워크").map((l) => l.id)).toEqual(["l3"]);
    expect(searchLinks(links, "NEXTJS.ORG").map((l) => l.id)).toEqual(["l3"]);
    expect(searchLinks(links, "없는말")).toEqual([]);
  });

  it("빈 검색어는 전부 돌려준다", () => {
    expect(searchLinks(makeState().links, "   ")).toHaveLength(3);
  });
});

describe("normalizeUrl / findDuplicateUrl", () => {
  it("끝 슬래시·해시·대소문자 차이를 같은 주소로 본다", () => {
    expect(normalizeUrl("HTTPS://ChatGPT.com/")).toBe("https://chatgpt.com");
    expect(normalizeUrl("https://a.com/p#x")).toBe("https://a.com/p");
    expect(normalizeUrl("https://a.com/p/")).toBe("https://a.com/p/");
  });

  it("같은 주소의 링크를 찾고 자기 자신은 제외한다", () => {
    const links = makeState().links;
    expect(findDuplicateUrl(links, " https://chatgpt.com/ ")?.id).toBe("l1");
    expect(findDuplicateUrl(links, "https://chatgpt.com", "l1")).toBeUndefined();
    expect(findDuplicateUrl(links, "https://new.com")).toBeUndefined();
  });
});

describe("normalizeState (저장 데이터 복구)", () => {
  it("형식이 아예 다르면 null", () => {
    expect(normalizeState(null)).toBeNull();
    expect(normalizeState("x")).toBeNull();
    expect(normalizeState({ folders: "no", links: [] })).toBeNull();
  });

  it("'미분류'가 없으면 추가하고, 없는 폴더를 가리키는 링크는 '미분류'로 옮긴다", () => {
    const state = normalizeState({
      folders: [{ id: "ai", name: "AI" }],
      links: [
        { id: "l1", folderId: "ai", title: "A", url: "https://a.com" },
        { id: "l2", folderId: "deleted", title: "B", url: "https://b.com" },
      ],
    });
    expect(state?.folders.map((f) => f.id)).toEqual(["ai", UNCATEGORIZED_FOLDER_ID]);
    expect(state?.links.find((l) => l.id === "l2")?.folderId).toBe(UNCATEGORIZED_FOLDER_ID);
    expect(state?.links.find((l) => l.id === "l1")?.description).toBe("");
  });

  it("예전 데이터에 썸네일·날짜가 없어도 기본값으로 채운다", () => {
    const state = normalizeState(
      { folders: [], links: [{ id: "l1", folderId: "x", title: "A", url: "https://a.com", imageUrl: "" }] },
      T1,
    );
    expect(state?.links[0]).toMatchObject({ createdAt: T1, updatedAt: T1 });
    expect(state?.links[0].imageUrl).toBeUndefined();
  });

  it("깨진 항목은 버리고 나머지는 살린다", () => {
    const state = normalizeState({
      folders: [{ id: "ai", name: "AI" }, { id: 3 }, null],
      links: [{ id: "l1", folderId: "ai", title: "A", url: "https://a.com" }, { bad: true }],
    });
    expect(state?.folders).toHaveLength(2);
    expect(state?.links).toHaveLength(1);
  });

  it("'미분류'의 이름은 저장값과 무관하게 고정된다", () => {
    const state = normalizeState({
      folders: [{ id: UNCATEGORIZED_FOLDER_ID, name: "엉뚱한 이름" }],
      links: [],
    });
    expect(state?.folders[0].name).toBe("미분류");
  });
});
