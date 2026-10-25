import { createBrowserClient } from "@supabase/ssr";
import { getSupabaseEnv } from "@/utils/supabase/env";

/** 클라이언트 컴포넌트("use client")에서 쓰는 Supabase 클라이언트 */
export const createClient = () => {
  const { url, key } = getSupabaseEnv();
  return createBrowserClient(url, key);
};
