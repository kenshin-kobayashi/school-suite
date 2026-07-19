"use client";

export type ScheduleMode = "regular" | "course";

type ScheduleModeToggleProps = {
  value: ScheduleMode;
  onChange: (mode: ScheduleMode) => void;
};

export default function ScheduleModeToggle({
  value,
  onChange,
}: ScheduleModeToggleProps) {
  return (
    <div
      role="tablist"
      aria-label="スケジュール表示切り替え"
      className="inline-flex rounded-xl border border-zinc-200 bg-zinc-100 p-1"
    >
      <button
        type="button"
        role="tab"
        aria-selected={value === "regular"}
        onClick={() => onChange("regular")}
        className={`min-w-28 rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
          value === "regular"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:bg-white/50 hover:text-zinc-800"
        }`}
      >
        通常授業
      </button>

      <button
        type="button"
        role="tab"
        aria-selected={value === "course"}
        onClick={() => onChange("course")}
        className={`min-w-28 rounded-lg px-5 py-2 text-sm font-semibold transition-all ${
          value === "course"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:bg-white/50 hover:text-zinc-800"
        }`}
      >
        講習
      </button>
    </div>
  );
}