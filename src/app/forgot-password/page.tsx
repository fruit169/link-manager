import { Suspense } from "react";
import AuthPage from "@/components/AuthPage";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: "비밀번호 찾기",
  description: "가입한 이메일로 비밀번호 재설정 링크를 받습니다.",
  path: "/forgot-password",
  noIndex: true,
});

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
