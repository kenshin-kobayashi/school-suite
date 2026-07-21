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

import type { Teacher } from "@/lib/firebase/teachers";

type TeacherSchedulePeriod = {
  id: string;
};

export type TeacherScheduleValue = {
  availableSlotIds: string[];
};

export type TeacherScheduleValues = Record<
  string,
  TeacherScheduleValue
>;

type TeacherScheduleDialogProps = {
  open: boolean;
  teachers: Teacher[];
  dates: string[];
  periods: TeacherSchedulePeriod[];
  initialValues?: TeacherScheduleValues;
  onClose: () => void;
  onSave: (
    values: TeacherScheduleValues,
  ) => void | Promise<void>;
};

type ScheduleStatus =
  | "未設定"
  | "一部設定"
  | "完了";

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

function getTeacherKey(
  teacher: Teacher,
): string {
  return (
    teacher.id ??
    teacher.teacherNumber
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

function createEmptyTeacherSchedule(): TeacherScheduleValue {
  return {
    availableSlotIds: [],
  };
}

function cloneValues(
  values: TeacherScheduleValues,
): TeacherScheduleValues {
  const clonedValues: TeacherScheduleValues =
    {};

  Object.entries(values).forEach(
    ([teacherId, value]) => {
      clonedValues[teacherId] = {
        availableSlotIds: [
          ...value.availableSlotIds,
        ],
      };
    },
  );

  return clonedValues;
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

function getScheduleStatus(
  value:
    | TeacherScheduleValue
    | undefined,
  totalSlotCount: number,
): ScheduleStatus {
  if (
    !value ||
    value.availableSlotIds.length === 0
  ) {
    return "未設定";
  }

  if (
    totalSlotCount > 0 &&
    value.availableSlotIds.length >=
      totalSlotCount
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

function createSubjectLabel(
  teacher: Teacher,
): string {
  const subjectNames = Array.from(
    new Set(
      teacher.subjects.map(
        (subject) =>
          subject.subject,
      ),
    ),
  );

  if (subjectNames.length === 0) {
    return "指導教科未設定";
  }

  return subjectNames.join("・");
}

export default function TeacherScheduleDialog({
  open,
  teachers,
  dates,
  periods,
  initialValues = {},
  onClose,
  onSave,
}: TeacherScheduleDialogProps) {
  const [
    selectedTeacherId,
    setSelectedTeacherId,
  ] = useState("");

  const [
    searchKeyword,
    setSearchKeyword,
  ] = useState("");

  const [
    draftValues,
    setDraftValues,
  ] =
    useState<TeacherScheduleValues>(
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

  const activeTeachers = useMemo(
    () =>
      [...teachers]
        .filter(
          (teacher) =>
            teacher.status === "在籍",
        )
        .sort((teacherA, teacherB) =>
          (
            teacherA.furigana ||
            teacherA.name
          ).localeCompare(
            teacherB.furigana ||
              teacherB.name,
            "ja",
          ),
        ),
    [teachers],
  );

  const filteredTeachers =
    useMemo(() => {
      const normalizedKeyword =
        normalizeSearchValue(
          searchKeyword,
        );

      if (!normalizedKeyword) {
        return activeTeachers;
      }

      return activeTeachers.filter(
        (teacher) => {
          const subjectValues =
            teacher.subjects.flatMap(
              (subject) => [
                subject.subject,
                ...subject.grades,
              ],
            );

          const searchableValues = [
            teacher.teacherNumber,
            teacher.name,
            teacher.furigana,
            ...subjectValues,
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
      activeTeachers,
      searchKeyword,
    ]);

  const selectedTeacher =
    useMemo(
      () =>
        activeTeachers.find(
          (teacher) =>
            getTeacherKey(
              teacher,
            ) ===
            selectedTeacherId,
        ) ?? null,
      [
        activeTeachers,
        selectedTeacherId,
      ],
    );

  const selectedValue =
    selectedTeacherId
      ? draftValues[
          selectedTeacherId
        ] ??
        createEmptyTeacherSchedule()
      : null;

  const allSlotIds = useMemo(
    () =>
      dates.flatMap(
        (dateString) =>
          periods.map(
            (period) =>
              createSlotId(
                dateString,
                period.id,
              ),
          ),
      ),
    [dates, periods],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    const firstTeacher =
      activeTeachers[0];

    setDraftValues(
      cloneValues(initialValues),
    );

    setSelectedTeacherId(
      firstTeacher
        ? getTeacherKey(
            firstTeacher,
          )
        : "",
    );

    setSearchKeyword("");
    setIsSaving(false);
    setErrorMessage("");
  }, [
    activeTeachers,
    initialValues,
    open,
  ]);

  function handleSlotToggle(
    slotId: string,
  ) {
    if (!selectedTeacherId) {
      return;
    }

    setDraftValues(
      (currentValues) => {
        const currentTeacherValue =
          currentValues[
            selectedTeacherId
          ] ??
          createEmptyTeacherSchedule();

        const isSelected =
          currentTeacherValue.availableSlotIds.includes(
            slotId,
          );

        return {
          ...currentValues,
          [selectedTeacherId]: {
            availableSlotIds:
              isSelected
                ? currentTeacherValue.availableSlotIds.filter(
                    (
                      currentSlotId,
                    ) =>
                      currentSlotId !==
                      slotId,
                  )
                : [
                    ...currentTeacherValue.availableSlotIds,
                    slotId,
                  ],
          },
        };
      },
    );
  }

  function handleClearSelectedTeacher() {
    if (!selectedTeacherId) {
      return;
    }

    setDraftValues(
      (currentValues) => ({
        ...currentValues,
        [selectedTeacherId]:
          createEmptyTeacherSchedule(),
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
        "講師日程の保存に失敗しました。",
        error,
      );

      setErrorMessage(
        "講師日程の保存に失敗しました。時間をおいて、もう一度お試しください。",
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
          allSlotIds.length,
        )
      : "未設定";

  const selectedSlotCount =
    selectedValue?.availableSlotIds
      .length ?? 0;

  return (
    <Modal
      open={open}
      title="講師日程"
      description="講師ごとに、講習期間中の出勤可能日時を設定します。"
      size="xl"
      closeOnBackdrop={!isSaving}
      onClose={handleClose}
      footer={
        <div className="flex w-full flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            {selectedTeacher ? (
              <button
                type="button"
                disabled={isSaving}
                onClick={
                  handleClearSelectedTeacher
                }
                className="rounded-xl px-4 py-2.5 text-sm font-semibold text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                この講師の設定をクリア
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
                activeTeachers.length ===
                  0
              }
              onClick={handleSave}
            >
              {isSaving
                ? "保存中..."
                : "講師日程を保存"}
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

        {activeTeachers.length ===
        0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-6 py-12 text-center">
            <p className="text-sm font-semibold text-zinc-700">
              在籍中の講師がいません。
            </p>
          </div>
        ) : (
          <div className="grid min-h-[620px] overflow-hidden rounded-2xl border border-zinc-200 bg-white lg:grid-cols-[280px_minmax(0,1fr)]">
            <aside className="border-b border-zinc-200 bg-zinc-50 lg:border-b-0 lg:border-r">
              <div className="border-b border-zinc-200 p-4">
                <label className="block">
                  <span className="sr-only">
                    講師を検索
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
                      placeholder="講師を検索"
                      className="h-10 w-full rounded-xl border border-zinc-200 bg-white pl-10 pr-3 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-400 focus:ring-2 focus:ring-zinc-200"
                    />
                  </div>
                </label>
              </div>

              <div className="max-h-[560px] overflow-y-auto p-2">
                {filteredTeachers.length >
                0 ? (
                  <div className="space-y-1">
                    {filteredTeachers.map(
                      (teacher) => {
                        const teacherKey =
                          getTeacherKey(
                            teacher,
                          );

                        const status =
                          getScheduleStatus(
                            draftValues[
                              teacherKey
                            ],
                            allSlotIds.length,
                          );

                        const isSelected =
                          teacherKey ===
                          selectedTeacherId;

                        return (
                          <button
                            key={
                              teacherKey
                            }
                            type="button"
                            onClick={() =>
                              setSelectedTeacherId(
                                teacherKey,
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
                                    teacher.name
                                  }
                                </p>

                                <p className="mt-1 text-xs text-zinc-500">
                                  {
                                    teacher.teacherNumber
                                  }
                                </p>

                                <p className="mt-1 truncate text-xs text-zinc-400">
                                  {createSubjectLabel(
                                    teacher,
                                  )}
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
                    該当する講師はいません。
                  </p>
                )}
              </div>
            </aside>

            <section className="min-w-0">
              {selectedTeacher &&
              selectedValue ? (
                <div className="space-y-8 p-5 sm:p-6">
                  <div className="flex flex-col gap-4 border-b border-zinc-200 pb-5 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-zinc-900">
                        {
                          selectedTeacher.name
                        }
                        先生
                      </p>

                      <p className="mt-1 text-sm text-zinc-500">
                        {
                          selectedTeacher.teacherNumber
                        }
                        {" ・ "}
                        {createSubjectLabel(
                          selectedTeacher,
                        )}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-600">
                        出勤可能
                        {
                          selectedSlotCount
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
                      指導可能教科・学年
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      講師管理画面で登録されている指導可能範囲です。
                    </p>

                    {selectedTeacher.subjects
                      .length > 0 ? (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                        {selectedTeacher.subjects.map(
                          (
                            teacherSubject,
                          ) => (
                            <div
                              key={
                                teacherSubject.id
                              }
                              className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4"
                            >
                              <div className="flex items-center justify-between gap-3">
                                <p className="text-sm font-semibold text-zinc-900">
                                  {
                                    teacherSubject.subject
                                  }
                                </p>

                                {teacherSubject.examMath ? (
                                  <span className="rounded-full border border-zinc-200 bg-white px-2 py-1 text-[11px] font-semibold text-zinc-600">
                                    受験算数
                                  </span>
                                ) : null}
                              </div>

                              <p className="mt-2 text-sm leading-6 text-zinc-500">
                                {teacherSubject.grades
                                  .length > 0
                                  ? teacherSubject.grades.join(
                                      "・",
                                    )
                                  : "対応学年未設定"}
                              </p>
                            </div>
                          ),
                        )}
                      </div>
                    ) : (
                      <div className="mt-4 rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 px-5 py-8 text-center">
                        <p className="text-sm font-semibold text-zinc-700">
                          指導可能教科が設定されていません。
                        </p>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-sm font-semibold text-zinc-900">
                      出勤可能日時
                    </h3>

                    <p className="mt-1 text-sm text-zinc-500">
                      講師が出勤できる日時を個別に選択してください。
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
                    左側から講師を選択してください。
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