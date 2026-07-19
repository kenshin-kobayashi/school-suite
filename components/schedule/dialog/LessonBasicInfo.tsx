import type { ScheduleCellPosition } from "@/types/schedule-cell";

type LessonBasicInfoProps = {
  position: ScheduleCellPosition;
};

const weekdayLabels: Record<string, string> = {
  monday: "月曜日",
  tuesday: "火曜日",
  wednesday: "水曜日",
  thursday: "木曜日",
  friday: "金曜日",
  saturday: "土曜日",
  sunday: "日曜日",
};

function isDateColumn(columnId: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(columnId);
}

function formatDate(dateString: string): string {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  const date = new Date(year, month - 1, day);

  const weekday = new Intl.DateTimeFormat("ja-JP", {
    weekday: "short",
  }).format(date);

  return `${year}年${month}月${day}日（${weekday}）`;
}

function formatPeriod(periodId: string): string {
  const periodNumber = periodId.replace(
    "period-",
    "",
  );

  return `${periodNumber}限`;
}

export default function LessonBasicInfo({
  position,
}: LessonBasicInfoProps) {
  const columnLabel = isDateColumn(position.columnId)
    ? formatDate(position.columnId)
    : weekdayLabels[position.columnId] ??
      position.columnId;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
      <p className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
        授業日時
      </p>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-zinc-400">
            日付・曜日
          </p>

          <p className="mt-1 text-sm font-semibold text-zinc-800">
            {columnLabel}
          </p>
        </div>

        <div className="rounded-xl bg-white px-4 py-3 shadow-sm">
          <p className="text-xs font-medium text-zinc-400">
            時限
          </p>

          <p className="mt-1 text-sm font-semibold text-zinc-800">
            {formatPeriod(position.periodId)}
          </p>
        </div>
      </div>
    </div>
  );
}