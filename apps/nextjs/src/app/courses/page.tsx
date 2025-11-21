"use client";

import { PublicCourseList } from "@acme/ui/public-course-list";

export default function CoursesPage() {
  return (
    <div className="container mx-auto space-y-8 py-8">
      <div className="space-y-4 text-center">
        <h1 className="text-4xl font-bold">Explore Our Courses</h1>
        <p className="text-muted-foreground mx-auto max-w-2xl text-xl">
          Complete these courses to earn verifiable on-chain certificates.
        </p>
      </div>

      <PublicCourseList
        courses={[
          {
            id: "1",
            courseCode: "BC101",
            courseName: "Blockchain 101",
            description:
              "A comprehensive introduction to blockchain technology, covering history, cryptography, and consensus mechanisms.",
            imageUri: "https://placehold.co/600x400/png",
            contractAddress: "0x1234...5678",
          },
          {
            id: "2",
            courseCode: "ETH201",
            courseName: "Ethereum Development",
            description:
              "Learn to build decentralized applications on Ethereum using Solidity and Hardhat.",
            imageUri: "https://placehold.co/600x400/png",
            contractAddress: "0x8765...4321",
          },
          {
            id: "3",
            courseCode: "SOL301",
            courseName: "Solana Development",
            description:
              "Master Solana development with Rust and Anchor framework.",
            imageUri: "https://placehold.co/600x400/png",
            contractAddress: "0x9999...8888",
          },
        ]}
      />
    </div>
  );
}
