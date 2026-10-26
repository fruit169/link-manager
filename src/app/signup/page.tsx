import { Suspense } from "react";
import AuthForm from "@/components/AuthForm";
import AuthPage from "@/components/AuthPage";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: "회원가입",
  description: "이메일로 가입하고 자주 쓰는 링크를 폴더별로 정리해 보세요.",
  path: "/signup",
});

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
