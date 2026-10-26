import Link from "next/link";
import { pageMetadata } from "@/lib/site-metadata";

const SERVICE_NAME = "나만의 링크 보관함";
const OPERATOR_NAME = "생성형AI미래교육";
const CONTACT_EMAIL = "wonfruit1@naver.com";
/** 시행일. 내용을 바꾸면 시행 7일 전에 공지하고 이 날짜를 갱신한다. */
const EFFECTIVE_DATE = "2026-10-26";

export const metadata = pageMetadata({
  title: "개인정보 처리방침",
  description: `${SERVICE_NAME}의 개인정보 처리방침 안내 페이지입니다.`,
  path: "/privacy",
});

const SECTIONS = [
  { id: "s1", title: "개인정보의 처리 목적" },
  { id: "s2", title: "처리하는 개인정보의 항목" },
  { id: "s3", title: "개인정보의 처리 및 보유 기간" },
  { id: "s4", title: "개인정보의 파기 절차 및 방법" },
  { id: "s5", title: "개인정보 처리업무의 위탁" },
  { id: "s6", title: "개인정보의 국외 이전" },
  { id: "s7", title: "정보주체의 권리·의무 및 행사방법" },
  { id: "s8", title: "개인정보의 안전성 확보 조치" },
  { id: "s9", title: "쿠키 운영 및 거부 방법" },
  { id: "s10", title: "개인정보 보호책임자" },
  { id: "s11", title: "권익침해 구제방법" },
  { id: "s12", title: "처리방침의 변경" },
] as const;

const h2Class = "mb-4 text-[var(--text-h2)] font-bold leading-[1.4] text-[var(--text)]";
const h3Class = "mb-2 font-semibold text-[var(--text)]";
const pClass = "leading-[1.7] text-[var(--text)]";
const subClass = "mt-3 text-[var(--text-sub-size)] leading-[1.6] text-[var(--text-sub)]";
const linkClass = "font-semibold text-[var(--accent)] hover:opacity-80";
const thClass = "border-b border-[var(--disabled)] bg-[var(--bg)] px-3 py-2 text-left font-semibold";
const tdClass = "border-b border-[var(--disabled)] px-3 py-2 align-top";

/**
 * 개인정보 처리방침 (개인정보 보호법 제30조).
 * 로그인 없이 누구나 볼 수 있다 (middleware 의 통과 경로).
 * 실제 처리 현황: Supabase(인증·DB, 호주 시드니 리전), Vercel(호스팅), 카카오 로그인, 인증 메일 발송.
 */
export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-[var(--space-page-x)] py-10">
      <article className="card mx-auto w-full max-w-3xl p-6 sm:p-10">
        <header className="mb-10">
          <Link href="/" className={`${linkClass} text-[var(--text-sub-size)]`}>
            ← {SERVICE_NAME}
          </Link>
          <h1 className="mt-4 text-[var(--text-h1)] font-bold leading-[1.3] text-[var(--text)]">
            개인정보 처리방침
          </h1>
          <p className={subClass}>
            시행일: <time dateTime={EFFECTIVE_DATE}>{EFFECTIVE_DATE}</time>
          </p>
        </header>

        <section className="mb-10">
          <p className={pClass}>
            {OPERATOR_NAME}(이하 &quot;운영자&quot;)이 운영하는 {SERVICE_NAME}(이하 &quot;서비스&quot;)은
            정보주체의 자유와 권리 보호를 위해 「개인정보 보호법」 및 관계 법령이 정한 바를 준수하여,
            적법하게 개인정보를 처리하고 안전하게 관리하고 있습니다. 이에 「개인정보 보호법」 제30조에
            따라 정보주체에게 개인정보의 처리와 보호에 관한 절차 및 기준을 안내하고, 이와 관련한
            고충을 신속하고 원활하게 처리할 수 있도록 하기 위하여 다음과 같이 개인정보 처리방침을
            수립·공개합니다.
          </p>
        </section>

        <nav aria-label="목차" className="mb-12 rounded-[var(--radius-button)] bg-[var(--bg)] p-5">
          <h2 className={h3Class}>목차</h2>
          <ol className="list-decimal space-y-1 pl-5 text-[var(--text-sub-size)] leading-[1.6]">
            {SECTIONS.map((s) => (
              <li key={s.id}>
                <a href={`#${s.id}`} className="hover:underline">
                  {s.title}
                </a>
              </li>
            ))}
          </ol>
        </nav>

        <section id="s1" className="mb-10 scroll-mt-20">
          <h2 className={h2Class}>1. 개인정보의 처리 목적</h2>
          <p className={`${pClass} mb-3`}>
            서비스는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적
            이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에
            따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.
          </p>
          <ol className={`${pClass} list-decimal space-y-2 pl-6`}>
            <li>
              <strong>회원 가입 및 관리</strong>
              <br />
              회원 가입 의사 확인, 본인 식별·인증(이메일 또는 카카오 계정), 회원자격 유지·관리, 비밀번호
              재설정, 서비스 부정이용 방지 목적으로 개인정보를 처리합니다.
            </li>
            <li>
              <strong>서비스 제공</strong>
              <br />
              이용자가 저장한 링크와 폴더를 보관·표시·검색하고, 링크 주소의 제목·설명·썸네일을 수집해
              보여 주는 서비스 기능 제공 및 운영을 위하여 개인정보를 처리합니다.
            </li>
            <li>
              <strong>고충 처리</strong>
              <br />
              정보주체의 문의사항 확인 및 사실조사를 위한 연락·통지, 처리결과 통보 목적으로 개인정보를
              처리합니다.
            </li>
          </ol>
        </section>

        <section id="s2" className="mb-10 scroll-mt-20">
          <h2 className={h2Class}>2. 처리하는 개인정보의 항목</h2>
          <div className="mb-4">
            <h3 className={h3Class}>가. 이메일 회원가입 시 수집·이용 항목</h3>
            <ul className={`${pClass} list-disc space-y-1 pl-6`}>
              <li>
                <strong>법적 근거</strong>: 「개인정보 보호법」 제15조제1항제4호(계약 체결·이행)
              </li>
              <li>
                <strong>필수 항목</strong>: 이메일 주소, 비밀번호(단방향 암호화하여 저장, 원문 보관하지
                않음)
              </li>
            </ul>
          </div>
          <div className="mb-4">
            <h3 className={h3Class}>나. 카카오 계정으로 로그인 시 카카오로부터 제공받는 항목</h3>
            <ul className={`${pClass} list-disc space-y-1 pl-6`}>
              <li>
                <strong>법적 근거</strong>: 「개인정보 보호법」 제15조제1항제1호(정보주체의 동의)
              </li>
              <li>
                <strong>항목</strong>: 카카오 계정 이메일 주소, 프로필 닉네임, 프로필 이미지 주소,
                카카오 회원번호
              </li>
            </ul>
          </div>
          <div className="mb-4">
            <h3 className={h3Class}>다. 서비스 이용 과정에서 이용자가 생성하는 항목</h3>
            <p className={pClass}>
              저장한 링크의 주소·제목·설명·썸네일 이미지 주소, 폴더 이름, 저장·수정 일시
            </p>
          </div>
          <div>
            <h3 className={h3Class}>라. 서비스 이용 과정에서 자동 수집되는 항목</h3>
            <p className={pClass}>IP 주소, 쿠키, 서비스 이용 기록, 접속 로그, 브라우저 정보, 기기 정보</p>
          </div>
        </section>

        <section id="s3" className="mb-10 scroll-mt-20">
          <h2 className={h2Class}>3. 개인정보의 처리 및 보유 기간</h2>
          <p className={`${pClass} mb-4`}>
            서비스는 법령에 따른 개인정보 보유·이용기간 또는 정보주체로부터 개인정보를 수집 시에
            동의받은 개인정보 보유·이용기간 내에서 개인정보를 처리·보유합니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[var(--text-sub-size)]">
              <thead>
                <tr>
                  <th className={thClass}>처리 목적</th>
                  <th className={thClass}>보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tdClass}>회원 가입 및 관리</td>
                  <td className={tdClass}>회원 탈퇴 시까지</td>
                </tr>
                <tr>
                  <td className={tdClass}>서비스 제공(저장한 링크·폴더)</td>
                  <td className={tdClass}>이용자가 삭제하거나 회원 탈퇴 시까지</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={subClass}>
            다만, 관계 법령 위반에 따른 수사·조사가 진행 중인 경우 또는 관련 법령에 따른 보존 의무가 있는
            경우에는 해당 기간 종료 시까지 보유합니다.
          </p>
        </section>

        <section id="s4" className="mb-10 scroll-mt-20">
          <h2 className={h2Class}>4. 개인정보의 파기 절차 및 방법</h2>
          <p className={`${pClass} mb-3`}>
            서비스는 개인정보 보유기간의 경과, 처리목적 달성 등 개인정보가 불필요하게 되었을 때에는 지체
            없이 해당 개인정보를 파기합니다.
          </p>
          <ul className={`${pClass} list-disc space-y-2 pl-6`}>
            <li>
              <strong>파기 절차</strong>: 이용자의 회원 탈퇴 요청 또는 보유기간 만료 시 즉시 파기. 회원
              탈퇴 시 해당 회원의 링크·폴더 데이터도 함께 삭제됩니다.
            </li>
            <li>
              <strong>파기 방법</strong>: 전자적 파일은 복구 및 재생이 불가능한 방법으로 영구 삭제
            </li>
          </ul>
        </section>

        <section id="s5" className="mb-10 scroll-mt-20">
          <h2 className={h2Class}>5. 개인정보 처리업무의 위탁</h2>
          <p className={`${pClass} mb-4`}>
            서비스는 원활한 서비스 운영을 위해 다음과 같이 개인정보 처리업무를 위탁하고 있습니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[var(--text-sub-size)]">
              <thead>
                <tr>
                  <th className={thClass}>수탁업체</th>
                  <th className={thClass}>위탁 업무</th>
                  <th className={thClass}>보유·이용 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tdClass}>Supabase Inc.</td>
                  <td className={tdClass}>
                    회원 정보 저장 및 인증 처리, 가입 확인·비밀번호 재설정 메일 발송, 데이터베이스 운영
                  </td>
                  <td className={tdClass}>회원 탈퇴 또는 위탁계약 종료 시까지</td>
                </tr>
                <tr>
                  <td className={tdClass}>Vercel Inc.</td>
                  <td className={tdClass}>웹 서비스 호스팅 및 배포</td>
                  <td className={tdClass}>위탁계약 종료 시까지</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className={subClass}>
            서비스는 「개인정보 보호법」 제26조에 따라 위탁계약 시 개인정보의 안전한 처리를 위한
            기술적·관리적 보호조치, 재위탁 제한, 관리·감독 등 책임에 관한 사항을 계약에 반영하고
            있습니다.
          </p>
        </section>

        <section id="s6" className="mb-10 scroll-mt-20">
          <h2 className={h2Class}>6. 개인정보의 국외 이전</h2>
          <p className={`${pClass} mb-4`}>
            서비스는 「개인정보 보호법」 제28조의8에 따라 다음과 같이 개인정보를 국외에 보관·처리하고
            있습니다. 정보주체는 국외 이전을 원하지 않는 경우 아래 보호책임자 연락처로 이전 거부를
            요청할 수 있으며, 이 경우 서비스 이용이 제한될 수 있습니다.
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-[var(--text-sub-size)]">
              <thead>
                <tr>
                  <th className={thClass}>이전받는 자</th>
                  <th className={thClass}>이전 국가</th>
                  <th className={thClass}>이전 항목</th>
                  <th className={thClass}>이전 일시 및 방법</th>
                  <th className={thClass}>이용 목적 및 보유 기간</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td className={tdClass}>Supabase Inc. (supabase.com)</td>
                  <td className={tdClass}>호주 (시드니 리전)</td>
                  <td className={tdClass}>
                    이메일 주소, 암호화된 비밀번호, 카카오 계정 정보, 저장한 링크·폴더, 접속 로그
                  </td>
                  <td className={tdClass}>서비스 이용 시점에 암호화된 네트워크를 통해 전송·보관</td>
                  <td className={tdClass}>회원 인증 및 데이터베이스 운영 / 회원 탈퇴 시까지</td>
                </tr>
                <tr>
                  <td className={tdClass}>Vercel Inc. (vercel.com)</td>
                  <td className={tdClass}>미국</td>
                  <td className={tdClass}>IP 주소, 접속 로그, 쿠키</td>
                  <td className={tdClass}>서비스 접속 시점에 암호화된 네트워크를 통해 처리</td>
                  <td className={tdClass}>웹 서비스 호스팅 / 위탁계약 종료 시까지</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section id="s7" className="mb-10 scroll-mt-20">
          <h2 className={h2Class}>7. 정보주체의 권리·의무 및 행사방법</h2>
          <p className={`${pClass} mb-3`}>
            정보주체는 서비스에 대해 언제든지 다음과 같은 개인정보 보호 관련 권리를 행사할 수 있습니다.
          </p>
          <ol className={`${pClass} mb-3 list-decimal space-y-1 pl-6`}>
            <li>개인정보 열람 요구</li>
            <li>개인정보 정정·삭제 요구</li>
            <li>개인정보 처리정지 요구</li>
            <li>개인정보 처리에 대한 동의 철회</li>
          </ol>
          <p className={pClass}>
            저장한 링크와 폴더는 서비스 안에서 직접 수정·삭제할 수 있습니다. 그 밖의 권리 행사는{" "}
            <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
              {CONTACT_EMAIL}
            </a>
            로 이메일을 보내 하실 수 있으며, 서비스는 이에 대해 지체 없이 조치하겠습니다.
          </p>
        </section>

        <section id="s8" className="mb-10 scroll-mt-20">
          <h2 className={h2Class}>8. 개인정보의 안전성 확보 조치</h2>
          <ul className={`${pClass} list-disc space-y-2 pl-6`}>
            <li>
              <strong>기술적 조치</strong>: 접근 권한 관리, 비밀번호 단방향 암호화 저장, HTTPS 통신 암호화,
              데이터베이스 행 단위 접근 제어(Row Level Security)로 이용자 본인의 데이터만 접근 가능
            </li>
            <li>
              <strong>관리적 조치</strong>: 개인정보 취급 담당자 최소화, 정기적인 자체 점검
            </li>
            <li>
              <strong>물리적 조치</strong>: 국제 보안 인증(SOC 2 등)을 획득한 클라우드 인프라 활용
            </li>
          </ul>
        </section>

        <section id="s9" className="mb-10 scroll-mt-20">
          <h2 className={h2Class}>9. 개인정보 자동 수집 장치(쿠키)의 설치·운영 및 거부</h2>
          <p className={`${pClass} mb-3`}>
            서비스는 로그인 상태 유지를 위해 쿠키(cookie)를 사용합니다.
          </p>
          <ul className={`${pClass} list-disc space-y-2 pl-6`}>
            <li>
              <strong>사용 목적</strong>: 로그인 세션 유지
            </li>
            <li>
              <strong>거부 방법</strong>: 웹브라우저 설정 &gt; 개인정보 보호 및 보안 메뉴에서 쿠키 저장을
              거부할 수 있습니다. 다만, 쿠키 저장을 거부할 경우 로그인이 필요한 서비스 이용에 어려움이
              있을 수 있습니다.
            </li>
          </ul>
        </section>

        <section id="s10" className="mb-10 scroll-mt-20">
          <h2 className={h2Class}>10. 개인정보 보호책임자</h2>
          <p className={`${pClass} mb-3`}>
            서비스는 개인정보 처리에 관한 업무를 총괄하여 책임지고, 개인정보 처리와 관련한 정보주체의
            불만처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.
          </p>
          <div className={`${pClass} rounded-[var(--radius-button)] bg-[var(--bg)] p-4`}>
            <p>
              <strong>개인정보 보호책임자</strong>: {OPERATOR_NAME}
            </p>
            <p>
              <strong>연락처</strong>:{" "}
              <a href={`mailto:${CONTACT_EMAIL}`} className={linkClass}>
                {CONTACT_EMAIL}
              </a>
            </p>
          </div>
        </section>

        <section id="s11" className="mb-10 scroll-mt-20">
          <h2 className={h2Class}>11. 권익침해 구제방법</h2>
          <p className={`${pClass} mb-3`}>
            정보주체는 개인정보 침해로 인한 구제를 받기 위하여 아래 기관에 분쟁 해결이나 상담 등을 신청할
            수 있습니다.
          </p>
          <ul className={`${pClass} list-disc space-y-1 pl-6`}>
            <li>
              개인정보분쟁조정위원회: (국번없이) 1833-6972 (
              <a href="https://www.kopico.go.kr" target="_blank" rel="noreferrer noopener" className={linkClass}>
                www.kopico.go.kr
              </a>
              )
            </li>
            <li>
              개인정보침해신고센터: (국번없이) 118 (
              <a href="https://privacy.kisa.or.kr" target="_blank" rel="noreferrer noopener" className={linkClass}>
                privacy.kisa.or.kr
              </a>
              )
            </li>
            <li>
              대검찰청: (국번없이) 1301 (
              <a href="https://www.spo.go.kr" target="_blank" rel="noreferrer noopener" className={linkClass}>
                www.spo.go.kr
              </a>
              )
            </li>
            <li>
              경찰청: (국번없이) 182 (
              <a href="https://ecrm.cyber.go.kr" target="_blank" rel="noreferrer noopener" className={linkClass}>
                ecrm.cyber.go.kr
              </a>
              )
            </li>
          </ul>
        </section>

        <section id="s12" className="mb-10 scroll-mt-20">
          <h2 className={h2Class}>12. 개인정보 처리방침의 변경</h2>
          <p className={pClass}>
            이 개인정보 처리방침은 {EFFECTIVE_DATE}부터 적용됩니다. 법령, 정책 또는 보안기술 변경에 따라
            내용이 추가·삭제 및 수정될 경우 변경 사항을 시행일 7일 전부터 서비스 내 공지를 통해
            고지합니다.
          </p>
        </section>

        <footer className={`${subClass} mt-16 border-t border-[var(--disabled)] pt-6`}>
          <p>시행일: {EFFECTIVE_DATE}</p>
        </footer>
      </article>
    </main>
  );
}
