import AuthPage from "@/components/AuthPage";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { pageMetadata } from "@/lib/site-metadata";

export const metadata = pageMetadata({
  title: "비밀번호 재설정",
  description: "새 비밀번호를 설정합니다.",
  path: "/reset-password",
  noIndex: true,
});

export default function ResetPasswordPage() {
  return (
    <AuthPage>
      <ResetPasswordForm />
    </AuthPage>
  );
}
