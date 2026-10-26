interface HeaderProps {
  appName: string;
  userEmail: string | null;
  onNewFolder: () => void;
  onNewLink: () => void;
  onSignOut: () => void;
}

export default function Header({ appName, userEmail, onNewFolder, onNewLink, onSignOut }: HeaderProps) {
  return (
    <header className="nav-bar sticky top-0 z-10">
      <div className="mx-auto flex h-[var(--nav-height)] max-w-7xl items-center justify-between gap-3 px-[var(--space-page-x)]">
        <h1 className="truncate text-[var(--text-h2)] font-bold leading-[1.4] text-[var(--text)]">
          {appName}
        </h1>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            onClick={onNewFolder}
            className="btn-secondary px-3 py-2 text-[14px] sm:px-4 sm:text-[15px]"
          >
            + 새 폴더
          </button>
          <button
            type="button"
            onClick={onNewLink}
            className="btn-primary px-3 py-2 text-[14px] sm:px-4 sm:text-[15px]"
          >
            + 새 링크
          </button>
          {/* 모바일 전용 로그아웃. 데스크톱에서는 좌측 사이드바 맨 아래 버튼을 쓴다. */}
          {userEmail !== null && (
            <div className="ml-1 flex items-center border-l border-[var(--disabled)] pl-3 md:hidden">
              <button
                type="button"
                onClick={onSignOut}
                className="link-inline text-[14px] font-semibold text-[var(--text-sub)]"
              >
                로그아웃
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
