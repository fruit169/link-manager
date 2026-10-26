"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState, type FormEvent } from "react";
import Toast, { type ToastTone } from "@/components/Toast";
import { createClient } from "@/utils/supabase/client";

export type AuthMode = "signin" | "signup";

interface AuthFormProps {
  /** 로그인 페이지는 "signin", 회원가입 페이지는 "signup" */
  mode: AuthMode;
}

/** Supabase가 돌려주는 영문 오류를 사용자에게 보여 줄 문장으로 바꾼다 */
function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (m.includes("email not confirmed")) return "이메일 인증이 아직 끝나지 않았습니다. 받은 메일의 링크를 눌러 주세요.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "이미 가입된 이메일입니다. 로그인해 주세요.";
  if (m.includes("password should be at least")) return "비밀번호는 6자 이상이어야 합니다.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "이메일 형식이 올바르지 않습니다.";
  if (m.includes("rate limit") || m.includes("too many")) return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
  if (m.includes("fetch") || m.includes("network")) return "서버에 연결하지 못했습니다. 네트워크를 확인해 주세요.";
  if (m.includes("signup") && m.includes("disabled")) return "현재 회원가입이 막혀 있습니다. 관리자에게 문의해 주세요.";
  return `처리하지 못했습니다. (${message})`;
}

interface Notice {
  tone: ToastTone;
  text: string;
}

/**
 * 로그인·회원가입 페이지에서 함께 쓰는 폼.
 * - signin: 이메일, 비밀번호, 로그인 버튼, 회원가입 페이지 링크. 알림은 폼 안에 보여 준다.
 * - signup: 이메일, 비밀번호, 비밀번호 확인, 회원가입 버튼, 로그인 페이지 링크.
 *           세 칸을 모두 채워야 버튼이 활성화되고, 알림은 화면 상단 토스트로 보여 준다.
 */
export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const busyRef = useRef(false);

  const closeNotice = useCallback(() => setNotice(null), []);

  // 회원가입은 세 칸을 모두 채워야 버튼을 누를 수 있다
  const filled = isSignup
    ? Boolean(email.trim() && password && passwordConfirm)
    : Boolean(email.trim() && password);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busyRef.current) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setNotice({ tone: "error", text: "이메일과 비밀번호를 입력해 주세요." });
      return;
    }
    if (isSignup) {
      if (!passwordConfirm) {
        setNotice({ tone: "error", text: "비밀번호 확인을 입력해 주세요." });
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
    }

    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const supabase = createClient();
      if (!isSignup) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) {
          setNotice({ tone: "error", text: friendlyAuthError(signInError.message) });
          return;
        }
        router.replace("/");
        router.refresh();
        return;
      }

      const { data, error: signUpError } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });
      if (signUpError) {
        setNotice({ tone: "error", text: friendlyAuthError(signUpError.message) });
        return;
      }
      if (data.session) {
        // 가입과 동시에 로그인되면 인덱스 페이지로 간다
        router.replace("/");
        router.refresh();
        return;
      }
      // 이메일 확인이 켜져 있으면 세션이 없어 인덱스 페이지에 들어갈 수 없다. 안내만 한다.
      setNotice({
        tone: "info",
        text: `${trimmedEmail} 로 확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해 주세요.`,
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
      {isSignup && notice && (
        <Toast
          tone={notice.tone}
          message={notice.text}
          onClose={closeNotice}
          duration={notice.tone === "error" ? 4000 : 0}
        />
      )}

      <form onSubmit={handleSubmit} noValidate className="space-y-4" aria-busy={busy}>
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
        <div>
          <label htmlFor="password" className={labelClass}>
            비밀번호
          </label>
          <input
            id="password"
            type="password"
            autoComplete={isSignup ? "new-password" : "current-password"}
            value={password}
            disabled={busy}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={isSignup ? "6자 이상" : "비밀번호"}
            className={inputClass}
          />
        </div>
        {isSignup && (
          <div>
            <label htmlFor="password-confirm" className={labelClass}>
              비밀번호 확인
            </label>
            <input
              id="password-confirm"
              type="password"
              autoComplete="new-password"
              value={passwordConfirm}
              disabled={busy}
              onChange={(e) => setPasswordConfirm(e.target.value)}
              placeholder="비밀번호를 한 번 더 입력"
              className={inputClass}
            />
          </div>
        )}

        {!isSignup && notice && (
          <p
            role={notice.tone === "error" ? "alert" : "status"}
            className={`notice notice-${notice.tone} px-4 py-3 text-[var(--text-sub-size)] leading-[1.5]`}
          >
            {notice.text}
          </p>
        )}

        <button
          type="submit"
          disabled={busy || (isSignup && !filled)}
          className="btn-primary w-full py-3 text-[16px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "잠시만요…" : isSignup ? "회원가입" : "로그인"}
        </button>
      </form>

      <p className="mt-5 text-center text-[var(--text-sub-size)] text-[var(--text-sub)]">
        {isSignup ? "이미 계정이 있으신가요? " : "아직 계정이 없으신가요? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-[var(--accent)] hover:opacity-80"
        >
          {isSignup ? "로그인" : "회원가입"}
        </Link>
      </p>
    </div>
  );
}
