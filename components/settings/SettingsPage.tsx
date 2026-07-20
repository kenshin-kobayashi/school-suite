"use client";

import { useState } from "react";

import PageHeader from "@/components/common/PageHeader";

import AcademicYearSettings from "./AcademicYearSettings";
import ClassroomSettings from "./ClassroomSettings";
import CourseSettings from "./CourseSettings";
import RegularSettings from "./RegularSettings";
import SettingsNavigation from "./SettingsNavigation";

export type SettingsMenu =
  | "regular"
  | "courses"
  | "classrooms"
  | "academic-year";

export default function SettingsPage() {
  const [selectedMenu, setSelectedMenu] =
    useState<SettingsMenu>("regular");

  return (
    <div className="space-y-6">
      <PageHeader title="設定" />

      <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
        <SettingsNavigation
          selectedMenu={selectedMenu}
          onSelect={setSelectedMenu}
        />

        <main className="min-w-0">
          {selectedMenu === "regular" && (
            <RegularSettings />
          )}

          {selectedMenu === "courses" && (
            <CourseSettings />
          )}

          {selectedMenu === "classrooms" && (
            <ClassroomSettings />
          )}

          {selectedMenu === "academic-year" && (
            <AcademicYearSettings />
          )}
        </main>
      </div>
    </div>
  );
}