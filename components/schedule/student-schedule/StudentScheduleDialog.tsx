"use client";

import {
  useEffect,
  useMemo,
  useState,
} from "react";
import { Search } from "lucide-react";

import Modal from "@/components/common/Modal";
import PrimaryButton from "@/components/common/PrimaryButton";
import SecondaryButton from "@/components/common/SecondaryButton";

import type { Student } from "@/lib/firebase/students";

type StudentSchedulePeriod = {
  id: string;
};

export type StudentScheduleValue = {
  requiredLessonCounts: Record<
    string,
    number
  >;
  availableSlotIds: string[];
};

export type StudentScheduleValues = Record<
  string,
  StudentScheduleValue
>;

type StudentScheduleDialogProps = {
  open: boolean;
  students: Student[];
  dates: string[];
  periods: StudentSchedulePeriod[];
  initialValues?: StudentScheduleValues;
  onClose: () => void;
  onSave: (
    values: StudentScheduleValues,
  ) => void | Promise<void>;
};

type ScheduleStatus =
  | "未設定"
  | "一部設定"
  | "完了";

const subjects = [
  "国語",
  "数学",
  "英語",
  "理科",
  "社会",
] as const;

const lessonCountOptions = Array.from(
  { length: 100 },
  (_, index) => index,
);

const weekdayLabels: Record<
  number,
  string
> = {
  0: "日",
  1: "月",
  2: "火",
  3: "水",
  4: "木",
  5: "金",
  6: "土",
};

function getStudentKey(
  student: Student,
): string {
  return (
    student.id ??
    student.studentNumber
  );
}

function parseDate(
  dateString: string,
): Date {
  const dateParts = dateString
    .split("-")
    .map(Number);

  const year =
    dateParts[0] ?? 1970;

  const month =
    dateParts[1] ?? 1;

  const day =
    dateParts[2] ?? 1;

  return new Date(
    year,
    month - 1,
    day,
  );
}

function createDateLabel(
  dateString: string,
): string {
  const date = parseDate(dateString);

  const weekdayLabel =
    weekdayLabels[
      date.getDay()
    ] ?? "";

  return `${
    date.getMonth() + 1
  }月${date.getDate()}日（${weekdayLabel}）`;
}

function createSlotId(
  dateString: string,
  periodId: string,
): string {
  return `${dateString}-${periodId}`;
}

function createEmptyStudentSchedule(): StudentScheduleValue {
  return {
    requiredLessonCounts: {
      国語: 0,
      数学: 0,
      英語: 0,
      理科: 0,
      社会: 0,
    },
    availableSlotIds: [],
  };
}

function cloneValues(
  values: StudentScheduleValues,
): StudentScheduleValues {
  const clonedValues: StudentScheduleValues =
    {};

  Object.entries(values).forEach(
    ([studentId, value]) => {
      clonedValues[studentId] = {
        requiredLessonCounts: {
          ...value.requiredLessonCounts,
        },
        availableSlotIds: [
          ...value.availableSlotIds,
        ],
      };
    },
  );

  return clonedValues;
}

function getTotalRequiredLessons(
  value: StudentScheduleValue,
): number {
  return Object.values(
    value.requiredLessonCounts,
  ).reduce(
    (total, count) =>
      total + count,
    0,
  );
}

function getScheduleStatus(
  value:
    | StudentScheduleValue
    | undefined,
): ScheduleStatus {
  if (!value) {
    return "未設定";
  }

  const totalRequiredLessons =
    getTotalRequiredLessons(value);

  const availableSlotCount =
    value.availableSlotIds.length;

  if (
    totalRequiredLessons === 0 &&
    availableSlotCount === 0
  ) {
    return "未設定";
  }

  if (
    totalRequiredLessons > 0 &&
    availableSlotCount > 0
  ) {
    return "完了";
  }

  return "一部設定";
}

function getStatusStyles(
  status: ScheduleStatus,
): string {
  if (status === "完了") {
    return "border-emerald-200 bg-emerald-50 text-emerald-700";
  }

  if (status === "一部設定") {
    return "border-amber-200 bg-amber-50 text-amber-700";
  }

  return "border-zinc-200 bg-zinc-100 text-zinc-600";
}

function normalizeSearchValue(
  value:
    | string
    | null
    | undefined,
): string {
  return (
    value
      ?.trim()
      .toLowerCase() ?? ""
  );
}

export default function StudentScheduleDialog({
  open,
  students,
  dates,
  periods,
  initialValues = {},
  onClose,
  onSave,
}: StudentScheduleDialogProps) {
  const [
    selectedStudentId,
    setSelectedStudentId,
  ] = useState("");

  const [
    searchKeyword,
    setSearchKeyword,
  ] = useState("");

  const [
    draftValues,
    setDraftValues,
  ] =
    useState<StudentScheduleValues>(
      {},
    );

  const [
    isSaving,
    setIsSaving,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const activeStudents = useMemo(
    () =>
      [...students]
        .filter(
          (student) =>
            student.status === "在籍",
        )
        .sort((studentA, studentB) =>
          (
            studentA.furigana ??
            studentA.name
          ).localeCompare(
            studentB.furigana ??
              studentB.name,
            "ja",
          ),
        ),
    [students],
  );

  const filteredStudents =
    useMemo(() => {
      const normalizedKeyword =
        normalizeSearchValue(
          searchKeyword,
        );

      if (!normalizedKeyword) {
        return activeStudents;
      }

      return activeStudents.filter(
        (student) => {
          const searchableValues = [
            student.studentNumber,
            student.name,
            student.furigana,
            student.grade,
            student.school,
          ];

          return searchableValues.some(
            (value) =>
              normalizeSearchValue(
                value,
              ).includes(
                normalizedKeyword,
              ),
          );
        },
      );
    }, [
      activeStudents,
      searchKeyword,
    ]);

  const selectedStudent =
    useMemo(
      () =>
        activeStudents.find(
          (student) =>
            getStudentKey(
              student,
            ) ===
            selectedStudentId,
        ) ?? null,
      [
        activeStudents,
        selectedStudentId,
      ],
    );

  const selectedValue =
    selectedStudentId
      ? draftValues[
          selectedStudentId
        ] ??
        createEmptyStudentSchedule()
      : null;

  useEffect(() => {
    if (!open) {
      return;
    }

    const firstStudent =
      activeStudents[0];

    setDraftValues(
      cloneValues(initialValues),
    );

    setSelectedStudentId(
      firstStudent
        ? getStudentKey(
            firstStudent,
          )
        : "",
    );

    setSearchKeyword("");
    setIsSaving(false);
    setErrorMessage("");
  }, [
    activeStudents,
    initialValues,
    open,
  ]);

  function handleRequiredLessonChange(
    subject: string,
    inputValue: string,
  ) {
    if (!selectedStudentId) {
      return;
    }

    const parsedValue =
      Number.parseInt(
        inputValue,
        10,
      );

    const nextCount =
      Number.isNaN(parsedValue)
        ? 0
        : Math.max(
            0,
            Math.min(
              99,
              parsedValue,
            ),
          );

    setDraftValues(
      (currentValues) => {
        const currentStudentValue =
          currentValues[
            selectedStudentId
          ] ??
          createEmptyStudentSchedule();

        return {
          ...currentValues,
          [selectedStudentId]: {
            ...currentStudentValue,
            requiredLessonCounts: {
              ...currentStudentValue.requiredLessonCounts,
              [subject]: nextCount,
            },
          },
        };
      },
    );
  }

  function handleSlotToggle(
    slotId: string,
  ) {
    if (!selectedStudentId) {
      return;
    }

    setDraftValues(
      (currentValues) => {
        const currentStudentValue =
          currentValues[
            selectedStudentId
          ] ??
          createEmptyStudentSchedule();

        const isSelected =
          currentStudentValue.availableSlotIds.includes(
            slotId,
          );

        return {
          ...currentValues,
          [selectedStudentId]: {
            ...currentStudentValue,
            availableSlotIds:
              isSelected
                ? currentStudentValue.availableSlotIds.filter(
                    (
                      currentSlotId,
                    ) =>
                      currentSlotId !==
                      slotId,
                  )
                : [
                    ...currentStudentValue.availableSlotIds,
                    slotId,
                  ],
          },
        };
      },
    );
  }

  function handleClearSelectedStudent() {
    if (!selectedStudentId) {
      return;
    }

    setDraftValues(
      (currentValues) => ({
        ...currentValues,
        [selectedStudentId]:
          createEmptyStudentSchedule(),
      }),
    );
  }

  async function handleSave() {
    if (isSaving) {
      return;
    }

    try {
      setIsSaving(true);
      setErrorMessage("");

      await onSave(
        cloneValues(draftValues),
      );

      onClose();
    } catch (error) {
      console.error(
        "生徒日程の保存に失敗しました。",
        error,
      );

      setErrorMessage(
        "生徒日程の保存に失敗しました。時間をおいて、もう一度お試しください。",
      );
    } finally {
      setIsSaving(false);
    }
  }

  function handleClose() {
    if (isSaving) {
      return;
    }

    onClose();
  }

  const selectedStatus =
    selectedValue
      ? getScheduleStatus(
          selectedValue,
        )
      : "未設定";

  const totalRequiredLessons =
    selectedValue
      ? getTotalRequiredLessons(
          selectedValue,
        )
      : 0;

  return (
    <Modal
      open={open}
      title="生徒日程"
      description="生徒ごとの必要授業数と、講習期間中の参加可能日時を設定します。"
      size="xl"
      closeOnBackdrop={!isSaving}
      onClose={handleClose}
      footer={
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {selectedStudent ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={
                  handleClearSelectedStudent
                }
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                この生徒の設定をクリア
              </button>
            ) : null}
          </div>

          <div className="flex items-center justify-end gap-3">
            <SecondaryButton
              type="button"
              disabled={isSaving}
              onClick={handleClose}
            >
              キャンセル
            </SecondaryButton>

            <PrimaryButton
              type="button"
              disabled={
                isSaving ||
                activeStudents.length ===
                  0
              }
              onClick={handleSave}
            >
              {isSaving
                ? "保存中..."
                : "生徒日程を保存"}
            </PrimaryButton>
          </div>
        </div>
      }
    >
      <div className="space-y-4">
        {errorMessage ? (
          <div
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3"
          >
            <p className="text-sm font-semibold text-red-700">
              {errorMessage}
            </p>
          </div>
        ) : null}

        {activeStudents.length ===
        0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-zinc-700">
              在籍中の生徒がいません。
            </p>
          </div>
        ) : (
          <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="border-b border-zinc-200 bg-zinc-50 lg:border-b-0 lg:border-r">
              <div className="border-b border-zinc-200 p-4">
                <label className="block">
                  <span className="sr-only">
                    生徒を検索
                  </span>

                  <div className="relative">
                    <Search
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
                    />

                    <input
                      type="search"
                      value={
                        searchKeyword
                      }
                      onChange={(
                        event,
                      ) =>
                        setSearchKeyword(
                          event.target
                            .value,
                        )
                      }
                      placeholder="生徒を検索"
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                    />
                  </div>
                </label>
              </div>

              <div className="max-h-[560px] overflow-y-auto p-2">
                {filteredStudents.length >
                0 ? (
                  <div className="space-y-1">
                    {filteredStudents.map(
                      (student) => {
                        const studentKey =
                          getStudentKey(
                            student,
                          );

                        const status =
                          getScheduleStatus(
                            draftValues[
                              studentKey
                            ],
                          );

                        const isSelected =
                          studentKey ===
                          selectedStudentId;

                        return (
                          <button
                            key={
                              studentKey
                            }
                            type="button"
                            onClick={() =>
                              setSelectedStudentId(
                                studentKey,
                              )
                            }
                            className={`w-full rounded-xl border px-3 py-3 text-left transition ${
                              isSelected
                                ? "border-zinc-300 bg-white shadow-sm"
                                : "border-transparent hover:border-zinc-200 hover:bg-white"
                            }`}
                          >
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0">
                                <p className="truncate text-sm font-semibold text-zinc-900">
                                  {
                                    student.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                  {
                                    student.studentNumber
                                  }
                                  {" ・ "}
                                  {
                                    student.grade
                                  }
                                </p>
                              </div>

                              <span
                                className={`shrink-0 rounded-full border px-2 py-1 text-[11px] font-semibold ${getStatusStyles(
                                  status,
                                )}`}
                              >
                                {status}
                              </span>
                            </div>
                          </button>
                        );
                      },
                    )}
                  </div>
                ) : (
                  <p className="px-3 py-8 text-center text-sm text-zinc-500">
                    該当する生徒はいません。
                  </p>
                )}
              </div>
            </aside>

            <section className="min-w-0">
              {selectedStudent &&
              selectedValue ? (
                <div className="space-y-8 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-zinc-900">
                        {
                          selectedStudent.name
                        }
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {
                          selectedStudent.studentNumber
                        }
                        {" ・ "}
                        {
                          selectedStudent.grade
                        }

                        {selectedStudent.school
                          ? ` ・ ${selectedStudent.school}`
                          : ""}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600">
                        合計
                        {
                          totalRequiredLessons
                        }
                        限
                      </span>

                      <span
                        className={`rounded-full border px-3 py-1.5 text-xs font-semibold ${getStatusStyles(
                          selectedStatus,
                        )}`}
                      >
                        {selectedStatus}
                      </span>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">
                      必要授業数
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      講習期間中に受講する教科ごとの授業数を選択してください。
                    </p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
                      {subjects.map(
                        (subject) => (
                          <label
                            key={
                              subject
                            }
                            className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                          >
                            <span className="block text-sm font-semibold text-zinc-800">
                              {subject}
                            </span>

                            <div className="mt-3 flex items-center gap-2">
                              <select
                                value={
                                  selectedValue.requiredLessonCounts[
                                    subject
                                  ] ?? 0
                                }
                                onChange={(
                                  event,
                                ) =>
                                  handleRequiredLessonChange(
                                    subject,
                                    event
                                      .target
                                      .value,
                                  )
                                }
                                aria-label={`${subject}の必要授業数`}
                                className="h-11 min-w-0 flex-1 cursor-pointer rounded-xl border border-zinc-200 bg-white px-3 text-center text-base font-semibold tabular-nums text-zinc-900 outline-none transition focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                              >
                                {lessonCountOptions.map(
                                  (
                                    count,
                                  ) => (
                                    <option
                                      key={
                                        count
                                      }
                                      value={
                                        count
                                      }
                                    >
                                      {
                                        count
                                      }
                                    </option>
                                  ),
                                )}
                              </select>

                              <span className="shrink-0 text-sm font-medium text-zinc-500">
                                限
                              </span>
                            </div>
                          </label>
                        ),
                      )}
                    </div>
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">
                      参加可能日時
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      生徒が参加できる日時を個別に選択してください。
                    </p>

                    {dates.length === 0 ||
                    periods.length ===
                      0 ? (
                      <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-10 text-center">
                        <p className="text-sm font-semibold text-zinc-700">
                          講習期間または授業時間が設定されていません。
                        </p>
                      </div>
                    ) : (
                      <div className="mt-4 overflow-x-auto rounded-2xl border border-zinc-200">
                        <table className="min-w-full border-collapse text-sm">
                          <thead>
                            <tr className="bg-zinc-50">
                              <th className="sticky left-0 z-10 min-w-[170px] border-b border-r border-zinc-200 bg-zinc-50 px-4 py-3 text-left font-semibold text-zinc-700">
                                日付
                              </th>

                              {periods.map(
                                (
                                  period,
                                  index,
                                ) => (
                                  <th
                                    key={
                                      period.id
                                    }
                                    className="min-w-[82px] border-b border-zinc-200 px-3 py-3 text-center font-semibold text-zinc-700"
                                  >
                                    {index +
                                      1}
                                    限
                                  </th>
                                ),
                              )}
                            </tr>
                          </thead>

                          <tbody>
                            {dates.map(
                              (
                                dateString,
                              ) => (
                                <tr
                                  key={
                                    dateString
                                  }
                                  className="border-b border-zinc-200 last:border-b-0"
                                >
                                  <th className="sticky left-0 z-10 border-r border-zinc-200 bg-white px-4 py-3 text-left font-semibold text-zinc-800">
                                    {createDateLabel(
                                      dateString,
                                    )}
                                  </th>

                                  {periods.map(
                                    (
                                      period,
                                      periodIndex,
                                    ) => {
                                      const slotId =
                                        createSlotId(
                                          dateString,
                                          period.id,
                                        );

                                      const checked =
                                        selectedValue.availableSlotIds.includes(
                                          slotId,
                                        );

                                      return (
                                        <td
                                          key={
                                            slotId
                                          }
                                          className="px-3 py-3 text-center"
                                        >
                                          <button
                                            type="button"
                                            aria-pressed={
                                              checked
                                            }
                                            aria-label={`${createDateLabel(
                                              dateString,
                                            )} ${
                                              periodIndex +
                                              1
                                            }限`}
                                            onClick={() =>
                                              handleSlotToggle(
                                                slotId,
                                              )
                                            }
                                            className={`mx-auto flex h-9 w-9 items-center justify-center rounded-xl border text-sm font-bold transition ${
                                              checked
                                                ? "border-zinc-900 bg-zinc-900 text-white"
                                                : "border-zinc-200 bg-white text-transparent hover:border-zinc-400 hover:bg-zinc-50"
                                            }`}
                                          >
                                            ✓
                                          </button>
                                        </td>
                                      );
                                    },
                                  )}
                                </tr>
                              ),
                            )}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex min-h-[500px] items-center justify-center px-6 text-center">
                  <p className="text-sm text-zinc-500">
                    左側から生徒を選択してください。
                  </p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </Modal>
  );
}