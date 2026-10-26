import type { Metadata } from "next";
import AuthForm from "@/components/AuthForm";
import AuthPage from "@/components/AuthPage";

export const metadata: Metadata = {
  title: "로그인 · 나만의 링크 보관함",
};

export default function LoginPage() {
  return (
    <AuthPage>
      <AuthForm mode="signin" />
    </AuthPage>
  );
}
