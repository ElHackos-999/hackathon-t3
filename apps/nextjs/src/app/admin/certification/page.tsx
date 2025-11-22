import { getTotalCourses } from "~/app/actions/certification";
import { CreateCourseForm } from "./_components/create-course-form";
import { MintCertificationForm } from "./_components/mint-certification-form";

export default async function CertificationAdminPage() {
  // Fetch the total number of courses
  const totalCoursesResult = await getTotalCourses();
  const totalCourses =
    totalCoursesResult.success ? totalCoursesResult.data : BigInt(0);

  return (
    <div className="container mx-auto space-y-8 py-8">
      <h1 className="text-3xl font-bold">
        Training Certification Management
      </h1>

      {/* Statistics */}
      <div className="mb-8 rounded-lg border bg-card p-6">
        <h2 className="mb-2 text-xl font-semibold">Statistics</h2>
        <p className="text-muted-foreground">
          Total Courses: {totalCourses.toString()}
        </p>
      </div>

      {/* Create Course Section */}
      <div className="mb-8 rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Create New Course</h2>
        <CreateCourseForm />
      </div>

      {/* Mint Certification Section */}
      <div className="rounded-lg border bg-card p-6">
        <h2 className="mb-4 text-xl font-semibold">Mint Certification</h2>
        <MintCertificationForm totalCourses={Number(totalCourses)} />
      </div>
    </div>
  );
}
