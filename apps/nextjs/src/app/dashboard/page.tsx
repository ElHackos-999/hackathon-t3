"use client";

import { useEffect, useState, useTransition } from "react";

import { CompletedCoursesGrid } from "@acme/ui/completed-courses-grid";
import { MyProofsTable } from "@acme/ui/my-proofs-table";

import type { UserCourse } from "~/app/actions/dashboard";
import { getUserCourses } from "~/app/actions/dashboard";

export default function DashboardPage() {
  const [isPending, startTransition] = useTransition();
  const [courses, setCourses] = useState<UserCourse[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    startTransition(async () => {
      try {
        setError(null);
        const userCourses = await getUserCourses();
        setCourses(userCourses);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Failed to fetch courses",
        );
      }
    });
  }, []);

  // Transform courses to the format expected by CompletedCoursesGrid
  const completions = courses.map((course) => {
    const completionDate = new Date();
    const expiryDate = new Date();
    expiryDate.setMonth(expiryDate.getMonth() + 12);

    return {
      id: course.id,
      courseName: course.name,
      courseCode: course.courseCode,
      completionDate,
      imageUri: course.imageUrl,
      tokenId: course.tokenId,
      expiryDate,
      isValid: course.isValid,
    };
  });

  const isLoading = isPending;

  return (
    <div className="mx-auto w-full max-w-[100vw] space-y-8 px-4 py-6 sm:space-y-12 sm:px-6 sm:py-8 lg:max-w-7xl">
      <div>
        <h1 className="mb-2 text-2xl font-bold sm:text-3xl">Dashboard</h1>
        <p className="text-muted-foreground text-sm sm:text-base">
          View your course completions and certifications.
        </p>
      </div>

      <section className="flex w-full flex-col">
        <h2 className="mb-4 text-xl font-semibold sm:mb-6 sm:text-2xl">
          Courses
        </h2>
        {isLoading ? (
          <div className="bg-muted/10 flex min-h-96 w-full items-center justify-center rounded-lg border p-12 text-center">
            <p className="text-muted-foreground text-sm sm:text-base">
              Loading your courses...
            </p>
          </div>
        ) : error ? (
          <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center sm:p-8">
            <p className="text-sm text-red-600 sm:text-base">{error}</p>
          </div>
        ) : (
          <CompletedCoursesGrid completions={completions} />
        )}
      </section>
    </div>
  );
}
