import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "로그인 · 나만의 링크 보관함",
};

export default function LoginPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-[var(--bg)] px-[var(--space-page-x)] py-10">
      <div className="mb-6 text-center">
        <h1 className="text-[var(--text-h1)] font-bold leading-[1.3] text-[var(--text)]">
          나만의 링크 보관함
        </h1>
        <p className="mt-2 text-[var(--text-sub-size)] text-[var(--text-sub)]">
          자주 쓰는 링크를 폴더별로 정리하고 어디서나 열어 보세요.
        </p>
      </div>
      <LoginForm />
    </main>
  );
}
