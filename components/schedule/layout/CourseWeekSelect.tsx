import Select from "@/components/common/Select";

import type { CourseWeek } from "@/types/course-week";

type Props = {
  weeks: CourseWeek[];
  value: string;
  onChange: (weekId: string) => void;
};

function formatMonthDay(dateString: string): string {
  const [, month, day] = dateString
    .split("-")
    .map(Number);

  return `${month}/${day}`;
}

function createWeekOptionLabel(
  week: CourseWeek,
): string {
  const startDate = formatMonthDay(week.startDate);
  const endDate = formatMonthDay(week.endDate);

  return `${week.label}（${startDate}〜${endDate}）`;
}

export default function CourseWeekSelect({
  weeks,
  value,
  onChange,
}: Props) {
  if (weeks.length === 0) {
    return (
      <div className="w-full sm:w-72">
        <Select
          label="表示週"
          value=""
          disabled
        >
          <option value="">
            表示できる週がありません
          </option>
        </Select>
      </div>
    );
  }

  return (
    <div className="w-full sm:w-72">
      <Select
        label="表示週"
        value={value}
        onChange={(event) =>
          onChange(event.target.value)
        }
      >
        {weeks.map((week) => (
          <option
            key={week.id}
            value={week.id}
          >
            {createWeekOptionLabel(week)}
          </option>
        ))}
      </Select>
    </div>
  );
}