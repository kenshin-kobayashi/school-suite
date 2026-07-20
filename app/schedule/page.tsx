"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import Select from "@/components/common/Select";
import {
  ScheduleGrid,
  ScheduleHeader,
  ScheduleModeToggle,
  ScheduleToolbar,
  type ScheduleColumn,
  type ScheduleMode,
} from "@/components/schedule";
import LessonDialog from "@/components/schedule/dialog/LessonDialog";
import type { LessonFormValues } from "@/components/schedule/dialog/LessonForm";
import CourseWeekSelect from "@/components/schedule/layout/CourseWeekSelect";

import {
  calculateAcademicYear,
  getAcademicYear,
} from "@/lib/firebase/academicYear";
import type { Student } from "@/lib/firebase/students";
import type { Teacher } from "@/lib/firebase/teachers";
import { defaultScheduleSettings } from "@/lib/schedule/defaultScheduleSettings";
import { createSchedulePeriods } from "@/lib/schedule/periods";
import { createCourseWeeks } from "@/lib/schedule/week";

import type { Lesson } from "@/types/lesson";
import type { Weekday } from "@/types/schedule";
import type { ScheduleCellPosition } from "@/types/schedule-cell";
import {
  COURSE_TYPE_LABELS,
  type CourseType,
} from "@/types/schedule-settings";

const weekdayLabels: Record<Weekday, string> = {
  monday: "月曜日",
  tuesday: "火曜日",
  wednesday: "水曜日",
  thursday: "木曜日",
  friday: "金曜日",
  saturday: "土曜日",
  sunday: "日曜日",
};

const weekdayByDayNumber: Record<number, Weekday> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

const courseTypeOptions: CourseType[] = [
  "spring",
  "summer",
  "winter",
  "other",
];

const sampleTeachers: Teacher[] = [
  {
    id: "teacher-1",
    teacherNumber: "T0001",
    name: "田中",
    furigana: "たなか",
    status: "在籍",
    subjects: [
      {
        id: "teacher-1-english",
        subject: "英語",
        grades: [
          "小学6年",
          "中学1年",
          "中学2年",
          "中学3年",
        ],
      },
    ],
  },
  {
    id: "teacher-2",
    teacherNumber: "T0002",
    name: "山田",
    furigana: "やまだ",
    status: "在籍",
    subjects: [
      {
        id: "teacher-2-math",
        subject: "数学",
        grades: [
          "中学1年",
          "中学2年",
          "中学3年",
        ],
      },
      {
        id: "teacher-2-japanese",
        subject: "国語",
        grades: [
          "中学1年",
          "中学2年",
          "中学3年",
        ],
      },
    ],
  },
  {
    id: "teacher-3",
    teacherNumber: "T0003",
    name: "高橋",
    furigana: "たかはし",
    status: "在籍",
    subjects: [
      {
        id: "teacher-3-english",
        subject: "英語",
        grades: [
          "中学1年",
          "中学2年",
          "中学3年",
        ],
      },
      {
        id: "teacher-3-science",
        subject: "理科",
        grades: [
          "中学1年",
          "中学2年",
          "中学3年",
        ],
      },
    ],
  },
  {
    id: "teacher-4",
    teacherNumber: "T0004",
    name: "佐々木",
    furigana: "ささき",
    status: "在籍",
    subjects: [
      {
        id: "teacher-4-math",
        subject: "数学",
        grades: [
          "中学1年",
          "中学2年",
          "中学3年",
        ],
      },
    ],
  },
];

const sampleStudents: Student[] = [
  {
    id: "student-1",
    studentNumber: "S0001",
    name: "佐藤 花子",
    furigana: "さとう はなこ",
    grade: "中学1年",
    school: "第一中学校",
    status: "在籍",
    unavailableTeacherIds: [],
    maxStudentsPerLesson: 2,
    firstPreferredTeacherId: "teacher-1",
    secondPreferredTeacherId: "",
  },
  {
    id: "student-2",
    studentNumber: "S0002",
    name: "鈴木 太郎",
    furigana: "すずき たろう",
    grade: "中学2年",
    school: "第二中学校",
    status: "在籍",
    unavailableTeacherIds: [],
    maxStudentsPerLesson: 2,
    firstPreferredTeacherId: "teacher-2",
    secondPreferredTeacherId: "",
  },
  {
    id: "student-3",
    studentNumber: "S0003",
    name: "伊藤 健",
    furigana: "いとう けん",
    grade: "中学3年",
    school: "第三中学校",
    status: "在籍",
    unavailableTeacherIds: [],
    maxStudentsPerLesson: 2,
    firstPreferredTeacherId: "teacher-2",
    secondPreferredTeacherId: "",
  },
  {
    id: "student-4",
    studentNumber: "S0004",
    name: "中村 美咲",
    furigana: "なかむら みさき",
    grade: "中学2年",
    school: "第一中学校",
    status: "在籍",
    unavailableTeacherIds: [],
    maxStudentsPerLesson: 2,
    firstPreferredTeacherId: "teacher-3",
    secondPreferredTeacherId: "teacher-1",
  },
  {
    id: "student-5",
    studentNumber: "S0005",
    name: "小林 翔",
    furigana: "こばやし しょう",
    grade: "中学1年",
    school: "第二中学校",
    status: "在籍",
    unavailableTeacherIds: [],
    maxStudentsPerLesson: 2,
    firstPreferredTeacherId: "teacher-3",
    secondPreferredTeacherId: "",
  },
  {
    id: "student-6",
    studentNumber: "S0006",
    name: "加藤 悠斗",
    furigana: "かとう ゆうと",
    grade: "中学3年",
    school: "第三中学校",
    status: "在籍",
    unavailableTeacherIds: [],
    maxStudentsPerLesson: 1,
    firstPreferredTeacherId: "teacher-4",
    secondPreferredTeacherId: "",
  },
];

function parseDate(dateString: string): Date {
  const [year, month, day] = dateString
    .split("-")
    .map(Number);

  return new Date(year, month - 1, day);
}

function createDateLabel(
  dateString: string,
): string {
  const date = parseDate(dateString);

  return `${
    date.getMonth() + 1
  }月${date.getDate()}日`;
}

function createDateSubLabel(
  dateString: string,
): string {
  const date = parseDate(dateString);
  const weekday =
    weekdayByDayNumber[date.getDay()];

  return weekdayLabels[weekday];
}

function createRegularColumns(): ScheduleColumn[] {
  return defaultScheduleSettings.regular.enabledWeekdays.map(
    (weekday) => ({
      id: weekday,
      label: weekdayLabels[weekday],
    }),
  );
}

function createSampleLessons(
  academicYear: number,
): Record<string, Lesson[]> {
  return {
    "monday-period-1": [
      {
        id: "lesson-1",
        academicYear,
        scheduleMode: "regular",
        weekday: "monday",
        periodNumber: 1,
        teacherId: "teacher-1",
        teacherNumber: "T0001",
        teacherName: "田中先生",
        students: [
          {
            studentId: "student-1",
            studentNumber: "S0001",
            studentName: "佐藤 花子",
            grade: "中学1年",
            subject: "英語",
          },
          {
            studentId: "student-2",
            studentNumber: "S0002",
            studentName: "鈴木 太郎",
            grade: "中学2年",
            subject: "数学",
          },
        ],
        status: "scheduled",
        source: "manual",
      },
      {
        id: "lesson-2",
        academicYear,
        scheduleMode: "regular",
        weekday: "monday",
        periodNumber: 1,
        teacherId: "teacher-2",
        teacherNumber: "T0002",
        teacherName: "山田先生",
        students: [
          {
            studentId: "student-3",
            studentNumber: "S0003",
            studentName: "伊藤 健",
            grade: "中学3年",
            subject: "国語",
          },
        ],
        status: "scheduled",
        source: "manual",
      },
    ],

    "wednesday-period-2": [
      {
        id: "lesson-3",
        academicYear,
        scheduleMode: "regular",
        weekday: "wednesday",
        periodNumber: 2,
        teacherId: "teacher-3",
        teacherNumber: "T0003",
        teacherName: "高橋先生",
        students: [
          {
            studentId: "student-4",
            studentNumber: "S0004",
            studentName: "中村 美咲",
            grade: "中学2年",
            subject: "英語",
          },
          {
            studentId: "student-5",
            studentNumber: "S0005",
            studentName: "小林 翔",
            grade: "中学1年",
            subject: "理科",
          },
        ],
        status: "scheduled",
        source: "manual",
      },
    ],

    "friday-period-4": [
      {
        id: "lesson-4",
        academicYear,
        scheduleMode: "regular",
        weekday: "friday",
        periodNumber: 4,
        teacherId: "teacher-4",
        teacherNumber: "T0004",
        teacherName: "佐々木先生",
        students: [
          {
            studentId: "student-6",
            studentNumber: "S0006",
            studentName: "加藤 悠斗",
            grade: "中学3年",
            subject: "数学",
          },
        ],
        status: "scheduled",
        source: "manual",
      },
    ],

    "2026-07-21-period-1": [
      {
        id: "course-lesson-1",
        academicYear,
        scheduleMode: "course",
        date: "2026-07-21",
        periodNumber: 1,
        teacherId: "teacher-1",
        teacherNumber: "T0001",
        teacherName: "田中先生",
        students: [
          {
            studentId: "student-1",
            studentNumber: "S0001",
            studentName: "佐藤 花子",
            grade: "中学1年",
            subject: "英語",
          },
        ],
        status: "scheduled",
        source: "manual",
      },
    ],

    "2026-07-23-period-3": [
      {
        id: "course-lesson-2",
        academicYear,
        scheduleMode: "course",
        date: "2026-07-23",
        periodNumber: 3,
        teacherId: "teacher-2",
        teacherNumber: "T0002",
        teacherName: "山田先生",
        students: [
          {
            studentId: "student-2",
            studentNumber: "S0002",
            studentName: "鈴木 太郎",
            grade: "中学2年",
            subject: "数学",
          },
          {
            studentId: "student-3",
            studentNumber: "S0003",
            studentName: "伊藤 健",
            grade: "中学3年",
            subject: "国語",
          },
        ],
        status: "scheduled",
        source: "manual",
      },
    ],
  };
}

export default function SchedulePage() {
  const [mode, setMode] =
    useState<ScheduleMode>("regular");

  const [
    academicYear,
    setAcademicYear,
  ] = useState(() =>
    calculateAcademicYear(),
  );

  const [
    isAcademicYearLoading,
    setIsAcademicYearLoading,
  ] = useState(true);

  const [
    selectedCourseType,
    setSelectedCourseType,
  ] = useState<CourseType>("summer");

  const [
    selectedCell,
    setSelectedCell,
  ] =
    useState<ScheduleCellPosition | null>(
      null,
    );

  const [
    dialogOpen,
    setDialogOpen,
  ] = useState(false);

  const [
    selectedWeekId,
    setSelectedWeekId,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function loadAcademicYear() {
      try {
        const savedAcademicYear =
          await getAcademicYear();

        if (active) {
          setAcademicYear(savedAcademicYear);
        }
      } catch (error) {
        console.error(
          "年度の読み込みに失敗しました。",
          error,
        );
      } finally {
        if (active) {
          setIsAcademicYearLoading(false);
        }
      }
    }

    void loadAcademicYear();

    return () => {
      active = false;
    };
  }, []);

  const selectedCourseSettings =
    useMemo(
      () =>
        defaultScheduleSettings.courses[
          selectedCourseType
        ],
      [selectedCourseType],
    );

  const regularColumns = useMemo(
    () => createRegularColumns(),
    [],
  );

  const sampleLessons = useMemo(
    () => createSampleLessons(academicYear),
    [academicYear],
  );

  const courseWeeks = useMemo(() => {
    const {
      startDate,
      endDate,
      enabledWeekdays,
    } = selectedCourseSettings;

    if (!startDate || !endDate) {
      return [];
    }

    return createCourseWeeks(
      startDate,
      endDate,
      enabledWeekdays,
    );
  }, [selectedCourseSettings]);

  useEffect(() => {
    setSelectedWeekId(
      courseWeeks[0]?.id ?? "",
    );
  }, [courseWeeks]);

  const selectedWeek = useMemo(
    () =>
      courseWeeks.find(
        (week) =>
          week.id === selectedWeekId,
      ) ??
      courseWeeks[0] ??
      null,
    [courseWeeks, selectedWeekId],
  );

  const courseColumns =
    useMemo<ScheduleColumn[]>(
      () => {
        if (!selectedWeek) {
          return [];
        }

        return selectedWeek.dates.map(
          (dateString) => ({
            id: dateString,
            label:
              createDateLabel(dateString),
            subLabel:
              createDateSubLabel(
                dateString,
              ),
          }),
        );
      },
      [selectedWeek],
    );

  const columns = useMemo(
    () =>
      mode === "regular"
        ? regularColumns
        : courseColumns,
    [
      courseColumns,
      mode,
      regularColumns,
    ],
  );

  const periods = useMemo(() => {
    const periodSettings =
      mode === "regular"
        ? defaultScheduleSettings.regular
            .periods
        : selectedCourseSettings.periods;

    return createSchedulePeriods(
      periodSettings,
    );
  }, [
    mode,
    selectedCourseSettings,
  ]);

  function handleModeChange(
    nextMode: ScheduleMode,
  ) {
    setMode(nextMode);
    setSelectedCell(null);
    setDialogOpen(false);
  }

  function handleCourseTypeChange(
    value: string,
  ) {
    setSelectedCourseType(
      value as CourseType,
    );

    setSelectedCell(null);
    setDialogOpen(false);
  }

  function handleCellClick(
    position: ScheduleCellPosition,
  ) {
    setSelectedCell(position);
    setDialogOpen(true);
  }

  function handleCloseLessonDialog() {
    setDialogOpen(false);
    setSelectedCell(null);
  }

  function handleAddLesson() {
    const firstColumn = columns[0];
    const firstPeriod = periods[0];

    if (!firstColumn || !firstPeriod) {
      return;
    }

    setSelectedCell({
      columnId: firstColumn.id,
      periodId: firstPeriod.id,
    });

    setDialogOpen(true);
  }

  async function handleSubmitLesson(
    values: LessonFormValues,
  ) {
    if (!selectedCell) {
      return;
    }

    console.log("授業登録", {
      academicYear,
      scheduleMode: mode,
      courseType:
        mode === "course"
          ? selectedCourseType
          : undefined,
      position: selectedCell,
      ...values,
    });

    handleCloseLessonDialog();
  }

  function handleCreateOrRebuildWithAI() {
    console.log("AIで作成・組み直し", {
      academicYear,
      scheduleMode: mode,
      courseType:
        mode === "course"
          ? selectedCourseType
          : undefined,
    });
  }

  function handleOpenSettings() {
    console.log("日程設定", {
      academicYear,
      scheduleMode: mode,
      courseType:
        mode === "course"
          ? selectedCourseType
          : undefined,
    });
  }

  if (isAcademicYearLoading) {
    return (
      <main className="min-w-0">
        <div className="mx-auto w-full max-w-[1800px]">
          <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-sm font-medium text-zinc-600">
              スケジュールを読み込んでいます...
            </p>
          </div>
        </div>
      </main>
    );
  }

  return (
    <>
      <main className="min-w-0">
        <div className="mx-auto w-full max-w-[1800px] space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <ScheduleHeader mode={mode} />

              <p className="mt-2 text-sm font-medium text-zinc-500">
                {academicYear}年度
              </p>
            </div>

            <ScheduleModeToggle
              value={mode}
              onChange={handleModeChange}
            />
          </div>

          {mode === "course" && (
            <div className="w-full rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="max-w-xs">
                <Select
                  label="講習"
                  value={
                    selectedCourseType
                  }
                  onChange={(event) =>
                    handleCourseTypeChange(
                      event.target.value,
                    )
                  }
                >
                  {courseTypeOptions.map(
                    (courseType) => (
                      <option
                        key={courseType}
                        value={courseType}
                      >
                        {
                          COURSE_TYPE_LABELS[
                            courseType
                          ]
                        }
                      </option>
                    ),
                  )}
                </Select>
              </div>
            </div>
          )}

          <ScheduleToolbar
            onAddLesson={
              handleAddLesson
            }
            onCreateOrRebuildWithAI={
              handleCreateOrRebuildWithAI
            }
            onOpenSettings={
              handleOpenSettings
            }
          />

          {mode === "course" &&
            courseWeeks.length > 0 && (
              <CourseWeekSelect
                weeks={courseWeeks}
                value={
                  selectedWeek?.id ?? ""
                }
                onChange={
                  setSelectedWeekId
                }
              />
            )}

          {mode === "course" &&
          courseWeeks.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-zinc-300 bg-white px-6 py-16 text-center shadow-sm">
              <p className="text-base font-semibold text-zinc-800">
                講習期間が設定されていません
              </p>

              <p className="mt-2 text-sm text-zinc-500">
                設定画面から
                {
                  COURSE_TYPE_LABELS[
                    selectedCourseType
                  ]
                }
                の開始日と終了日を設定してください。
              </p>
            </div>
          ) : (
            <ScheduleGrid
              columns={columns}
              periods={periods}
              lessonsByCell={
                sampleLessons
              }
              onCellClick={
                handleCellClick
              }
            />
          )}
        </div>
      </main>

      <LessonDialog
        open={dialogOpen}
        position={selectedCell}
        teachers={sampleTeachers}
        students={sampleStudents}
        mode="create"
        onClose={
          handleCloseLessonDialog
        }
        onSubmit={
          handleSubmitLesson
        }
      />
    </>
  );
}