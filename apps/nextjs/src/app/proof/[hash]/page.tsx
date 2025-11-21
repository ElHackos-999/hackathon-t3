"use client";

import { useEffect, useState } from "react";
import { ProofVerificationCard } from "@acme/ui/proof-verification-card";
import { useParams } from "next/navigation";

export default function ProofPage() {
  const params = useParams();
  const hash = params.hash as string;
  
  const [isLoading, setIsLoading] = useState(true);
  const [result, setResult] = useState<any>(null);

  useEffect(() => {
    // Simulate API call
    const verify = async () => {
      setIsLoading(true);
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      // Mock result based on hash
      if (hash === "invalid") {
        setResult({
          valid: false,
          reason: "Proof not found or invalid hash format.",
        });
      } else if (hash === "revoked") {
        setResult({
          valid: false,
          reason: "This proof has been revoked by the user.",
        });
      } else {
        setResult({
          valid: true,
          userName: "Alice User",
          courseName: "Blockchain 101",
          courseCode: "BC101",
          tokenId: 101,
          createdAt: new Date("2023-03-01"),
          expiresAt: new Date("2023-04-01"),
        });
      }
      setIsLoading(false);
    };

    verify();
  }, [hash]);

  return (
    <div className="container mx-auto py-12 flex flex-col items-center justify-center min-h-[60vh]">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Certificate Verification</h1>
        <p className="text-muted-foreground">
          Verifying proof hash: <span className="font-mono bg-muted px-2 py-1 rounded text-sm">{hash}</span>
        </p>
      </div>

      <ProofVerificationCard 
        result={result || { valid: false }} 
        isLoading={isLoading} 
      />
    </div>
  );
}
