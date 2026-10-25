"use client";

import { useState, type FormEvent } from "react";
import Dialog from "@/components/Dialog";
import type { Folder, FolderId, Link } from "@/lib/types";

interface MoveLinkDialogProps {
  link: Link;
  folders: Folder[];
  onClose: () => void;
  onMove: (folderId: FolderId) => void;
}

/** 링크를 다른 폴더(또는 '미분류')로 옮기는 선택창 */
export default function MoveLinkDialog({ link, folders, onClose, onMove }: MoveLinkDialogProps) {
  const [folderId, setFolderId] = useState<FolderId>(link.folderId);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    onMove(folderId);
  };

  return (
    <Dialog titleId="move-link-title" onClose={onClose}>
      <h2
        id="move-link-title"
        className="text-[var(--text-h2)] font-bold leading-[1.4] text-[var(--text)]"
      >
        폴더 이동
      </h2>
      <p className="mt-2 truncate text-[var(--text-sub-size)] text-[var(--text-sub)]">
        {link.title}
      </p>
      <form onSubmit={handleSubmit} className="mt-5 space-y-4">
        <div>
          <label
            htmlFor="move-folder"
            className="mb-1.5 block text-[var(--text-sub-size)] font-semibold text-[var(--text)]"
          >
            옮길 폴더
          </label>
          <select
            id="move-folder"
            autoFocus
            value={folderId}
            onChange={(e) => setFolderId(e.target.value)}
            className="input-field w-full px-4 py-3 text-[16px]"
          >
            {folders.map((folder) => (
              <option key={folder.id} value={folder.id}>
                {folder.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary px-5 py-2.5 text-[15px]">
            취소
          </button>
          <button
            type="submit"
            disabled={folderId === link.folderId}
            className="btn-primary px-5 py-2.5 text-[15px] disabled:cursor-not-allowed disabled:opacity-50"
          >
            이동
          </button>
        </div>
      </form>
    </Dialog>
  );
}
