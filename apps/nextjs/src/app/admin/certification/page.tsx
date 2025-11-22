import { getTotalCourses } from "~/app/actions/certification";
import { CreateCourseForm } from "../_components/create-course-form";
import { MintCertificationForm } from "../_components/mint-certification-form";

export default async function CertificationAdminPage() {
  // Fetch the total number of courses
  const totalCoursesResult = await getTotalCourses();
  const totalCourses = totalCoursesResult.success
    ? totalCoursesResult.data
    : BigInt(0);

  return (
    <div className="container mx-auto space-y-8 py-8">
      <h1 className="text-3xl font-bold">Training Certification Management</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Course Management</h2>
          <CreateCourseForm />
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Certification Minting</h2>
          <MintCertificationForm totalCourses={Number(totalCourses)} />
        </div>
      </div>
    </div>
  );
}
