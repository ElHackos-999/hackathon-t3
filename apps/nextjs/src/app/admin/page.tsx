"use client";

import { useState } from "react";

import { AdminMintCertificateCard } from "@acme/ui/admin-mint-certificate-card";
import { CourseFormCard } from "@acme/ui/course-form-card";

export default function AdminPage() {
  // Mock state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMinting, setIsMinting] = useState(false);

  const handleCreateCourse = async (data: any) => {
    setIsSubmitting(true);
    console.log("Creating course:", data);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsSubmitting(false);
    alert("Course created! (Check console)");
  };

  const handleMint = async (userEmail: string, courseCode: string) => {
    setIsMinting(true);
    console.log("Minting certificate:", { userEmail, courseCode });
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsMinting(false);
    alert("Certificate minted! (Check console)");
  };

  return (
    <div className="container mx-auto space-y-8 py-8">
      <h1 className="text-3xl font-bold">Admin Dashboard</h1>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <h2 className="mb-4 text-xl font-semibold">Course Management</h2>
          <CourseFormCard
            onSubmit={handleCreateCourse}
            isSubmitting={isSubmitting}
          />
        </div>

        <div>
          <h2 className="mb-4 text-xl font-semibold">Minting</h2>
          <AdminMintCertificateCard
            users={[
              { id: "1", email: "user@example.com", name: "Alice User" },
              { id: "2", email: "bob@example.com", name: "Bob User" },
            ]}
            courses={[
              { id: "1", courseCode: "BC101", courseName: "Blockchain 101" },
              { id: "2", courseCode: "ETH201", courseName: "Ethereum Dev" },
            ]}
            onMint={handleMint}
            isLoading={isMinting}
          />
        </div>
      </div>
    </div>
  );
}
