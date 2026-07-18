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
    <div className="inline-flex rounded-xl border border-zinc-200 bg-zinc-100 p-1">
      <button
        type="button"
        onClick={() => onChange("regular")}
        className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
          value === "regular"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-800"
        }`}
      >
        通常授業
      </button>

      <button
        type="button"
        onClick={() => onChange("course")}
        className={`rounded-lg px-5 py-2 text-sm font-semibold transition ${
          value === "course"
            ? "bg-white text-zinc-900 shadow-sm"
            : "text-zinc-500 hover:text-zinc-800"
        }`}
      >
        講習
      </button>
    </div>
  );
}