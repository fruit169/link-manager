import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "회원가입 · 나만의 링크 보관함",
};

export default function SignupPage() {
  return (
    <AuthPage>
      <AuthForm mode="signup" />
    </AuthPage>
  );
}
