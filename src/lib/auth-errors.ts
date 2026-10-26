/** Supabase Auth가 돌려주는 영문 오류를 사용자에게 보여 줄 한국어 문장으로 바꾼다 */
export function friendlyAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "이메일 또는 비밀번호가 올바르지 않습니다.";
  if (m.includes("email not confirmed")) return "이메일 인증이 아직 끝나지 않았습니다. 받은 메일의 링크를 눌러 주세요.";
  if (m.includes("user already registered") || m.includes("already been registered"))
    return "이미 가입된 이메일입니다. 로그인해 주세요.";
  if (m.includes("password should be at least")) return "비밀번호는 6자 이상이어야 합니다.";
  if (m.includes("different from the old password")) return "이전과 다른 비밀번호를 입력해 주세요.";
  if (m.includes("invalid email") || m.includes("unable to validate email"))
    return "이메일 형식이 올바르지 않습니다.";
  if (m.includes("rate limit") || m.includes("too many") || m.includes("for security purposes"))
    return "요청이 너무 잦습니다. 잠시 후 다시 시도해 주세요.";
  if (m.includes("auth session missing") || m.includes("session") && m.includes("missing"))
    return "로그인 정보가 없습니다. 비밀번호 리셋 링크를 다시 요청해 주세요.";
  if (m.includes("fetch") || m.includes("network")) return "서버에 연결하지 못했습니다. 네트워크를 확인해 주세요.";
  if (m.includes("signup") && m.includes("disabled")) return "현재 회원가입이 막혀 있습니다. 관리자에게 문의해 주세요.";
  return `처리하지 못했습니다. (${message})`;
}
