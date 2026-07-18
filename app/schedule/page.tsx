"use client";

import { useMemo, useState } from "react";

import {
  ScheduleGrid,
  ScheduleHeader,
  ScheduleModeToggle,
} from "@/components/schedule";

import type {
  ScheduleColumn,
  ScheduleMode,
  SchedulePeriod,
} from "@/components/schedule";

import type { Lesson } from "@/types/lesson";

const regularColumns: ScheduleColumn[] = [
  { id: "monday", label: "月曜日" },
  { id: "tuesday", label: "火曜日" },
  { id: "wednesday", label: "水曜日" },
  { id: "thursday", label: "木曜日" },
  { id: "friday", label: "金曜日" },
  { id: "saturday", label: "土曜日" },
];

const courseColumns: ScheduleColumn[] = [
  { id: "2026-07-21", label: "7月21日", subLabel: "火曜日" },
  { id: "2026-07-22", label: "7月22日", subLabel: "水曜日" },
  { id: "2026-07-23", label: "7月23日", subLabel: "木曜日" },
  { id: "2026-07-24", label: "7月24日", subLabel: "金曜日" },
  { id: "2026-07-25", label: "7月25日", subLabel: "土曜日" },
];

const periods: SchedulePeriod[] = [
  {
    id: "period-1",
    label: "1限",
    time: "13:00〜14:20",
  },
  {
    id: "period-2",
    label: "2限",
    time: "14:30〜15:50",
  },
  {
    id: "period-3",
    label: "3限",
    time: "16:00〜17:20",
  },
  {
    id: "period-4",
    label: "4限",
    time: "17:30〜18:50",
  },
  {
    id: "period-5",
    label: "5限",
    time: "19:00〜20:20",
  },
];

const sampleLessons: Record<string, Lesson[]> = {
  "monday-period-1": [
    {
      id: "lesson-1",
      teacherId: "teacher-1",
      teacherName: "田中先生",
      students: [
        {
          studentId: "student-1",
          studentName: "佐藤 花子",
          subject: "英語",
        },
        {
          studentId: "student-2",
          studentName: "鈴木 太郎",
          subject: "数学",
        },
      ],
    },
    {
      id: "lesson-2",
      teacherId: "teacher-2",
      teacherName: "山田先生",
      students: [
        {
          studentId: "student-3",
          studentName: "伊藤 健",
          subject: "国語",
        },
      ],
    },
  ],

  "wednesday-period-2": [
    {
      id: "lesson-3",
      teacherId: "teacher-3",
      teacherName: "高橋先生",
      students: [
        {
          studentId: "student-4",
          studentName: "中村 美咲",
          subject: "英語",
        },
        {
          studentId: "student-5",
          studentName: "小林 翔",
          subject: "理科",
        },
      ],
    },
  ],

  "friday-period-4": [
    {
      id: "lesson-4",
      teacherId: "teacher-4",
      teacherName: "佐々木先生",
      students: [
        {
          studentId: "student-6",
          studentName: "加藤 悠斗",
          subject: "数学",
        },
      ],
    },
  ],

  "2026-07-21-period-1": [
    {
      id: "course-lesson-1",
      teacherId: "teacher-1",
      teacherName: "田中先生",
      students: [
        {
          studentId: "student-1",
          studentName: "佐藤 花子",
          subject: "英語",
        },
      ],
    },
  ],

  "2026-07-23-period-3": [
    {
      id: "course-lesson-2",
      teacherId: "teacher-2",
      teacherName: "山田先生",
      students: [
        {
          studentId: "student-2",
          studentName: "鈴木 太郎",
          subject: "数学",
        },
        {
          studentId: "student-3",
          studentName: "伊藤 健",
          subject: "国語",
        },
      ],
    },
  ],
};

export default function SchedulePage() {
  const [mode, setMode] =
    useState<ScheduleMode>("regular");

  const columns = useMemo(
    () =>
      mode === "regular"
        ? regularColumns
        : courseColumns,
    [mode],
  );

  return (
    <main className="min-w-0">
      <div className="mx-auto w-full max-w-[1800px] space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <ScheduleHeader mode={mode} />

          <ScheduleModeToggle
            value={mode}
            onChange={setMode}
          />
        </div>

        <ScheduleGrid
          columns={columns}
          periods={periods}
          lessonsByCell={sampleLessons}
        />
      </div>
    </main>
  );
}