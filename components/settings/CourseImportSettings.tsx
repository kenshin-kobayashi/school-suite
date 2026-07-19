"use client";

import SettingSection from "@/components/settings/SettingSection";

type Props = {
  value: boolean;
  onChange: (value: boolean) => void;
};

export default function CourseImportSettings({
  value,
  onChange,
}: Props) {
  return (
    <SettingSection title="通常授業の引き継ぎ">
      <label className="flex cursor-pointer items-center gap-3 rounded-xl border border-zinc-200 bg-white p-4 transition hover:bg-zinc-50">
        <input
          type="checkbox"
          checked={value}
          onChange={(event) =>
            onChange(event.target.checked)
          }
          className="h-4 w-4 rounded border-zinc-300 text-zinc-900 focus:ring-zinc-400"
        />

        <span className="text-sm font-semibold text-zinc-900">
          講習開始時に通常授業をコピーする
        </span>
      </label>
    </SettingSection>
  );
}