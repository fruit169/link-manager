import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import AuthPage from "@/components/AuthPage";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: "로그인",
  description: "이메일 또는 카카오 계정으로 로그인하고 내 링크 보관함을 열어 보세요.",
  path: "/login",
});

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
