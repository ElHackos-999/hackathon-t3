import { getTotalCourses } from "~/app/actions/certification";
import { CreateCourseForm } from "./_components/create-course-form";
import { MintCertificationForm } from "./_components/mint-certification-form";

export default async function CertificationAdminPage() {
  // Fetch the total number of courses
  const totalCoursesResult = await getTotalCourses();
  const totalCourses = totalCoursesResult.success
    ? totalCoursesResult.data
    : BigInt(0);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="mb-6 text-3xl font-bold">
        Training Certification Management
      </h1>

      {/* Statistics */}
      <div className="bg-card mb-8 rounded-lg border p-6">
        <h2 className="mb-2 text-xl font-semibold">Statistics</h2>
        <p className="text-muted-foreground">
          Total Courses: {totalCourses.toString()}
        </p>
      </div>

      {/* Create Course Section */}
      <div className="bg-card mb-8 rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Create New Course</h2>
        <CreateCourseForm />
      </div>

      {/* Mint Certification Section */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="mb-4 text-xl font-semibold">Mint Certification</h2>
        <MintCertificationForm totalCourses={Number(totalCourses)} />
      </div>
    </div>
  );
}
