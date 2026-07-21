"use client";

import {
  useCallback,
  useEffect,
  useState,
} from "react";

import type {
  Dispatch,
  SetStateAction,
} from "react";

import type {
  StudentScheduleValues,
} from "@/components/schedule/student-schedule/StudentScheduleDialog";

import type {
  TeacherScheduleValues,
} from "@/components/schedule/teacher-schedule/TeacherScheduleDialog";

import {
  calculateAcademicYear,
  getAcademicYear,
} from "@/lib/firebase/academicYear";

import {
  getClassrooms,
} from "@/lib/firebase/classroom";

import {
  getLessons,
  groupLessonsByCell,
} from "@/lib/firebase/lessons";

import {
  getScheduleSettings,
} from "@/lib/firebase/setting";

import {
  getStudentSchedules,
} from "@/lib/firebase/studentSchedules";

import {
  getTeacherSchedules,
} from "@/lib/firebase/teacherSchedules";

import {
  getStudents,
  type Student,
} from "@/lib/firebase/students";

import {
  getTeachers,
  type Teacher,
} from "@/lib/firebase/teachers";

import {
  defaultScheduleSettings,
} from "@/lib/schedule/defaultScheduleSettings";

import type {
  Classroom,
} from "@/types/classroom";

import type {
  Lesson,
} from "@/types/lesson";

import type {
  CourseType,
  ScheduleSettings,
} from "@/types/schedule-settings";

export type CourseStudentSchedules = Record<
  CourseType,
  StudentScheduleValues
>;

export type CourseTeacherSchedules = Record<
  CourseType,
  TeacherScheduleValues
>;

function createEmptyCourseStudentSchedules(): CourseStudentSchedules {
  return {
    spring: {},
    summer: {},
    winter: {},
    other: {},
  };
}

function createEmptyCourseTeacherSchedules(): CourseTeacherSchedules {
  return {
    spring: {},
    summer: {},
    winter: {},
    other: {},
  };
}

type UseScheduleDataResult = {
  academicYear: number;

  scheduleSettings: ScheduleSettings;

  teachers: Teacher[];

  students: Student[];

  classrooms: Classroom[];

  lessonsByCell: Record<
    string,
    Lesson[]
  >;

  studentSchedulesByCourse:
    CourseStudentSchedules;

  teacherSchedulesByCourse:
    CourseTeacherSchedules;

  isScheduleLoading: boolean;

  scheduleError: string;

  setLessonsByCell: Dispatch<
    SetStateAction<
      Record<string, Lesson[]>
    >
  >;

  setStudentSchedulesByCourse: Dispatch<
    SetStateAction<
      CourseStudentSchedules
    >
  >;

  setTeacherSchedulesByCourse: Dispatch<
    SetStateAction<
      CourseTeacherSchedules
    >
  >;

  setScheduleError: Dispatch<
    SetStateAction<string>
  >;

  loadStudentSchedule: (
    courseType: CourseType,
  ) => Promise<void>;

  loadTeacherSchedule: (
    courseType: CourseType,
  ) => Promise<void>;
};

export function useScheduleData(): UseScheduleDataResult {
  const [
    academicYear,
    setAcademicYear,
  ] = useState(() =>
    calculateAcademicYear(),
  );

  const [
    scheduleSettings,
    setScheduleSettings,
  ] = useState<ScheduleSettings>(
    defaultScheduleSettings,
  );

  const [
    teachers,
    setTeachers,
  ] = useState<Teacher[]>([]);

  const [
    students,
    setStudents,
  ] = useState<Student[]>([]);

  const [
    classrooms,
    setClassrooms,
  ] = useState<Classroom[]>([]);

  const [
    lessonsByCell,
    setLessonsByCell,
  ] = useState<
    Record<string, Lesson[]>
  >({});

  const [
    studentSchedulesByCourse,
    setStudentSchedulesByCourse,
  ] = useState<CourseStudentSchedules>(
    createEmptyCourseStudentSchedules,
  );

  const [
    teacherSchedulesByCourse,
    setTeacherSchedulesByCourse,
  ] = useState<CourseTeacherSchedules>(
    createEmptyCourseTeacherSchedules,
  );

  const [
    isScheduleLoading,
    setIsScheduleLoading,
  ] = useState(true);

  const [
    scheduleError,
    setScheduleError,
  ] = useState("");

  useEffect(() => {
    let active = true;

    async function loadSchedule() {
      setIsScheduleLoading(true);

      let resolvedAcademicYear =
        calculateAcademicYear();

      try {
        resolvedAcademicYear =
          await getAcademicYear();
      } catch (error) {
        console.error(
          "年度の読み込みに失敗しました。",
          error,
        );
      }

      if (!active) {
        return;
      }

      setAcademicYear(
        resolvedAcademicYear,
      );

      try {
        const [
          loadedLessons,
          loadedTeachers,
          loadedStudents,
          loadedClassrooms,
          loadedScheduleSettings,
        ] = await Promise.all([
          getLessons(
            resolvedAcademicYear,
          ),
          getTeachers(),
          getStudents(),
          getClassrooms(),
          getScheduleSettings(),
        ]);

        if (!active) {
          return;
        }

        setLessonsByCell(
          groupLessonsByCell(
            loadedLessons,
          ),
        );

        setTeachers(
          loadedTeachers,
        );

        setStudents(
          loadedStudents,
        );

        setClassrooms(
          loadedClassrooms,
        );

        setScheduleSettings(
          loadedScheduleSettings,
        );

        setScheduleError("");
      } catch (error) {
        console.error(
          "スケジュールデータの読み込みに失敗しました。",
          error,
        );

        if (!active) {
          return;
        }

        setLessonsByCell({});
        setTeachers([]);
        setStudents([]);
        setClassrooms([]);

        setScheduleSettings(
          defaultScheduleSettings,
        );

        setScheduleError(
          "授業・講師・生徒・教室・設定データの読み込みに失敗しました。",
        );
      } finally {
        if (active) {
          setIsScheduleLoading(
            false,
          );
        }
      }
    }

    void loadSchedule();

    return () => {
      active = false;
    };
  }, []);

  const loadStudentSchedule =
    useCallback(
      async (
        courseType: CourseType,
      ) => {
        try {
          const loadedStudentSchedules =
            await getStudentSchedules(
              academicYear,
              courseType,
            );

          setStudentSchedulesByCourse(
            (currentSchedules) => ({
              ...currentSchedules,

              [courseType]:
                loadedStudentSchedules,
            }),
          );
        } catch (error) {
          console.error(
            "生徒日程の読み込みに失敗しました。",
            error,
          );

          setScheduleError(
            "生徒日程の読み込みに失敗しました。",
          );
        }
      },
      [academicYear],
    );

  const loadTeacherSchedule =
    useCallback(
      async (
        courseType: CourseType,
      ) => {
        try {
          const loadedTeacherSchedules =
            await getTeacherSchedules(
              academicYear,
              courseType,
            );

          setTeacherSchedulesByCourse(
            (currentSchedules) => ({
              ...currentSchedules,

              [courseType]:
                loadedTeacherSchedules,
            }),
          );
        } catch (error) {
          console.error(
            "講師日程の読み込みに失敗しました。",
            error,
          );

          setScheduleError(
            "講師日程の読み込みに失敗しました。",
          );
        }
      },
      [academicYear],
    );

  return {
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
  };
}