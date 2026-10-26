import type { ReactNode } from "react";

interface AuthPageProps {
  children: ReactNode;
}

/**
 * 로그인·회원가입 페이지의 공통 틀.
 * 로고 텍스트와 소개 문구 아래에 폼을 가운데 배치한다.
 * 앱의 상단 헤더와 좌측 사이드바는 이 페이지에서 쓰지 않는다.
 */
export default function AuthPage({ children }: AuthPageProps) {
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
      {children}
    </main>
  );
}
