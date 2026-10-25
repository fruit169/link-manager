"use client";

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  /** 검색 범위 안내 (예: '전체' 또는 폴더 이름) */
  scopeName: string;
}

export default function SearchBar({ value, onChange, scopeName }: SearchBarProps) {
  return (
    <div className="relative">
      <label htmlFor="link-search" className="sr-only">
        링크 검색
      </label>
      <input
        id="link-search"
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={`${scopeName}에서 제목·설명·URL 검색`}
        autoComplete="off"
        className="input-field search-input w-full bg-[var(--card-bg)] py-3 pl-4 pr-11 text-[15px]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          aria-label="검색어 지우기"
          className="icon-btn absolute right-2 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center text-[18px] leading-none"
        >
          ×
        </button>
      )}
    </div>
  );
}
