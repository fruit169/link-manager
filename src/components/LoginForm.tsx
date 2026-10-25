"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, type FormEvent } from "react";
import { createClient } from "@/utils/supabase/client";

type Mode = "signin" | "signup";

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
  return `처리하지 못했습니다. (${message})`;
}

export default function LoginForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const busyRef = useRef(false);

  const switchMode = (next: Mode) => {
    setMode(next);
    setError(null);
    setInfo(null);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (busyRef.current) return;
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) {
      setError("이메일과 비밀번호를 입력해 주세요.");
      return;
    }
    if (mode === "signup" && password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다.");
      return;
    }

    busyRef.current = true;
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      const supabase = createClient();
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });
        if (signInError) {
          setError(friendlyAuthError(signInError.message));
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
        setError(friendlyAuthError(signUpError.message));
        return;
      }
      if (data.session) {
        // 이메일 확인이 꺼져 있으면 바로 로그인된다
        router.replace("/");
        router.refresh();
        return;
      }
      setInfo(`${trimmedEmail} 로 확인 메일을 보냈습니다. 메일의 링크를 누른 뒤 로그인해 주세요.`);
      setMode("signin");
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  };

  const inputClass = "input-field w-full bg-[var(--card-bg)] px-4 py-3 text-[16px] disabled:opacity-60";
  const labelClass = "mb-1.5 block text-[var(--text-sub-size)] font-semibold text-[var(--text)]";

  return (
    <div className="card w-full max-w-sm p-6">
      <div className="mb-5 flex gap-1 rounded-[var(--radius-button)] bg-[var(--bg)] p-1" role="tablist">
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={`flex-1 rounded-[10px] py-2 text-[15px] font-semibold transition ${
              mode === m ? "tab-active" : "text-[var(--text-sub)]"
            }`}
          >
            {m === "signin" ? "로그인" : "회원가입"}
          </button>
        ))}
      </div>

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
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            value={password}
            disabled={busy}
            onChange={(e) => setPassword(e.target.value)}
            placeholder={mode === "signup" ? "6자 이상" : "비밀번호"}
            className={inputClass}
          />
        </div>

        {error && (
          <p role="alert" className="notice notice-error px-4 py-3 text-[var(--text-sub-size)] leading-[1.5]">
            {error}
          </p>
        )}
        {info && (
          <p role="status" className="notice notice-info px-4 py-3 text-[var(--text-sub-size)] leading-[1.5]">
            {info}
          </p>
        )}

        <button
          type="submit"
          disabled={busy}
          className="btn-primary w-full py-3 text-[16px] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {busy ? "잠시만요…" : mode === "signin" ? "로그인" : "회원가입"}
        </button>
      </form>
    </div>
  );
}
