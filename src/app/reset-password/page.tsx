import type { Metadata } from "next";
import AuthPage from "@/components/AuthPage";
import ResetPasswordForm from "@/components/ResetPasswordForm";

export const metadata: Metadata = {
  title: "비밀번호 재설정 · 나만의 링크 보관함",
};

export default function ResetPasswordPage() {
  return (
    <AuthPage>
      <ResetPasswordForm />
    </AuthPage>
  );
}
