import type { ScheduleMode } from "./ScheduleModeToggle";

type ScheduleHeaderProps = {
  mode: ScheduleMode;
};

export default function ScheduleHeader({
  mode,
}: ScheduleHeaderProps) {
  const description =
    mode === "regular"
      ? "毎週繰り返す通常授業の時間割を確認・管理します。"
      : "講習期間の日付ごとの時間割を確認・管理します。";

  return (
    <div>
      <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
        スケジュール
      </h1>

      <p className="mt-2 text-sm text-zinc-500">
        {description}
      </p>
    </div>
  );
}