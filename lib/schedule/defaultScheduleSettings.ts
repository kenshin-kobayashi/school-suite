import type {
  AiScheduleWeights,
  CourseScheduleSettings,
  CourseType,
  LessonPeriod,
  ScheduleSettings,
} from "@/types/schedule-settings";

const defaultAiWeights: AiScheduleWeights = {
  teacherGap: 35,
  studentGap: 35,
  teacherPreference: 30,
};

const regularPeriods: LessonPeriod[] = [
  {
    id: "regular-period-1",
    periodNumber: 1,
    startTime: "13:00",
    endTime: "14:20",
    isEnabled: true,
  },
  {
    id: "regular-period-2",
    periodNumber: 2,
    startTime: "14:30",
    endTime: "15:50",
    isEnabled: true,
  },
  {
    id: "regular-period-3",
    periodNumber: 3,
    startTime: "16:00",
    endTime: "17:20",
    isEnabled: true,
  },
  {
    id: "regular-period-4",
    periodNumber: 4,
    startTime: "17:30",
    endTime: "18:50",
    isEnabled: true,
  },
  {
    id: "regular-period-5",
    periodNumber: 5,
    startTime: "19:00",
    endTime: "20:20",
    isEnabled: true,
  },
];

const createCoursePeriods = (
  courseType: CourseType,
): LessonPeriod[] => [
  {
    id: `${courseType}-period-1`,
    periodNumber: 1,
    startTime: "09:00",
    endTime: "10:20",
    isEnabled: true,
  },
  {
    id: `${courseType}-period-2`,
    periodNumber: 2,
    startTime: "10:30",
    endTime: "11:50",
    isEnabled: true,
  },
  {
    id: `${courseType}-period-3`,
    periodNumber: 3,
    startTime: "13:00",
    endTime: "14:20",
    isEnabled: true,
  },
  {
    id: `${courseType}-period-4`,
    periodNumber: 4,
    startTime: "14:30",
    endTime: "15:50",
    isEnabled: true,
  },
  {
    id: `${courseType}-period-5`,
    periodNumber: 5,
    startTime: "16:00",
    endTime: "17:20",
    isEnabled: true,
  },
  {
    id: `${courseType}-period-6`,
    periodNumber: 6,
    startTime: "17:30",
    endTime: "18:50",
    isEnabled: true,
  },
  {
    id: `${courseType}-period-7`,
    periodNumber: 7,
    startTime: "19:00",
    endTime: "20:20",
    isEnabled: true,
  },
];

const createCourseSettings = (
  courseType: CourseType,
  startDate = "",
  endDate = "",
): CourseScheduleSettings => ({
  mode: "course",

  courseType,

  startDate,

  endDate,

  /**
   * 初期状態では通常授業を講習画面へ反映します。
   *
   * 設定画面のオン・オフで変更できます。
   */
  showRegularLessons: true,

  enabledWeekdays: [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
  ],

  lessonRule: {
    lessonDurationMinutes: 80,
    maxStudentsPerTeacher: 2,
  },

  /**
   * AI時間割作成時の評価配分です。
   *
   * 3項目の合計は100点にします。
   */
  aiWeights: {
    ...defaultAiWeights,
  },

  periods:
    createCoursePeriods(courseType),
});

export const defaultScheduleSettings: ScheduleSettings = {
  id: "system",

  regular: {
    mode: "regular",

    enabledWeekdays: [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
    ],

    lessonRule: {
      lessonDurationMinutes: 80,
      maxStudentsPerTeacher: 2,
    },

    periods: regularPeriods,
  },

  courses: {
    spring:
      createCourseSettings(
        "spring",
      ),

    summer:
      createCourseSettings(
        "summer",
        "2026-07-20",
        "2026-08-31",
      ),

    winter:
      createCourseSettings(
        "winter",
      ),

    other:
      createCourseSettings(
        "other",
      ),
  },

  /**
   * 休塾日一覧
   */
  schoolHolidays: [],
};