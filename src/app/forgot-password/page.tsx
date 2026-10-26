import type { Metadata } from "next";
import { Suspense } from "react";
import AuthPage from "@/components/AuthPage";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata: Metadata = {
  title: "비밀번호 찾기 · 나만의 링크 보관함",
};

export default function ForgotPasswordPage() {
  return (
    <AuthPage>
      {/* ForgotPasswordForm 이 useSearchParams 를 쓰므로 Suspense 로 감싼다 */}
      <Suspense fallback={null}>
        <ForgotPasswordForm />
      </Suspense>
    </AuthPage>
  );
}
