import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "나만의 링크 보관함",
  description: "자주 쓰는 링크를 폴더별로 정리하는 링크 보관함",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col bg-gray-50 text-gray-900">
        {children}
      </body>
    </html>
  );
}
