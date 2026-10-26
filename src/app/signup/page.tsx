import type { Metadata } from "next";
import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "회원가입 · 나만의 링크 보관함",
};

export default function SignupPage() {
  return (
    <AuthPage>
      {/* AuthForm 이 useSearchParams 를 쓰므로 Suspense 로 감싼다 */}
      <Suspense fallback={null}>
        <AuthForm mode="signup" />
      </Suspense>
    </AuthPage>
  );
}
