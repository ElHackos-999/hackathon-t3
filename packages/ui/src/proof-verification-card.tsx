"use client";

import { AlertTriangle, CheckCircle2, XCircle } from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

interface VerificationResult {
  valid: boolean;
  reason?: string;
  userName?: string;
  courseName?: string;
  courseCode?: string;
  tokenId?: number;
  createdAt?: Date;
  expiresAt?: Date | null;
}

interface ProofVerificationCardProps {
  result: VerificationResult;
  isLoading: boolean;
}

export function ProofVerificationCard({
  result,
  isLoading,
}: ProofVerificationCardProps) {
  if (isLoading) {
    return (
      <Card className="mx-auto w-full max-w-md">
        <CardContent className="pt-6 text-center">
          <div className="animate-pulse space-y-4">
            <div className="bg-muted mx-auto h-12 w-12 rounded-full"></div>
            <div className="bg-muted mx-auto h-4 w-3/4 rounded"></div>
            <div className="bg-muted mx-auto h-4 w-1/2 rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!result.valid) {
    return (
      <Card className="border-destructive/50 bg-destructive/5 mx-auto w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="text-destructive mx-auto mb-2 h-16 w-16" />
          <CardTitle className="text-destructive">Invalid Proof</CardTitle>
          <CardDescription>This proof cannot be verified.</CardDescription>
        </CardHeader>
        <CardContent className="text-center">
          <p className="font-medium">{result.reason || "Unknown error"}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mx-auto w-full max-w-md border-green-500/50 bg-green-500/5">
      <CardHeader className="text-center">
        <CheckCircle2 className="mx-auto mb-2 h-16 w-16 text-green-600" />
        <CardTitle className="text-green-700">Verified Certificate</CardTitle>
        <CardDescription>This proof is valid and authentic.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-1 border-b pb-4 text-center">
          <p className="text-muted-foreground text-sm">Issued To</p>
          <p className="text-lg font-semibold">{result.userName}</p>
        </div>

        <div className="space-y-1 border-b pb-4 text-center">
          <p className="text-muted-foreground text-sm">Course</p>
          <p className="font-semibold">{result.courseName}</p>
          <p className="text-muted-foreground font-mono text-xs">
            {result.courseCode}
          </p>
        </div>

        <div className="grid grid-cols-2 gap-4 text-center">
          <div>
            <p className="text-muted-foreground text-xs">Issued Date</p>
            <p className="text-sm font-medium">
              {result.createdAt?.toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Token ID</p>
            <p className="font-mono text-sm font-medium">#{result.tokenId}</p>
          </div>
        </div>

        {result.expiresAt && (
          <div className="pt-2 text-center">
            <p className="text-muted-foreground text-xs">Expires On</p>
            <p className="text-sm">{result.expiresAt.toLocaleDateString()}</p>
          </div>
        )}
      </CardContent>
      <CardFooter className="text-muted-foreground justify-center text-xs">
        Verified by Course Completion Platform
      </CardFooter>
    </Card>
  );
}
