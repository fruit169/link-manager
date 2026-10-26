"use client";

import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type FormEvent } from "react";
import Toast, { type ToastTone } from "@/components/Toast";
import { friendlyAuthError } from "@/lib/auth-errors";
import { createClient } from "@/utils/supabase/client";

interface Notice {
  tone: ToastTone;
  text: string;
}

/**
 * 새 비밀번호 설정 폼. 메일의 리셋 링크로 들어와 세션이 있는 상태에서 쓴다.
 * 두 칸을 모두 채워야 버튼이 활성화되고, 저장이 끝나면 인덱스 페이지로 간다.
 */
export default function ResetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const busyRef = useRef(false);

  const closeNotice = useCallback(() => setNotice(null), []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busyRef.current) return;
    if (!password || !passwordConfirm) {
      setNotice({ tone: "error", text: "새 비밀번호와 비밀번호 확인을 입력해 주세요." });
      return;
    }
    if (password.length < 6) {
      setNotice({ tone: "error", text: "비밀번호는 6자 이상이어야 합니다." });
      return;
    }
    if (password !== passwordConfirm) {
      setNotice({ tone: "error", text: "비밀번호가 일치하지 않습니다." });
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });
      if (error) {
        setNotice({ tone: "error", text: friendlyAuthError(error.message) });
        return;
      }
      setNotice({ tone: "info", text: "비밀번호를 다시 설정했습니다." });
      router.replace("/");
      router.refresh();
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const inputClass = "input-field w-full bg-[var(--card-bg)] px-4 py-3 text-[16px] disabled:opacity-60";
  const labelClass = "mb-1.5 block text-[var(--text-sub-size)] font-semibold text-[var(--text)]";

  return (
    <div className="card w-full max-w-sm p-6">
      {notice && (
        <Toast
          tone={notice.tone}
          message={notice.text}
          onClose={closeNotice}
          duration={notice.tone === "error" ? 4000 : 0}
        />
      )}

      <h2 className="text-[var(--text-h2)] font-bold leading-[1.4] text-[var(--text)]">비밀번호 재설정</h2>
      <p className="mt-2 text-[var(--text-sub-size)] leading-[1.5] text-[var(--text-sub)]">
        새로 사용할 비밀번호를 입력해 주세요.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4" aria-busy={busy}>
        <div>
          <label htmlFor="new-password" className={labelClass}>
            새 비밀번호
          </label>
          <input
            id="new-password"
            type="password"
            autoComplete="new-password"
            autoFocus
            value={password}
            disabled={busy}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="6자 이상"
            className={inputClass}
          />
        </div>
        <div>
          <label htmlFor="new-password-confirm" className={labelClass}>
            새 비밀번호 확인
          </label>
          <input
            id="new-password-confirm"
            type="password"
            autoComplete="new-password"
            value={passwordConfirm}
            disabled={busy}
            onChange={(e) => setPasswordConfirm(e.target.value)}
            placeholder="비밀번호를 한 번 더 입력"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={busy || !password || !passwordConfirm}
          className="btn-primary w-full py-3 text-[16px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "저장하는 중…" : "비밀번호 재설정"}
        </button>
      </form>
    </div>
  );
}
