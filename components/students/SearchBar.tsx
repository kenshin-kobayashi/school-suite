"use client";

import { Search, Plus } from "lucide-react";
import PrimaryButton from "@/components/common/PrimaryButton";

type Props = {
  search: string;
  onSearchChange: (value: string) => void;

  grade: string;
  onGradeChange: (value: string) => void;

  status: string;
  onStatusChange: (value: string) => void;

  onAddStudent: () => void;
};

const grades = [
  "すべて",
  "小学1年",
  "小学2年",
  "小学3年",
  "小学4年",
  "小学5年",
  "小学6年",
  "中学1年",
  "中学2年",
  "中学3年",
  "高校1年",
  "高校2年",
  "高校3年",
  "既卒",
];

const statuses = [
  "在籍",
  "休塾",
  "退塾",
  "すべて",
];

export default function SearchBar({
  search,
  onSearchChange,
  grade,
  onGradeChange,
  status,
  onStatusChange,
  onAddStudent,
}: Props) {
  return (
    <div className="space-y-6">
      {/* 検索 */}
      <div className="relative max-w-2xl">
        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-zinc-500" />

        <input
          type="text"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder="生徒番号・氏名・学校名で検索..."
          className="h-12 w-full rounded-2xl border border-zinc-200 bg-white pl-12 pr-4 text-[15px] font-medium text-zinc-800 shadow-sm outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
        />
      </div>

      {/* フィルター・追加ボタン */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap gap-4">
          <select
            value={grade}
            onChange={(e) => onGradeChange(e.target.value)}
            className="h-12 w-44 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm outline-none transition-all focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
          >
            {grades.map((grade) => (
              <option key={grade} value={grade}>
                {grade}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => onStatusChange(e.target.value)}
            className="h-12 w-44 rounded-2xl border border-zinc-200 bg-white px-4 text-sm font-medium text-zinc-800 shadow-sm outline-none transition-all focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
          >
            {statuses.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>

        <PrimaryButton onClick={onAddStudent}>
          <Plus className="h-5 w-5" />
          生徒を追加
        </PrimaryButton>
      </div>
    </div>
  );
}