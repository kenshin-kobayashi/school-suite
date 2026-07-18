export type LessonStudent = {
  studentId: string;
  studentName: string;
  subject: string;
};

export type Lesson = {
  id: string;
  teacherId: string;
  teacherName: string;
  students: LessonStudent[];
};