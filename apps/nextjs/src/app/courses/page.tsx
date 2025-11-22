import { PublicCourseList } from "@acme/ui/public-course-list";

import { getCourses } from "~/app/actions/courses";

export default async function CoursesPage() {
  const courses = await getCourses();

  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Explore Courses</h1>
      </div>

      <PublicCourseList courses={courses} />
    </div>
  );
}
