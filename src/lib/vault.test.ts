import { describe, expect, it } from "vitest";
import {
  addFolder,
  addLink,
  countByFolder,
  deleteFolder,
  linksInFilter,
  normalizeState,
  renameFolder,
  uncategorizedFolder,
  validateFolderName,
  type VaultState,
} from "@/lib/vault";
import { UNCATEGORIZED_FOLDER_ID } from "@/lib/types";

function makeState(): VaultState {
  return {
    folders: [
      { id: "ai", name: "AI 도구" },
      { id: "dev", name: "개발" },
      uncategorizedFolder,
    ],
    links: [
      { id: "l1", folderId: "ai", title: "ChatGPT", description: "", url: "https://chatgpt.com" },
      { id: "l2", folderId: "ai", title: "Claude", description: "", url: "https://claude.ai" },
      { id: "l3", folderId: "dev", title: "Next.js", description: "", url: "https://nextjs.org" },
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

describe("addLink / countByFolder / linksInFilter", () => {
  it("새 링크는 맨 앞에 추가된다", () => {
    const next = addLink(makeState(), {
      folderId: "dev",
      title: "GitHub",
      description: "",
      url: "https://github.com",
    });
    expect(next.links[0].title).toBe("GitHub");
    expect(next.links).toHaveLength(4);
  });

  it("없는 폴더로 추가하면 '미분류'에 들어간다", () => {
    const next = addLink(makeState(), {
      folderId: "ghost",
      title: "X",
      description: "",
      url: "https://x.com",
    });
    expect(next.links[0].folderId).toBe(UNCATEGORIZED_FOLDER_ID);
  });

  it("폴더별 개수와 전체 개수를 센다", () => {
    const counts = countByFolder(makeState());
    expect(counts).toEqual({ all: 3, ai: 2, dev: 1, [UNCATEGORIZED_FOLDER_ID]: 0 });
  });

  it("필터에 맞는 링크만 돌려준다", () => {
    expect(linksInFilter(makeState(), "all")).toHaveLength(3);
    expect(linksInFilter(makeState(), "dev").map((l) => l.id)).toEqual(["l3"]);
    expect(linksInFilter(makeState(), UNCATEGORIZED_FOLDER_ID)).toHaveLength(0);
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
