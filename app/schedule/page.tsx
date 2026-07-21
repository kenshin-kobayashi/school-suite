"use client";

import {
  useCallback,
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
  type ScheduleMode,
} from "@/components/schedule";

import AIScheduleProgressDialog from "@/components/schedule/ai/AIScheduleProgressDialog";

import AIScheduleResultReport from "@/components/schedule/ai/AIScheduleResultReport";

import LessonDialog from "@/components/schedule/dialog/LessonDialog";

import CourseWeekSelect from "@/components/schedule/layout/CourseWeekSelect";

import StudentScheduleDialog, {
  type StudentScheduleValues,
} from "@/components/schedule/student-schedule/StudentScheduleDialog";

import TeacherScheduleDialog, {
  type TeacherScheduleValues,
} from "@/components/schedule/teacher-schedule/TeacherScheduleDialog";

import {
  useAIScheduleCreation,
} from "@/hooks/schedule/useAIScheduleCreation";

import {
  isRegularLessonPreview,
  useCourseLessons,
} from "@/hooks/schedule/useCourseLessons";

import {
  useCourseSchedule,
} from "@/hooks/schedule/useCourseSchedule";

import {
  useLessonDialog,
} from "@/hooks/schedule/useLessonDialog";

import {
  useScheduleData,
} from "@/hooks/schedule/useScheduleData";

import {
  saveStudentSchedules,
} from "@/lib/firebase/studentSchedules";

import {
  saveTeacherSchedules,
} from "@/lib/firebase/teacherSchedules";

import type {
  Lesson,
} from "@/types/lesson";

import type {
  ScheduleCellPosition,
} from "@/types/schedule-cell";

import {
  COURSE_TYPE_LABELS,
  type CourseType,
} from "@/types/schedule-settings";

const courseTypeOptions: CourseType[] = [
  "spring",
  "summer",
  "winter",
  "other",
];

export default function SchedulePage() {
  const {
    academicYear,
    scheduleSettings,
    teachers,
    students,
    classrooms,
    lessonsByCell,
    studentSchedulesByCourse,
    teacherSchedulesByCourse,
    isScheduleLoading,
    scheduleError,
    setLessonsByCell,
    setStudentSchedulesByCourse,
    setTeacherSchedulesByCourse,
    setScheduleError,
    loadStudentSchedule,
    loadTeacherSchedule,
  } = useScheduleData();

  const [
    mode,
    setMode,
  ] = useState<ScheduleMode>(
    "regular",
  );

  const [
    selectedCourseType,
    setSelectedCourseType,
  ] = useState<CourseType>(
    "summer",
  );

  const [
    studentScheduleDialogOpen,
    setStudentScheduleDialogOpen,
  ] = useState(false);

  const [
    teacherScheduleDialogOpen,
    setTeacherScheduleDialogOpen,
  ] = useState(false);

  useEffect(() => {
    if (isScheduleLoading) {
      return;
    }

    void loadStudentSchedule(
      selectedCourseType,
    );

    void loadTeacherSchedule(
      selectedCourseType,
    );
  }, [
    isScheduleLoading,
    loadStudentSchedule,
    loadTeacherSchedule,
    selectedCourseType,
  ]);

  const {
    selectedCourseSettings,
    holidayDateSet,
    courseWeeks,
    courseDates,
    coursePeriods,
    selectedWeek,
    columns,
    periods,
    setSelectedWeekId,
  } = useCourseSchedule({
    mode,
    selectedCourseType,
    scheduleSettings,
  });

  const {
    displayLessonsByCell,
  } = useCourseLessons({
    mode,
    selectedCourseType,
    scheduleSettings,
    courseDates,
    lessonsByCell,
  });

  const activeTeachers = useMemo(
    () =>
      teachers.filter(
        (teacher) =>
          teacher.status ===
          "在籍",
      ),
    [teachers],
  );

  const activeStudents = useMemo(
    () =>
      students.filter(
        (student) =>
          student.status ===
          "在籍",
      ),
    [students],
  );

  const sortedClassrooms = useMemo(
    () =>
      [...classrooms].sort(
        (
          classroomA,
          classroomB,
        ) =>
          classroomA.name.localeCompare(
            classroomB.name,
            "ja",
          ),
      ),
    [classrooms],
  );

  const allLessons = useMemo(
    () =>
      Object.values(
        lessonsByCell,
      ).flat(),
    [lessonsByCell],
  );

  const {
    lessonDialogOpen,
    selectedCell,
    selectedLesson,
    lessonInitialValues,
    handleAddLesson,
    handleCellClick,
    handleLessonClick,
    handleCloseLessonDialog,
    handleSubmitLesson,
    handleDeleteLesson,
  } = useLessonDialog({
    academicYear,

    mode,

    columns,

    periods,

    holidayDateSet,

    lessonsByCell,

    setLessonsByCell,

    setScheduleError,

    onBeforeOpen: () => {
      setStudentScheduleDialogOpen(
        false,
      );

      setTeacherScheduleDialogOpen(
        false,
      );
    },
  });

  const closeScheduleDialogs =
    useCallback(() => {
      handleCloseLessonDialog();

      setStudentScheduleDialogOpen(
        false,
      );

      setTeacherScheduleDialogOpen(
        false,
      );
    }, [handleCloseLessonDialog]);

  const currentStudentSchedules =
    studentSchedulesByCourse[
      selectedCourseType
    ] ?? {};

  const currentTeacherSchedules =
    teacherSchedulesByCourse[
      selectedCourseType
    ] ?? {};

  const {
    aiScheduleResult,
    isAIProcessing,
    displayedAIProgress,
    displayedAIProgressMessage,
    clearAIState,
    clearAIScheduleMessage,
    createOrRebuildWithAI,
  } = useAIScheduleCreation({
    academicYear,

    courseType:
      selectedCourseType,

    courseDates,

    scheduleSettings,

    students,

    teachers,

    classrooms:
      sortedClassrooms,

    activeStudents,

    activeTeachers,

    studentSchedules:
      currentStudentSchedules,

    teacherSchedules:
      currentTeacherSchedules,

    lessons:
      allLessons,

    setLessonsByCell,

    setScheduleError,

    closeScheduleDialogs,
  });

  function handleModeChange(
    nextMode: ScheduleMode,
  ) {
    if (isAIProcessing) {
      return;
    }

    setMode(nextMode);

    closeScheduleDialogs();

    clearAIState();

    setScheduleError("");
  }

  function handleCourseTypeChange(
    value: string,
  ) {
    if (isAIProcessing) {
      return;
    }

    const nextCourseType =
      courseTypeOptions.find(
        (courseType) =>
          courseType === value,
      );

    if (!nextCourseType) {
      return;
    }

    setSelectedCourseType(
      nextCourseType,
    );

    closeScheduleDialogs();

    clearAIState();

    setScheduleError("");
  }

  function handleDisplayedLessonClick(
    position: ScheduleCellPosition,
    lesson: Lesson,
  ) {
    if (
      isAIProcessing ||
      isRegularLessonPreview(
        lesson,
      )
    ) {
      return;
    }

    handleLessonClick(
      position,
      lesson,
    );
  }

  async function handleCreateOrRebuildWithAI() {
    if (mode !== "course") {
      setScheduleError(
        "AI時間割は講習スケジュールでのみ作成できます。",
      );

      return;
    }

    await createOrRebuildWithAI();
  }

  function handleOpenStudentSchedule() {
    if (
      mode !== "course" ||
      isAIProcessing
    ) {
      return;
    }

    setScheduleError("");

    clearAIScheduleMessage();

    handleCloseLessonDialog();

    setTeacherScheduleDialogOpen(
      false,
    );

    setStudentScheduleDialogOpen(
      true,
    );
  }

  function handleCloseStudentSchedule() {
    if (isAIProcessing) {
      return;
    }

    setStudentScheduleDialogOpen(
      false,
    );
  }

  async function handleSaveStudentSchedule(
    values: StudentScheduleValues,
  ) {
    try {
      setScheduleError("");

      clearAIScheduleMessage();

      await saveStudentSchedules(
        academicYear,
        selectedCourseType,
        values,
      );

      setStudentSchedulesByCourse(
        (currentSchedules) => ({
          ...currentSchedules,

          [selectedCourseType]:
            values,
        }),
      );

      setStudentScheduleDialogOpen(
        false,
      );
    } catch (error) {
      console.error(
        "生徒日程の保存に失敗しました。",
        error,
      );

      setScheduleError(
        "生徒日程の保存に失敗しました。時間をおいて、もう一度お試しください。",
      );
    }
  }

  function handleOpenTeacherSchedule() {
    if (
      mode !== "course" ||
      isAIProcessing
    ) {
      return;
    }

    setScheduleError("");

    clearAIScheduleMessage();

    handleCloseLessonDialog();

    setStudentScheduleDialogOpen(
      false,
    );

    setTeacherScheduleDialogOpen(
      true,
    );
  }

  function handleCloseTeacherSchedule() {
    if (isAIProcessing) {
      return;
    }

    setTeacherScheduleDialogOpen(
      false,
    );
  }

  async function handleSaveTeacherSchedule(
    values: TeacherScheduleValues,
  ) {
    try {
      setScheduleError("");

      clearAIScheduleMessage();

      await saveTeacherSchedules(
        academicYear,
        selectedCourseType,
        values,
      );

      setTeacherSchedulesByCourse(
        (currentSchedules) => ({
          ...currentSchedules,

          [selectedCourseType]:
            values,
        }),
      );

      setTeacherScheduleDialogOpen(
        false,
      );
    } catch (error) {
      console.error(
        "講師日程の保存に失敗しました。",
        error,
      );

      setScheduleError(
        "講師日程の保存に失敗しました。時間をおいて、もう一度お試しください。",
      );

      throw error;
    }
  }

  if (isScheduleLoading) {
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
              <ScheduleHeader
                mode={mode}
              />

              <p className="mt-2 text-sm font-medium text-zinc-500">
                {academicYear}年度
              </p>
            </div>

            <ScheduleModeToggle
              value={mode}
              onChange={
                handleModeChange
              }
            />
          </div>

          {scheduleError ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm font-medium text-red-700">
                {scheduleError}
              </p>
            </div>
          ) : null}

          {mode === "course" ? (
  <AIScheduleResultReport
    result={
      aiScheduleResult
    }
    aiWeights={
      selectedCourseSettings
        .aiWeights
    }
  />
) : null}

          {mode === "course" ? (
            <div className="w-full rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="max-w-xs">
                <Select
                  label="講習"
                  value={
                    selectedCourseType
                  }
                  disabled={
                    isAIProcessing
                  }
                  onChange={(
                    event,
                  ) =>
                    handleCourseTypeChange(
                      event.target.value,
                    )
                  }
                >
                  {courseTypeOptions.map(
                    (courseType) => (
                      <option
                        key={
                          courseType
                        }
                        value={
                          courseType
                        }
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

              <div className="mt-4 flex items-center gap-2 border-t border-zinc-100 pt-4">
                <span
                  className={[
                    "inline-flex h-2.5 w-2.5 rounded-full",

                    selectedCourseSettings
                      .showRegularLessons
                      ? "bg-emerald-500"
                      : "bg-zinc-300",
                  ].join(" ")}
                />

                <p className="text-sm font-medium text-zinc-600">
                  通常授業のコピー：

                  <span className="ml-1 font-semibold text-zinc-900">
                    {selectedCourseSettings
                      .showRegularLessons
                      ? "オン"
                      : "オフ"}
                  </span>
                </p>
              </div>
            </div>
          ) : null}

          <ScheduleToolbar
            scheduleMode={mode}
            isGenerating={
              isAIProcessing
            }
            onAddLesson={
              handleAddLesson
            }
            onCreateOrRebuildWithAI={
              handleCreateOrRebuildWithAI
            }
            onOpenStudentSchedule={
              handleOpenStudentSchedule
            }
            onOpenTeacherSchedule={
              handleOpenTeacherSchedule
            }
          />

          {mode === "course" &&
          courseWeeks.length > 0 ? (
            <CourseWeekSelect
              weeks={courseWeeks}
              value={
                selectedWeek?.id ??
                ""
              }
              onChange={
                setSelectedWeekId
              }
            />
          ) : null}

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
            <div
              className={
                isAIProcessing
                  ? "pointer-events-none opacity-60"
                  : ""
              }
            >
              <ScheduleGrid
                columns={columns}
                periods={periods}
                lessonsByCell={
                  displayLessonsByCell
                }
                onCellClick={
                  handleCellClick
                }
                onLessonClick={
                  handleDisplayedLessonClick
                }
              />
            </div>
          )}
        </div>
      </main>

      <LessonDialog
        open={
          lessonDialogOpen &&
          !isAIProcessing
        }
        position={selectedCell}
        teachers={activeTeachers}
        students={activeStudents}
        classrooms={sortedClassrooms}
        initialValues={
          lessonInitialValues
        }
        mode={
          selectedLesson
            ? "edit"
            : "create"
        }
        onClose={
          handleCloseLessonDialog
        }
        onSubmit={
          handleSubmitLesson
        }
        onDelete={
          selectedLesson
            ? handleDeleteLesson
            : undefined
        }
      />

      <StudentScheduleDialog
        open={
          studentScheduleDialogOpen &&
          !isAIProcessing
        }
        students={activeStudents}
        dates={courseDates}
        periods={coursePeriods}
        initialValues={
          currentStudentSchedules
        }
        onClose={
          handleCloseStudentSchedule
        }
        onSave={
          handleSaveStudentSchedule
        }
      />

      <TeacherScheduleDialog
        open={
          teacherScheduleDialogOpen &&
          !isAIProcessing
        }
        teachers={activeTeachers}
        dates={courseDates}
        periods={coursePeriods}
        initialValues={
          currentTeacherSchedules
        }
        onClose={
          handleCloseTeacherSchedule
        }
        onSave={
          handleSaveTeacherSchedule
        }
      />

      <AIScheduleProgressDialog
        open={isAIProcessing}
        progress={
          displayedAIProgress
        }
        message={
          displayedAIProgressMessage
        }
      />
    </>
  );
}