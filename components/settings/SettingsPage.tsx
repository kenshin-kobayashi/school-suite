"use client";

import { useState } from "react";

import PageHeader from "@/components/common/PageHeader";

import CourseSettings from "./CourseSettings";
import RegularSettings from "./RegularSettings";
import ClassroomSettings from "./ClassroomSettings";

export type SettingsMenu =
  | "regular"
  | "courses"
  | "classrooms"
  | "academic-year";

type NavigationItem = {
  value: SettingsMenu;
  label: string;
  description: string;
};

const NAVIGATION_ITEMS: NavigationItem[] = [
  {
    value: "regular",
    label: "通常授業設定",
    description: "曜日・授業ルール・時限",
  },
  {
    value: "courses",
    label: "講習設定",
    description: "春期・夏期・冬期講習",
  },
  {
    value: "classrooms",
    label: "教室設定",
    description: "教室情報の管理",
  },
  {
    value: "academic-year",
    label: "年度更新",
    description: "新年度への更新処理",
  },
];

type ComingSoonProps = {
  title: string;
  description: string;
};

function ComingSoon({
  title,
  description,
}: ComingSoonProps) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8">
      <div className="flex min-h-60 items-center justify-center">
        <div className="max-w-md text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-100 text-xl">
            ⚙️
          </div>

          <h2 className="mt-4 text-lg font-bold text-zinc-900">
            {title}
          </h2>

          <p className="mt-2 text-sm leading-6 text-zinc-500">
            {description}
          </p>

          <span className="mt-4 inline-flex rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold text-zinc-600">
            準備中
          </span>
        </div>
      </div>
    </div>
  );
}

export default function SettingsPage() {
  const [selectedMenu, setSelectedMenu] =
    useState<SettingsMenu>("regular");

  return (
    <div className="space-y-6">
      <PageHeader title="設定" />

      <div className="grid gap-6 lg:grid-cols-[240px_minmax(0,1fr)]">
        <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-3">
          <nav
            aria-label="設定メニュー"
            className="space-y-1"
          >
            {NAVIGATION_ITEMS.map((item) => {
              const isSelected =
                selectedMenu === item.value;

              return (
                <button
                  key={item.value}
                  type="button"
                  onClick={() =>
                    setSelectedMenu(item.value)
                  }
                  className={[
                    "w-full rounded-xl px-4 py-3 text-left transition",
                    isSelected
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100",
                  ].join(" ")}
                >
                  <span className="block text-sm font-semibold">
                    {item.label}
                  </span>

                  <span
                    className={[
                      "mt-1 block text-xs",
                      isSelected
                        ? "text-zinc-300"
                        : "text-zinc-500",
                    ].join(" ")}
                  >
                    {item.description}
                  </span>
                </button>
              );
            })}
          </nav>
        </aside>

        <main className="min-w-0">
          {selectedMenu === "regular" && (
            <RegularSettings />
          )}

         {selectedMenu === "courses" && (
  <CourseSettings />
)}

         {selectedMenu === "classrooms" && (
  <ClassroomSettings />
)}

          {selectedMenu === "academic-year" && (
            <ComingSoon
              title="年度更新"
              description="生徒の学年や年度情報を新年度へ更新する画面です。"
            />
          )}
        </main>
      </div>
    </div>
  );
}