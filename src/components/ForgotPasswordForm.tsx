"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, type FormEvent } from "react";
import Toast, { type ToastTone } from "@/components/Toast";
import { friendlyAuthError } from "@/lib/auth-errors";
import { createClient } from "@/utils/supabase/client";

interface Notice {
  tone: ToastTone;
  text: string;
}

/**
 * 비밀번호 찾기 폼. 이메일을 받아 비밀번호 리셋 링크를 보낸다.
 * 링크는 /auth/callback 을 거쳐 /reset-password 로 이어진다.
 */
export default function ForgotPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const busyRef = useRef(false);

  // /auth/callback 이 링크 검증에 실패하면 ?error= 를 붙여 이리로 보낸다
  const linkError = searchParams.get("error");
  const visibleNotice: Notice | null =
    notice ??
    (linkError
      ? { tone: "error", text: "링크가 만료되었거나 올바르지 않습니다. 리셋 링크를 다시 요청해 주세요." }
      : null);

  const closeNotice = useCallback(() => {
    setNotice(null);
    if (linkError) router.replace("/forgot-password");
  }, [linkError, router]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busyRef.current) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setNotice({ tone: "error", text: "이메일을 입력해 주세요." });
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(trimmedEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/reset-password`,
      });
      if (error) {
        setNotice({ tone: "error", text: friendlyAuthError(error.message) });
        return;
      }
      setSent(true);
      setNotice({
        tone: "info",
        text: `${trimmedEmail} 로 비밀번호 리셋 링크를 보냈습니다. 메일의 링크를 눌러 새 비밀번호를 설정해 주세요.`,
      });
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const inputClass = "input-field w-full bg-[var(--card-bg)] px-4 py-3 text-[16px] disabled:opacity-60";
  const labelClass = "mb-1.5 block text-[var(--text-sub-size)] font-semibold text-[var(--text)]";

  return (
    <div className="card w-full max-w-sm p-6">
      {visibleNotice && (
        <Toast
          tone={visibleNotice.tone}
          message={visibleNotice.text}
          onClose={closeNotice}
          duration={visibleNotice.tone === "error" ? 4000 : 0}
        />
      )}

      <h2 className="text-[var(--text-h2)] font-bold leading-[1.4] text-[var(--text)]">비밀번호 찾기</h2>
      <p className="mt-2 text-[var(--text-sub-size)] leading-[1.5] text-[var(--text-sub)]">
        가입한 이메일을 입력하면 비밀번호를 다시 설정할 수 있는 링크를 보내 드립니다.
      </p>

      <form onSubmit={handleSubmit} noValidate className="mt-5 space-y-4" aria-busy={busy}>
        <div>
          <label htmlFor="email" className={labelClass}>
            이메일
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            autoFocus
            value={email}
            disabled={busy}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className={inputClass}
          />
        </div>

        <button
          type="submit"
          disabled={busy || !email.trim()}
          className="btn-primary w-full py-3 text-[16px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "보내는 중…" : sent ? "리셋 링크 다시 발송" : "비밀번호 리셋 링크 발송"}
        </button>
      </form>

      <p className="mt-5 text-center text-[var(--text-sub-size)] text-[var(--text-sub)]">
        <Link href="/login" className="font-semibold text-[var(--accent)] hover:opacity-80">
          로그인으로 돌아가기
        </Link>
      </p>
    </div>
  );
}
