"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useRef, useState, type FormEvent } from "react";
import Toast, { type ToastTone } from "@/components/Toast";
import { friendlyAuthError } from "@/lib/auth-errors";
import { createClient } from "@/utils/supabase/client";

export type AuthMode = "signin" | "signup";

interface AuthFormProps {
  /** 로그인 페이지는 "signin", 회원가입 페이지는 "signup" */
  mode: AuthMode;
}

interface Notice {
  tone: ToastTone;
  text: string;
}

/**
 * 로그인·회원가입 페이지에서 함께 쓰는 폼.
 * - signin: 이메일, 비밀번호, 로그인 버튼, 회원가입 페이지 링크
 * - signup: 이메일, 비밀번호, 비밀번호 확인, 회원가입 버튼, 로그인 페이지 링크
 * 모든 칸을 채워야 버튼이 활성화되고, 오류·안내는 화면 상단 토스트로 보여 준다.
 * 성공하면 인덱스 페이지로 이동한다.
 */
export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const isSignup = mode === "signup";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const busyRef = useRef(false);

  // 소셜 로그인 콜백(/auth/callback)이 실패하면 ?error= 를 붙여 로그인 페이지로 돌려보낸다
  const callbackError = searchParams.get("error");
  const visibleNotice: Notice | null =
    notice ??
    (callbackError
      ? { tone: "error", text: "카카오 로그인에 실패했습니다. 다시 시도해 주세요." }
      : null);

  const closeNotice = useCallback(() => {
    setNotice(null);
    if (callbackError) router.replace(isSignup ? "/signup" : "/login");
  }, [callbackError, isSignup, router]);

  /** 카카오 계정으로 로그인. Supabase가 카카오 인증 후 /auth/callback 으로 돌려보낸다. */
  const handleKakaoLogin = async () => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setNotice(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "kakao",
        options: { redirectTo: `${window.location.origin}/auth/callback?next=/` },
      });
      if (error) {
        setNotice({ tone: "error", text: friendlyAuthError(error.message) });
        busyRef.current = false;
        setBusy(false);
      }
      // 성공하면 카카오 페이지로 이동하므로 busy 를 풀지 않는다
    } catch {
      setNotice({ tone: "error", text: "카카오 로그인을 시작하지 못했습니다. 잠시 후 다시 시도해 주세요." });
      busyRef.current = false;
      setBusy(false);
    }
  };

  // 모든 칸을 채워야 버튼을 누를 수 있다 (회원가입은 비밀번호 확인까지)
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
      {visibleNotice && (
        <Toast
          tone={visibleNotice.tone}
          message={visibleNotice.text}
          onClose={closeNotice}
          duration={visibleNotice.tone === "error" ? 4000 : 0}
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

        <button
          type="submit"
          disabled={busy || !filled}
          className="btn-primary w-full py-3 text-[16px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "잠시만요…" : isSignup ? "회원가입" : "로그인"}
        </button>

        {!isSignup && (
          <button
            type="button"
            onClick={handleKakaoLogin}
            disabled={busy}
            aria-label="카카오 로그인"
            className="block w-full overflow-hidden rounded-[var(--radius-button)] transition hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {/* 카카오 공식 로그인 버튼 이미지 (600x90, 2배 해상도) */}
            <Image
              src="/kakao/kakao_login_large_wide.png"
              alt="카카오 로그인"
              width={600}
              height={90}
              priority
              className="h-auto w-full"
            />
          </button>
        )}
      </form>

      {!isSignup && (
        <p className="mt-5 text-center text-[var(--text-sub-size)]">
          <Link href="/forgot-password" className="font-semibold text-[var(--text-sub)] hover:opacity-80">
            비밀번호를 잊으셨나요?
          </Link>
        </p>
      )}
      <p className={`${isSignup ? "mt-5" : "mt-2"} text-center text-[var(--text-sub-size)] text-[var(--text-sub)]`}>
        {isSignup ? "이미 계정이 있으신가요? " : "아직 계정이 없으신가요? "}
        <Link
          href={isSignup ? "/login" : "/signup"}
          className="font-semibold text-[var(--accent)] hover:opacity-80"
        >
          {isSignup ? "로그인" : "회원가입"}
        </Link>
      </p>
      {isSignup && (
        <p className="mt-3 text-center text-[var(--text-caption)] text-[var(--text-sub)]">
          가입하면{" "}
          <Link href="/privacy" className="font-semibold underline hover:opacity-80">
            개인정보 처리방침
          </Link>
          에 따라 이메일과 비밀번호가 처리됩니다.
        </p>
      )}
    </div>
  );
}
