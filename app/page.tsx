"use client";

import { useEffect, useState } from "react";

import Header from "@/components/dashboard/Header";
import RecentActivity from "@/components/dashboard/RecentActivity";
import StatCard from "@/components/dashboard/StatCard";
import WelcomeCard from "@/components/dashboard/WelcomeCard";

import { getStudents } from "@/lib/firebase/students";
import { getTeachers } from "@/lib/firebase/teachers";

export default function DashboardPage() {
  const [activeStudentCount, setActiveStudentCount] = useState<number | null>(
    null
  );
  const [activeTeacherCount, setActiveTeacherCount] = useState<number | null>(
    null
  );
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setError("");

        const [students, teachers] = await Promise.all([
          getStudents(),
          getTeachers(),
        ]);

        const studentCount = students.filter(
          (student) => student.status === "在籍"
        ).length;

        const teacherCount = teachers.filter(
          (teacher) => teacher.status === "在籍"
        ).length;

        setActiveStudentCount(studentCount);
        setActiveTeacherCount(teacherCount);
      } catch (error) {
        console.error("ダッシュボードデータの取得に失敗しました。", error);

        setError("ダッシュボードの情報を取得できませんでした。");
        setActiveStudentCount(0);
        setActiveTeacherCount(0);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-8">
      <Header />

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 px-5 py-4 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        <StatCard
          title="在籍生徒"
          value={
            activeStudentCount === null
              ? "読み込み中..."
              : `${activeStudentCount}人`
          }
        />

        <StatCard
          title="在籍講師"
          value={
            activeTeacherCount === null
              ? "読み込み中..."
              : `${activeTeacherCount}人`
          }
        />

        <StatCard title="本日の授業" value="0コマ" />

        <StatCard title="空き教室" value="0室" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.4fr_1fr]">
        <RecentActivity />

        <WelcomeCard />
      </div>
    </div>
  );
}