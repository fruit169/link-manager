import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "로그인 · 나만의 링크 보관함",
};

export default function LoginPage() {
  return (
    <AuthPage>
      {/* AuthForm 이 useSearchParams 를 쓰므로 Suspense 로 감싼다 */}
      <Suspense fallback={null}>
        <AuthForm mode="signin" />
      </Suspense>
    </AuthPage>
  );
}
