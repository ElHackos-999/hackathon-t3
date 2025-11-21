"use client";

import { useState } from "react";

import { CompletedCoursesGrid } from "@acme/ui/completed-courses-grid";
import { MyProofsTable } from "@acme/ui/my-proofs-table";

export default function DashboardPage() {
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [isRevoking, setIsRevoking] = useState<string | null>(null);

  const handleGenerateProof = async (completionId: string) => {
    setIsGenerating(completionId);
    console.log("Generating proof for:", completionId);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsGenerating(null);
    alert("Proof generated! (Check console)");
  };

  const handleRevokeProof = async (proofId: string) => {
    setIsRevoking(proofId);
    console.log("Revoking proof:", proofId);
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setIsRevoking(null);
    alert("Proof revoked! (Check console)");
  };

  return (
    <div className="container mx-auto space-y-12 py-8">
      <div>
        <h1 className="mb-2 text-3xl font-bold">My Learning Dashboard</h1>
        <p className="text-muted-foreground">
          Manage your course completions and certificates.
        </p>
      </div>

      <section>
        <h2 className="mb-6 text-2xl font-semibold">Completed Courses</h2>
        <CompletedCoursesGrid
          completions={[
            {
              id: "1",
              courseName: "Blockchain 101",
              courseCode: "BC101",
              completionDate: new Date("2023-01-15"),
              imageUri: "https://placehold.co/600x400/png",
              tokenId: 101,
            },
            {
              id: "2",
              courseName: "Ethereum Development",
              courseCode: "ETH201",
              completionDate: new Date("2023-02-20"),
              imageUri: "https://placehold.co/600x400/png",
              tokenId: 102,
            },
          ]}
          onGenerateProof={handleGenerateProof}
          isGenerating={isGenerating}
        />
      </section>

      <section>
        <h2 className="mb-6 text-2xl font-semibold">My Active Proofs</h2>
        <MyProofsTable
          proofs={[
            {
              id: "p1",
              proofHash: "abc-123-def",
              courseName: "Blockchain 101",
              createdAt: new Date("2023-03-01"),
              expiresAt: new Date("2023-04-01"),
              isRevoked: false,
              proofUrl: "http://localhost:3000/proof/abc-123-def",
            },
            {
              id: "p2",
              proofHash: "xyz-789-ghi",
              courseName: "Ethereum Development",
              createdAt: new Date("2023-03-05"),
              expiresAt: null,
              isRevoked: true,
              proofUrl: "http://localhost:3000/proof/xyz-789-ghi",
            },
          ]}
          onRevoke={handleRevokeProof}
          isRevoking={isRevoking}
        />
      </section>
    </div>
  );
}
