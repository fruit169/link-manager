import { normalizeState, type VaultState } from "@/lib/vault";

/**
 * localStorage 읽기/쓰기. 브라우저가 아니거나 저장소를 쓸 수 없으면 조용히 실패한다.
 * 키에 버전을 붙여 두어 나중에 형식이 바뀌어도 기존 데이터를 마이그레이션할 수 있다.
 */
export const STORAGE_KEY = "link-manager.vault.v1";

interface StoredShape {
  version: 1;
  folders: VaultState["folders"];
  links: VaultState["links"];
}

export function loadVault(): VaultState | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return normalizeState(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function saveVault(state: VaultState): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredShape = { version: 1, folders: state.folders, links: state.links };
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch {
    // 용량 초과나 사생활 보호 모드 등: 화면 상태는 유지하고 저장만 건너뛴다
  }
}
