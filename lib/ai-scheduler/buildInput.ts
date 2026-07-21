import type {
  StudentScheduleValues,
} from "@/components/schedule/student-schedule/StudentScheduleDialog";

import type {
  TeacherScheduleValues,
} from "@/components/schedule/teacher-schedule/TeacherScheduleDialog";

import type { Classroom } from "@/types/classroom";
import type { Lesson } from "@/types/lesson";
import type {
  CourseType,
  ScheduleSettings,
} from "@/types/schedule-settings";
import type {
  Weekday,
} from "@/types/schedule";

import type {
  Student,
} from "@/lib/firebase/students";
import type {
  Teacher,
} from "@/lib/firebase/teachers";

import {
  defaultAISchedulerScoreSettings,
  normalizeAISchedulerScoreSettings,
} from "./defaultScoreSettings";

import type {
  AISchedulerCourseDay,
  AISchedulerInput,
  AISchedulerScoreSettings,
  AISchedulerStudentAvailability,
  AISchedulerStudentRequest,
  AISchedulerTeacher,
  AISchedulerTeacherAvailability,
} from "./types";

type BuildAISchedulerInputParams = {
  academicYear: number;
  courseType: CourseType;
  scheduleSettings: ScheduleSettings;
  students: Student[];
  teachers: Teacher[];
  classrooms: Classroom[];
  studentSchedules: StudentScheduleValues;
  teacherSchedules: TeacherScheduleValues;
  lessons: Lesson[];
  preserveExistingLessons: boolean;
  scoreSettings?: Partial<AISchedulerScoreSettings> | null;
};

type ParsedSlot = {
  date: string;
  periodNumber: number;
};

const weekdayMap: Record<
  number,
  Weekday
> = {
  0: "sunday",
  1: "monday",
  2: "tuesday",
  3: "wednesday",
  4: "thursday",
  5: "friday",
  6: "saturday",
};

function parseDate(
  dateString: string,
): Date {
  const [year, month, day] =
    dateString
      .split("-")
      .map(Number);

  return new Date(
    year,
    month - 1,
    day,
  );
}

function formatDate(
  date: Date,
): string {
  const year =
    date.getFullYear();

  const month = String(
    date.getMonth() + 1,
  ).padStart(2, "0");

  const day = String(
    date.getDate(),
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getWeekday(
  dateString: string,
): Weekday {
  return weekdayMap[
    parseDate(
      dateString,
    ).getDay()
  ];
}

function createDateRange(
  startDate: string,
  endDate: string,
): string[] {
  const start =
    parseDate(startDate);

  const end =
    parseDate(endDate);

  if (
    Number.isNaN(start.getTime()) ||
    Number.isNaN(end.getTime()) ||
    start > end
  ) {
    return [];
  }

  const dates: string[] = [];

  const currentDate =
    new Date(start);

  while (currentDate <= end) {
    dates.push(
      formatDate(currentDate),
    );

    currentDate.setDate(
      currentDate.getDate() + 1,
    );
  }

  return dates;
}

function parseSlotId(
  slotId: string,
): ParsedSlot | null {
  const match = slotId.match(
    /^(\d{4}-\d{2}-\d{2})-period-(\d+)$/,
  );

  if (!match) {
    return null;
  }

  const periodNumber =
    Number(match[2]);

  if (
    !Number.isInteger(
      periodNumber,
    ) ||
    periodNumber <= 0
  ) {
    return null;
  }

  return {
    date: match[1],
    periodNumber,
  };
}

function createAvailabilityMap(
  slotIds: string[],
): Map<string, number[]> {
  const availabilityMap =
    new Map<string, number[]>();

  for (const slotId of slotIds) {
    const parsedSlot =
      parseSlotId(slotId);

    if (!parsedSlot) {
      continue;
    }

    const currentPeriods =
      availabilityMap.get(
        parsedSlot.date,
      ) ?? [];

    if (
      !currentPeriods.includes(
        parsedSlot.periodNumber,
      )
    ) {
      currentPeriods.push(
        parsedSlot.periodNumber,
      );
    }

    availabilityMap.set(
      parsedSlot.date,
      currentPeriods,
    );
  }

  for (
    const [
      date,
      periodNumbers,
    ] of availabilityMap
  ) {
    availabilityMap.set(
      date,
      periodNumbers.sort(
        (periodA, periodB) =>
          periodA - periodB,
      ),
    );
  }

  return availabilityMap;
}

function getStudentKey(
  student: Student,
): string {
  return (
    student.id?.trim() ||
    student.studentNumber
  );
}

function getTeacherKey(
  teacher: Teacher,
): string {
  return (
    teacher.id?.trim() ||
    teacher.teacherNumber
  );
}

function createCourseDays(
  params: BuildAISchedulerInputParams,
): AISchedulerCourseDay[] {
  const courseSettings =
    params.scheduleSettings.courses[
      params.courseType
    ];

  const holidayDates =
    new Set(
      params.scheduleSettings.schoolHolidays.map(
        (holiday) =>
          holiday.date,
      ),
    );

  const periods =
    courseSettings.periods
      .filter(
        (period) =>
          period.isEnabled,
      )
      .map(
        (period) => ({
          periodNumber:
            period.periodNumber,
          startTime:
            period.startTime,
          endTime:
            period.endTime,
        }),
      )
      .sort(
        (periodA, periodB) =>
          periodA.periodNumber -
          periodB.periodNumber,
      );

  return createDateRange(
    courseSettings.startDate,
    courseSettings.endDate,
  ).map((date) => {
    const weekday =
      getWeekday(date);

    const closed =
      holidayDates.has(date) ||
      !courseSettings.enabledWeekdays.includes(
        weekday,
      );

    return {
      date,
      weekday,
      closed,
      periods,
    };
  });
}

function createStudentAvailabilities(
  students: Student[],
  schedules: StudentScheduleValues,
): AISchedulerStudentAvailability[] {
  const availabilities:
    AISchedulerStudentAvailability[] =
      [];

  for (const student of students) {
    const studentKey =
      getStudentKey(student);

    const schedule =
      schedules[studentKey];

    if (!schedule) {
      continue;
    }

    const availabilityMap =
      createAvailabilityMap(
        schedule.availableSlotIds,
      );

    for (
      const [
        date,
        availablePeriodNumbers,
      ] of availabilityMap
    ) {
      availabilities.push({
        studentId: studentKey,
        date,
        availablePeriodNumbers,
      });
    }
  }

  return availabilities;
}

function createTeacherAvailabilities(
  teachers: Teacher[],
  schedules: TeacherScheduleValues,
): AISchedulerTeacherAvailability[] {
  const availabilities:
    AISchedulerTeacherAvailability[] =
      [];

  for (const teacher of teachers) {
    const teacherKey =
      getTeacherKey(teacher);

    const schedule =
      schedules[teacherKey];

    if (!schedule) {
      continue;
    }

    const availabilityMap =
      createAvailabilityMap(
        schedule.availableSlotIds,
      );

    for (
      const [
        date,
        availablePeriodNumbers,
      ] of availabilityMap
    ) {
      availabilities.push({
        teacherId: teacherKey,
        date,
        availablePeriodNumbers,
      });
    }
  }

  return availabilities;
}

function getCurrentTeacherId(
  studentId: string,
  subject: string,
  regularLessons: Lesson[],
): string | undefined {
  const lesson =
    regularLessons.find(
      (regularLesson) =>
        regularLesson.status !==
          "cancelled" &&
        regularLesson.students.some(
          (lessonStudent) =>
            lessonStudent.studentId ===
              studentId &&
            lessonStudent.subject ===
              subject,
        ),
    );

  return (
    lesson?.teacherId ||
    undefined
  );
}

function createStudentRequests(
  students: Student[],
  schedules: StudentScheduleValues,
  regularLessons: Lesson[],
): AISchedulerStudentRequest[] {
  const requests:
    AISchedulerStudentRequest[] =
      [];

  for (const student of students) {
    const studentId =
      getStudentKey(student);

    const schedule =
      schedules[studentId];

    if (!schedule) {
      continue;
    }

    for (
      const [
        subject,
        rawLessonCount,
      ] of Object.entries(
        schedule.requiredLessonCounts,
      )
    ) {
      const lessonCount =
        Math.max(
          0,
          Math.floor(
            rawLessonCount,
          ),
        );

      if (lessonCount === 0) {
        continue;
      }

      requests.push({
        id: `${studentId}__${subject}`,
        studentId,
        studentNumber:
          student.studentNumber,
        studentName:
          student.name,
        grade:
          student.grade,
        subject,
        lessonCount,
        preferredMaximumStudents:
          student.maxStudentsPerLesson,
        currentTeacherId:
          getCurrentTeacherId(
            studentId,
            subject,
            regularLessons,
          ),
        firstChoiceTeacherId:
          student.firstPreferredTeacherId ||
          undefined,
        secondChoiceTeacherId:
          student.secondPreferredTeacherId ||
          undefined,
        excludedTeacherIds: [
          ...student.unavailableTeacherIds,
        ],
      });
    }
  }

  return requests;
}

function createTeachers(
  teachers: Teacher[],
): AISchedulerTeacher[] {
  return teachers.map(
    (teacher) => ({
      id: getTeacherKey(
        teacher,
      ),
      teacherNumber:
        teacher.teacherNumber,
      teacherName:
        teacher.name,
      subjects:
        teacher.subjects.map(
          (subject) => ({
            subject:
              subject.subject,
            grades: [
              ...subject.grades,
            ],
          }),
        ),
    }),
  );
}

function createRegularLessonCopies(
  lessons: Lesson[],
  courseDays: AISchedulerCourseDay[],
  showRegularLessons: boolean,
): Lesson[] {
  if (!showRegularLessons) {
    return [];
  }

  const regularLessons =
    lessons.filter(
      (lesson) =>
        lesson.scheduleMode ===
          "regular" &&
        lesson.status !==
          "cancelled" &&
        lesson.weekday,
    );

  const copiedLessons: Lesson[] =
    [];

  for (const courseDay of courseDays) {
    if (courseDay.closed) {
      continue;
    }

    for (
      const lesson of regularLessons
    ) {
      if (
        lesson.weekday !==
        courseDay.weekday
      ) {
        continue;
      }

      const periodExists =
        courseDay.periods.some(
          (period) =>
            period.periodNumber ===
            lesson.periodNumber,
        );

      if (!periodExists) {
        continue;
      }

      copiedLessons.push({
        ...lesson,
        id: lesson.id
          ? `${lesson.id}__${courseDay.date}`
          : undefined,
        date:
          courseDay.date,
        position: {
          columnId:
            courseDay.date,
          periodId: `period-${lesson.periodNumber}`,
        },
      });
    }
  }

  return copiedLessons;
}

export function buildAISchedulerInput(
  params: BuildAISchedulerInputParams,
): AISchedulerInput {
  const courseSettings =
    params.scheduleSettings.courses[
      params.courseType
    ];

  const activeStudents =
    params.students.filter(
      (student) =>
        student.status === "在籍",
    );

  const activeTeachers =
    params.teachers.filter(
      (teacher) =>
        teacher.status === "在籍",
    );

  const originalRegularLessons =
    params.lessons.filter(
      (lesson) =>
        lesson.scheduleMode ===
          "regular" &&
        lesson.status !==
          "cancelled",
    );

  const courseDays =
    createCourseDays(params);

  const regularLessons =
    createRegularLessonCopies(
      params.lessons,
      courseDays,
      courseSettings.showRegularLessons,
    );

  const existingCourseLessons =
    params.lessons.filter(
      (lesson) =>
        lesson.scheduleMode ===
          "course" &&
        lesson.status !==
          "cancelled" &&
        Boolean(
          lesson.date,
        ) &&
        courseDays.some(
          (courseDay) =>
            courseDay.date ===
            lesson.date,
        ),
    );

  return {
    academicYear:
      params.academicYear,

    courseDays,

    studentRequests:
      createStudentRequests(
        activeStudents,
        params.studentSchedules,
        originalRegularLessons,
      ),

    teachers:
      createTeachers(
        activeTeachers,
      ),

    classrooms:
      params.classrooms.map(
        (classroom) => ({
          id: classroom.id,
          name: classroom.name,
          capacity:
            classroom.capacity,
        }),
      ),

    studentAvailabilities:
      createStudentAvailabilities(
        activeStudents,
        params.studentSchedules,
      ),

    teacherAvailabilities:
      createTeacherAvailabilities(
        activeTeachers,
        params.teacherSchedules,
      ),

    regularLessons,

    existingCourseLessons,

    schoolMaximumStudents:
      courseSettings.lessonRule
        .maxStudentsPerTeacher,

       options: {
      preserveExistingLessons:
        params.preserveExistingLessons,

      scoreSettings:
        normalizeAISchedulerScoreSettings({
          teacherIdleWeight:
            params.scoreSettings
              ?.teacherIdleWeight ??
            courseSettings.aiWeights
              .teacherGap,

          studentIdleWeight:
            params.scoreSettings
              ?.studentIdleWeight ??
            courseSettings.aiWeights
              .studentGap,

          teacherPreferenceWeight:
            params.scoreSettings
              ?.teacherPreferenceWeight ??
            courseSettings.aiWeights
              .teacherPreference,
        }),
    },
  };
}