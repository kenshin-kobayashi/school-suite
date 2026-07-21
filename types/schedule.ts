export type ScheduleMode =
  | "regular"
  | "course";

export type Weekday =
  | "monday"
  | "tuesday"
  | "wednesday"
  | "thursday"
  | "friday"
  | "saturday"
  | "sunday";

export type ScheduleColumn = {
  id: string;
  label: string;
  subLabel?: string;
  isHoliday?: boolean;
};

export type SchedulePeriod = {
  id: string;
  label: string;
  time: string;
};