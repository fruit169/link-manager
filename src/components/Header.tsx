interface HeaderProps {
  appName: string;
  onNewLink: () => void;
}

export default function Header({ appName, onNewLink }: HeaderProps) {
  return (
    <header className="sticky top-0 z-10 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-3 px-4 sm:px-6">
        <h1 className="truncate text-lg font-bold text-gray-900">{appName}</h1>
        <div className="flex shrink-0 items-center gap-2">
          <button
            type="button"
            className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
          >
            + 새 폴더
          </button>
          <button
            type="button"
            onClick={onNewLink}
            className="rounded-md bg-blue-500 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-blue-600"
          >
            + 새 링크
          </button>
        </div>
      </div>
    </header>
  );
}
